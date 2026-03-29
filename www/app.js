// Mobile UI logic: load channels from data/channels.json, render categories, channels and modal player

async function fetchChannelsData() {
  try {
    const res = await fetch('/data/channels.json');
    if (!res.ok) throw new Error('Failed to fetch channels.json: ' + res.status);
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

function mountUI(channelsData) {
  const categories = channelsData.categories || [];

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

  // Render categories
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
    (cat.channels || []).forEach(ch => {
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
  let currentHls = null;
  function openChannel(ch) {
    modalChannelTitle.textContent = ch.name;
    modalChannelSub.textContent = ch.sub || 'Live';
    playerModal.hidden = false;
    playerModal.setAttribute('aria-hidden', 'false');
    playHlsInElement(ch.stream, modalVideo);
  }

  // Close player
  function closeModal() {
    playerModal.hidden = true;
    playerModal.setAttribute('aria-hidden', 'true');
    try { if (currentHls) { currentHls.destroy(); currentHls = null; } } catch(e){}
    modalVideo.pause();
    modalVideo.removeAttribute('src');
  }
  closePlayer.addEventListener('click', closeModal);
  playerModal.addEventListener('click', (e) => { if (e.target === playerModal) closeModal(); });

  // Play HLS into a video element using Hls.js fallback
  function playHlsInElement(src, videoEl) {
    // destroy previous instance if any
    try { if (currentHls) { currentHls.destroy(); currentHls = null; } } catch(e){}

    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = src;
      videoEl.play().catch(()=>{});
    } else if (window.Hls && Hls.isSupported()) {
      const hls = new Hls();
      currentHls = hls;
      hls.loadSource(src);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { videoEl.play().catch(()=>{}); });
    } else {
      alert('HLS playback is not supported in this browser.');
    }
  }

  // Basic nav and filters behavior
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
        // highlights or others - show categories for now
        categoriesView.hidden = false; channelsView.hidden = true; eventsView.hidden = true;
      }
    });
  });

  // Top filters
  document.querySelectorAll('.filter').forEach(f => {
    f.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
      f.classList.add('active');
      const filter = f.dataset.filter;
      if (filter === 'all') { categoriesView.hidden = false; channelsView.hidden = true; eventsView.hidden = true; }
      else {
        const found = categories.find(c => c.id === filter || c.title.toLowerCase() === filter);
        if (found) openCategory(found);
        else { categoriesView.hidden = true; channelsView.hidden = true; eventsView.hidden = false; }
      }
    });
  });

  // initial render
  renderCategories();
}

// Kick off
(async function init(){
  const data = await fetchChannelsData();
  if (!data) {
    document.getElementById('categories-view').innerHTML = '<div style="padding:20px;color:#ccc">Failed to load channels data.</div>';
    return;
  }
  mountUI(data);
})();