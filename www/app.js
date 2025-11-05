// Mobile UI logic: categories, channels and modal player
document.addEventListener('DOMContentLoaded', () => {
  // Categories with nested channels
  const categories = [
    {
      id: 'sports', title: 'Sports', img: 'https://via.placeholder.com/200x200.png?text=Sports', channels: [
        { id: 'crichd', name: 'CRICHD', thumb: 'https://via.placeholder.com/200x200.png?text=CRICHD', stream: '/hls/crichd.m3u8' },
        { id: 'fancode', name: 'FANCode', thumb: 'https://via.placeholder.com/200x200.png?text=Fancode', stream: '/hls/fancode.m3u8' },
        { id: 'yupptv', name: 'YUPPTV', thumb: 'https://via.placeholder.com/200x200.png?text=YUPPTV', stream: '/hls/yupptv.m3u8' }
      ]
    },
    {
      id: 'countries', title: 'Countries', img: 'https://via.placeholder.com/200x200.png?text=Countries', channels: [
        { id: 'india', name: 'India', thumb: 'https://via.placeholder.com/200x200.png?text=India', stream: '/hls/india.m3u8' },
        { id: 'uk', name: 'UK', thumb: 'https://via.placeholder.com/200x200.png?text=UK', stream: '/hls/uk.m3u8' },
        { id: 'usa', name: 'United States', thumb: 'https://via.placeholder.com/200x200.png?text=USA', stream: '/hls/usa.m3u8' }
      ]
    },
    { id: 'news', title: 'News', img: 'https://via.placeholder.com/200x200.png?text=News', channels: [
        { id: 'genz-news', name: 'Genz News', thumb: 'https://via.placeholder.com/200x200.png?text=Genz+News', stream: '/hls/genznews.m3u8' }
      ]
    },
    { id: 'kids', title: 'Kids', img: 'https://via.placeholder.com/200x200.png?text=Kids', channels: [
        { id: 'kids-1', name: 'Kids Channel', thumb: 'https://via.placeholder.com/200x200.png?text=Kids', stream: '/hls/kids.m3u8' }
      ]
    }
  ];

  const categoriesView = document.getElementById('categories-view');
  const channelsView = document.getElementById('channels-view');
  const channelsList = document.getElementById('channels-list');
  const channelsTitle = document.getElementById('channels-title');
  const backToCatsBtn = document.getElementById('back-to-cats');

  const playerModal = document.getElementById('player-modal');
  const modalVideo = document.getElementById('modal-video');
  const closePlayer = document.getElementById('close-player');
  const modalChannelTitle = document.getElementById('modal-channel-title');
  const modalChannelSub = document.getElementById('modal-channel-sub');

  // Render categories as tiles
  function renderCategories() {
    categoriesView.innerHTML = '';
    categories.forEach(cat => {
      const card = document.createElement('button');
      card.className = 'cat-card';
      card.type = 'button';
      card.setAttribute('data-id', cat.id);
      card.innerHTML = `
        <div class="round"><img src="${cat.img}" alt="${cat.title}" /></div>
        <div class="cat-title">${cat.title}</div>
      `;
      card.addEventListener('click', () => openCategory(cat));
      categoriesView.appendChild(card);
    });
  }

  // Open category -> show channels
  function openCategory(cat) {
    categoriesView.hidden = true;
    channelsView.hidden = false;
    channelsTitle.textContent = cat.title;
    channelsList.innerHTML = '';
    cat.channels.forEach(ch => {
      const card = document.createElement('button');
      card.className = 'cat-card';
      card.type = 'button';
      card.innerHTML = `
        <div class="round"><img src="${ch.thumb}" alt="${ch.name}" /></div>
        <div class="cat-title">${ch.name}</div>
      `;
      card.addEventListener('click', () => openChannel(ch));
      channelsList.appendChild(card);
    });
  }

  // Back to categories
  backToCatsBtn.addEventListener('click', () => {
    channelsView.hidden = true;
    categoriesView.hidden = false;
  });

  // Open channel -> show modal player and play HLS stream
  function openChannel(ch) {
    modalChannelTitle.textContent = ch.name;
    modalChannelSub.textContent = 'Live';
    playerModal.hidden = false;
    playerModal.setAttribute('aria-hidden', 'false');
    playHlsInElement(ch.stream, modalVideo);
  }

  // Close player
  closePlayer.addEventListener('click', closeModal);
  playerModal.addEventListener('click', (e) => { if (e.target === playerModal) closeModal(); });

  function closeModal() {
    playerModal.hidden = true;
    playerModal.setAttribute('aria-hidden', 'true');
    try { if (Hls && Hls.isSupported()) { if (window._hlsInstance) { window._hlsInstance.destroy(); window._hlsInstance = null; } } } catch(e){}
    modalVideo.pause();
    modalVideo.removeAttribute('src');
  }

  // Play HLS into a video element using Hls.js fallback
  function playHlsInElement(src, videoEl) {
    // destroy previous instance if any
    try { if (window._hlsInstance) { window._hlsInstance.destroy(); window._hlsInstance = null; } } catch(e){}

    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = src;
      videoEl.play().catch(()=>{});
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      window._hlsInstance = hls;
      hls.loadSource(src);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { videoEl.play().catch(()=>{}); });
    } else {
      alert('HLS playback is not supported in this browser.');
    }
  }

  // Init
  renderCategories();

  // Basic nav and filters behavior (reuse existing handlers)
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-view');
      if (view === 'categories') {
        categoriesView.hidden = false; channelsView.hidden = true; eventsView.hidden = true;
      } else if (view === 'events') {
        categoriesView.hidden = true; channelsView.hidden = true; eventsView.hidden = false;
      } else {
        alert('Open: ' + view);
      }
    });
  });

  // Top filters
  document.querySelectorAll('.filter').forEach(f => {
    f.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
      f.classList.add('active');
      // Filter behavior: if specific filter selected, try to open matching category
      const filter = f.dataset.filter;
      if (filter === 'all') { categoriesView.hidden = false; channelsView.hidden = true; eventsView.hidden = true; }
      else {
        const found = categories.find(c => c.id === filter || c.title.toLowerCase() === filter);
        if (found) openCategory(found);
        else { categoriesView.hidden = true; channelsView.hidden = true; eventsView.hidden = false; }
      }
    });
  });

});