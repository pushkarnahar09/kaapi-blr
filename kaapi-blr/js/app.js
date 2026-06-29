/* ===== ART PATTERNS ===== */
const ART = [
  (c, bg) => `<svg viewBox="0 0 320 126" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="background:${bg}">
    <circle cx="160" cy="63" r="70" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.28"/>
    <circle cx="160" cy="63" r="48" fill="none" stroke="${c}" stroke-width="2" opacity="0.32"/>
    <circle cx="160" cy="63" r="28" fill="${c}" opacity="0.16"/>
    <path d="M 160 -10 Q 200 26 160 63 Q 120 100 160 136" fill="none" stroke="${c}" stroke-width="3" opacity="0.38"/>
  </svg>`,
  (c, bg) => `<svg viewBox="0 0 320 126" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="background:${bg}">
    <path d="M-10 52 Q 70 14 150 52 Q 230 90 320 52" fill="none" stroke="${c}" stroke-width="3" opacity="0.28"/>
    <path d="M-10 74 Q 70 36 150 74 Q 230 112 320 74" fill="none" stroke="${c}" stroke-width="2" opacity="0.2"/>
    <path d="M-10 30 Q 70 -8 150 30 Q 230 68 320 30" fill="none" stroke="${c}" stroke-width="2" opacity="0.18"/>
    <circle cx="158" cy="62" r="30" fill="${c}" opacity="0.11"/>
  </svg>`,
  (c, bg) => `<svg viewBox="0 0 320 126" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="background:${bg}">
    <ellipse cx="55"  cy="80" rx="18" ry="26" fill="${c}" opacity="0.22" transform="rotate(-30 55 80)"/>
    <ellipse cx="122" cy="36" rx="14" ry="20" fill="${c}" opacity="0.18" transform="rotate(22 122 36)"/>
    <ellipse cx="168" cy="82" rx="23" ry="31" fill="${c}" opacity="0.26" transform="rotate(-10 168 82)"/>
    <ellipse cx="245" cy="45" rx="16" ry="23" fill="${c}" opacity="0.20" transform="rotate(35 245 45)"/>
    <ellipse cx="282" cy="98" rx="12" ry="18" fill="${c}" opacity="0.16" transform="rotate(-22 282 98)"/>
  </svg>`,
  (c, bg) => `<svg viewBox="0 0 320 126" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="background:${bg}">
    <path d="M100 130 Q 88 100 100 72 Q 112 44 100 16" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="0.26"/>
    <path d="M160 130 Q 148 100 160 72 Q 172 44 160 16" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="0.26"/>
    <path d="M220 130 Q 208 100 220 72 Q 232 44 220 16" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="0.26"/>
    <rect x="82" y="108" width="156" height="16" rx="8" fill="${c}" opacity="0.18"/>
  </svg>`,
  (c, bg) => `<svg viewBox="0 0 320 126" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="background:${bg}">
    <circle cx="160" cy="63" r="58" fill="none" stroke="${c}" stroke-width="2" opacity="0.20"/>
    <circle cx="160" cy="63" r="40" fill="none" stroke="${c}" stroke-width="2" opacity="0.26"/>
    <circle cx="160" cy="63" r="23" fill="none" stroke="${c}" stroke-width="2" opacity="0.32"/>
    <circle cx="160" cy="63" r="9" fill="${c}" opacity="0.38"/>
    <line x1="160" y1="5"   x2="160" y2="121" stroke="${c}" stroke-width="1.5" opacity="0.16"/>
    <line x1="102" y1="63"  x2="218" y2="63"  stroke="${c}" stroke-width="1.5" opacity="0.16"/>
  </svg>`,
];

/* ===== CAFE DATA ===== */
// ALL_CAFES starts from bundled cafes.js, then gets replaced by data/cafes.json on load
let ALL_CAFES = typeof CAFES !== 'undefined' ? CAFES : [];

async function loadCafes() {
  try {
    const res = await fetch('./data/cafes.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) ALL_CAFES = data;
    }
  } catch (_) {
    // Offline or fetch failed — bundled CAFES in cafes.js remains the fallback
  }
}

/* ===== STATE ===== */
const S = {
  view:    'home',
  filter:  'all',
  search:  '',
  saved:   JSON.parse(localStorage.getItem('kaapi-saved') || '[]'),
  userLat: null, userLng: null,
  map:     null,
  markers: [],
  deferredInstallPrompt: null,
};

/* ===== UTILS ===== */
function mapsUrl(cafe) {
  return 'https://www.google.com/maps/search/' + encodeURIComponent(cafe.mapsQuery);
}
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function fmtDist(km) {
  return km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km';
}
function isSaved(id) { return S.saved.includes(id); }
function toggleSave(id, e) {
  if (e) { e.stopPropagation(); }
  if (isSaved(id)) {
    S.saved = S.saved.filter(x => x !== id);
  } else {
    S.saved = [...S.saved, id];
  }
  localStorage.setItem('kaapi-saved', JSON.stringify(S.saved));
  document.querySelectorAll(`[data-save-id="${id}"]`).forEach(el => {
    el.classList.toggle('saved', isSaved(id));
    el.querySelector('svg use').setAttribute('href', isSaved(id) ? '#ic-heart-filled' : '#ic-heart');
  });
  if (S.view === 'saved') renderSaved();
}

/* ===== FILTER ===== */
function filterCafes() {
  let list = ALL_CAFES.slice();
  const q = S.search.trim().toLowerCase();
  if (q) {
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.area.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q)) ||
      c.vibe.toLowerCase().includes(q)
    );
  }
  if (S.filter !== 'all') {
    if (S.filter === 'near') {
      if (S.userLat !== null) {
        list = list.filter(c => haversine(S.userLat, S.userLng, c.lat, c.lng) < 2);
      }
    } else {
      list = list.filter(c => c.types.includes(S.filter));
    }
  }
  return list;
}

/* ===== RENDER CARD ===== */
function cardHtml(cafe, dist) {
  const art = ART[cafe.artPattern % ART.length](cafe.artColor, cafe.artBg);
  const distLabel = dist !== null ? fmtDist(dist) : (cafe.isNew ? '' : '');
  const saved = isSaved(cafe.id);
  const heartHref = saved ? '#ic-heart-filled' : '#ic-heart';
  const tagHtml = cafe.tags.map(t => {
    const cls = t.toLowerCase().includes('matcha') ? 'tag matcha-tag' :
                (t === 'Roastery' || t === 'Filter Coffee' || t === 'Traditional') ? 'tag coffee-tag' : 'tag';
    return `<span class="${cls}">${t}</span>`;
  }).join('');
  return `
<article class="cafe-card" data-id="${cafe.id}" tabindex="0" role="button" aria-label="View details for ${cafe.name}">
  <div class="card-art">
    ${art}
    <div class="card-top-badges">
      ${distLabel ? `<span class="badge-dist">${distLabel}</span>` : '<span></span>'}
      ${cafe.isNew ? '<span class="badge-new">New</span>' : ''}
    </div>
    <button class="btn-save ${saved ? 'saved' : ''}" data-save-id="${cafe.id}" aria-label="${saved ? 'Remove from saved' : 'Save cafe'}">
      <svg width="16" height="16"><use href="${heartHref}"/></svg>
    </button>
  </div>
  <div class="card-body">
    <div class="card-top">
      <div class="card-name-wrap">
        <h3 class="card-name">${cafe.name}</h3>
        <div class="card-area">
          <svg width="12" height="12"><use href="#ic-pin"/></svg>${cafe.area}
        </div>
      </div>
      <div class="card-rating">
        <svg class="rating-star" width="13" height="13"><use href="#ic-star"/></svg>
        <span class="rating-num">${cafe.rating}</span>
      </div>
    </div>
    <div class="card-tags">${tagHtml}</div>
    <div class="card-footer">
      <a href="${cafe.igUrl}" class="card-ig" target="_blank" rel="noopener" aria-label="Instagram ${cafe.ig}">
        <svg width="13" height="13"><use href="#ic-instagram"/></svg>
        <span>${cafe.ig}</span>
      </a>
      <a href="${mapsUrl(cafe)}" class="btn-maps" target="_blank" rel="noopener" aria-label="Open ${cafe.name} in Google Maps">
        <svg width="13" height="13"><use href="#ic-external"/></svg>Maps
      </a>
    </div>
  </div>
</article>`;
}

/* ===== RENDER HOME ===== */
function renderHome() {
  const list = filterCafes();
  const grid = document.getElementById('cafe-grid');
  const count = document.getElementById('result-count');
  count.textContent = list.length === 0 ? 'No results' : `${list.length} spot${list.length !== 1 ? 's' : ''} in Bengaluru`;
  if (list.length === 0) {
    grid.innerHTML = `<div class="no-results"><strong>Nothing matched</strong>Try a different filter or search term</div>`;
    return;
  }
  grid.innerHTML = list.map(c => {
    const dist = S.userLat !== null ? haversine(S.userLat, S.userLng, c.lat, c.lng) : null;
    return cardHtml(c, dist);
  }).join('');
  grid.querySelectorAll('.cafe-card').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.btn-save') || e.target.closest('.card-ig') || e.target.closest('.btn-maps')) return;
      openModal(el.dataset.id);
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(el.dataset.id); });
  });
  grid.querySelectorAll('.btn-save').forEach(el => {
    el.addEventListener('click', e => toggleSave(el.dataset.saveId, e));
  });
}

/* ===== RENDER DISCOVER ===== */
function renderDiscover() {
  const trending = ALL_CAFES.filter(c => c.isTrending || c.isNew);
  const all = [...trending, ...ALL_CAFES.filter(c => !c.isTrending && !c.isNew)];
  const tiles = all.slice(0, 8).map((c, i) => {
    const art = ART[c.artPattern % ART.length](c.artColor, c.artBg);
    const badge = c.isTrending ? 'Trending' : c.isNew ? 'New' : null;
    const badgeCls = (c.artColor.includes('BA75') || c.artColor.includes('888')) ? 'disc-badge coffee-badge' : 'disc-badge';
    return `
<div class="disc-tile" data-id="${c.id}" role="button" tabindex="0" aria-label="View ${c.name}">
  <div class="disc-art">${art}</div>
  ${badge ? `<div class="${badgeCls}">${badge}</div>` : ''}
  <div class="disc-overlay">
    <span class="disc-name">${c.name}</span>
    <span class="disc-handle">${c.ig}</span>
  </div>
</div>`;
  }).join('');
  document.getElementById('discover-content').innerHTML = `
<div class="discover-wrap">
  <div class="discover-header">
    <div class="discover-title-group">
      <div class="discover-title">Trending in BLR</div>
      <div class="discover-sub">Spotted on Instagram this week</div>
    </div>
    <div class="live-badge"><div class="live-dot"></div>Live</div>
  </div>
  <div class="disc-grid">${tiles}</div>
  <div class="discover-ig-cta">
    <div class="cta-title">How Kaapi finds new spots</div>
    <div class="cta-text">We scan Instagram posts tagged with these hashtags and location tags to surface new and trending cafes in real time.</div>
    <div class="cta-tags">
      <span class="cta-tag">#BengaluruCafe</span>
      <span class="cta-tag">#BlrCoffee</span>
      <span class="cta-tag">#KaapiBLR</span>
      <span class="cta-tag">#NammaBengaluru</span>
    </div>
    <a href="https://www.instagram.com/" class="cta-follow" target="_blank" rel="noopener">
      <svg width="16" height="16"><use href="#ic-instagram"/></svg>
      Follow @kaapiblr
    </a>
  </div>
</div>`;
  document.querySelectorAll('.disc-tile').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.id));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(el.dataset.id); });
  });
}

/* ===== RENDER SAVED ===== */
function renderSaved() {
  const el = document.getElementById('saved-content');
  if (S.saved.length === 0) {
    el.innerHTML = `
<div class="saved-empty">
  <div class="saved-empty-icon"><svg width="30" height="30"><use href="#ic-heart"/></svg></div>
  <div class="saved-empty-title">Nothing saved yet</div>
  <div class="saved-empty-text">Tap the heart on any cafe card<br>to save it here for quick access.</div>
</div>`;
    return;
  }
  const savedCafes = ALL_CAFES.filter(c => S.saved.includes(c.id));
  el.innerHTML = `<div class="saved-inner">
    <div class="saved-section-title">${savedCafes.length} saved spot${savedCafes.length !== 1 ? 's' : ''}</div>
    <div class="cafe-grid" id="saved-grid">
      ${savedCafes.map(c => cardHtml(c, null)).join('')}
    </div>
  </div>`;
  el.querySelectorAll('.cafe-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-save') || e.target.closest('.card-ig') || e.target.closest('.btn-maps')) return;
      openModal(card.dataset.id);
    });
  });
  el.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', e => toggleSave(btn.dataset.saveId, e));
  });
}

/* ===== MODAL ===== */
function openModal(id) {
  const cafe = ALL_CAFES.find(c => c.id === id);
  if (!cafe) return;
  const art = ART[cafe.artPattern % ART.length](cafe.artColor, cafe.artBg);
  const saved = isSaved(cafe.id);
  const tagHtml = cafe.tags.map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('modal-body').innerHTML = `
<div class="modal-art" style="background:${cafe.artBg}">
  <svg class="modal-art-svg" viewBox="0 0 320 210" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    ${ART[cafe.artPattern % ART.length](cafe.artColor, 'transparent').replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </svg>
  <button class="modal-save-btn ${saved ? 'saved' : ''}" id="modal-save-btn" data-save-id="${cafe.id}" aria-label="${saved ? 'Remove from saved' : 'Save'}">
    <svg width="18" height="18"><use href="${saved ? '#ic-heart-filled' : '#ic-heart'}"/></svg>
  </button>
  <button class="modal-close-btn" id="modal-close-btn" aria-label="Close">
    <svg width="16" height="16"><use href="#ic-x"/></svg>
  </button>
</div>
<div class="modal-info">
  <div class="modal-name">${cafe.name}</div>
  <div class="modal-meta">
    <div class="modal-area">
      <svg width="13" height="13"><use href="#ic-pin"/></svg>${cafe.area}
    </div>
    <div class="modal-rating">
      <svg class="rating-star" width="13" height="13"><use href="#ic-star"/></svg>
      <span class="modal-rating-num">${cafe.rating}</span>
      <span class="modal-reviews">(${cafe.reviews.toLocaleString()})</span>
    </div>
    <div class="modal-price">${cafe.priceRange}</div>
  </div>
  <div class="modal-tags">${tagHtml}</div>
</div>
<div class="modal-divider"></div>
<div class="modal-section">
  <div class="modal-section-label">The vibe</div>
  <div class="modal-section-text">${cafe.vibe}</div>
</div>
<div class="modal-section">
  <div class="modal-section-label">Must try</div>
  <div class="modal-must-try">${cafe.mustTry}</div>
</div>
<div class="modal-section">
  <div class="modal-section-label">Hours</div>
  <div class="modal-hours-row">
    <svg width="15" height="15"><use href="#ic-clock"/></svg>
    ${cafe.hours}
  </div>
</div>
<div class="modal-actions">
  <a href="${mapsUrl(cafe)}" class="btn-primary" target="_blank" rel="noopener">
    <svg width="18" height="18"><use href="#ic-external"/></svg>Open in Google Maps
  </a>
  <a href="${cafe.igUrl}" class="btn-ig" target="_blank" rel="noopener" aria-label="View on Instagram">
    <svg width="20" height="20"><use href="#ic-instagram"/></svg>
  </a>
</div>`;
  const modal = document.getElementById('cafe-modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.getElementById('modal-save-btn').addEventListener('click', e => {
    toggleSave(cafe.id, e);
    const btn = document.getElementById('modal-save-btn');
    const sv = isSaved(cafe.id);
    if (btn) {
      btn.classList.toggle('saved', sv);
      btn.querySelector('svg use').setAttribute('href', sv ? '#ic-heart-filled' : '#ic-heart');
    }
  });
}
function closeModal() {
  const modal = document.getElementById('cafe-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ===== MAP ===== */
function initMap() {
  if (S.map) return;
  S.map = L.map('leaflet-map', {
    center: [12.9716, 77.5946],
    zoom: 13,
    zoomControl: true,
    attributionControl: true,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd', maxZoom: 20,
  }).addTo(S.map);
  ALL_CAFES.forEach(cafe => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;border-radius:50%;background:${cafe.artColor};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;"></div>`,
      iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -18],
    });
    const artInner = ART[cafe.artPattern % ART.length](cafe.artColor, cafe.artBg)
      .replace(/<svg[^>]*>/, '').replace('</svg>', '');
    const popupHtml = `
<div class="map-popup">
  <div class="map-popup-art" style="background:${cafe.artBg};margin:-0px 0px 12px;border-radius:0">
    <svg viewBox="0 0 320 60" style="position:absolute;inset:0;width:100%;height:100%" preserveAspectRatio="xMidYMid slice">${artInner}</svg>
  </div>
  <div class="map-popup-name">${cafe.name}</div>
  <div class="map-popup-meta">
    ${cafe.area}
    <div class="map-popup-rating">
      <svg width="11" height="11" style="fill:currentColor;color:#4D7C52"><use href="#ic-star"/></svg>
      ${cafe.rating}
    </div>
  </div>
  <div class="map-popup-actions">
    <a href="${mapsUrl(cafe)}" class="map-popup-btn" target="_blank" rel="noopener">
      <svg width="13" height="13" style="stroke:white;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><use href="#ic-external"/></svg>
      Maps
    </a>
    <button class="map-popup-detail" onclick="openModal('${cafe.id}')">Details</button>
  </div>
</div>`;
    const marker = L.marker([cafe.lat, cafe.lng], { icon }).addTo(S.map);
    marker.bindPopup(popupHtml, { closeButton: false, maxWidth: 240 });
    S.markers.push(marker);
  });
}

/* ===== VIEW SWITCHING ===== */
function switchView(name) {
  S.view = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.getElementById(name + '-view').classList.add('active');
  const filterBar = document.querySelector('.filter-bar');
  const sectionIntro = document.getElementById('home-intro');
  filterBar.style.display  = (name === 'home') ? '' : 'none';
  if (sectionIntro) sectionIntro.style.display = (name === 'home') ? '' : 'none';
  if (name === 'map') {
    setTimeout(() => {
      if (!S.map) initMap();
      else S.map.invalidateSize();
    }, 50);
  }
  if (name === 'discover') renderDiscover();
  if (name === 'saved')    renderSaved();
}

/* ===== GEOLOCATION ===== */
function requestGeo(onDone) {
  if (!navigator.geolocation) { onDone(false); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    S.userLat = pos.coords.latitude;
    S.userLng = pos.coords.longitude;
    onDone(true);
  }, () => onDone(false), { timeout: 5000 });
}

/* ===== SEARCH ===== */
function setupSearch() {
  const btn = document.getElementById('btn-search');
  const bar = document.getElementById('search-bar');
  const input = document.getElementById('search-input');
  const cancel = document.getElementById('btn-search-close');
  btn.addEventListener('click', () => {
    bar.classList.toggle('hidden');
    if (!bar.classList.contains('hidden')) { input.focus(); }
  });
  cancel.addEventListener('click', () => {
    bar.classList.add('hidden');
    input.value = '';
    S.search = '';
    renderHome();
  });
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      S.search = input.value;
      if (S.view === 'home') renderHome();
    }, 200);
  });
}

/* ===== CHIPS ===== */
function setupChips() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      if (f === 'near') {
        if (S.userLat === null) {
          requestGeo(ok => {
            if (ok) { S.filter = 'near'; applyChip(chip); }
            else { alert('Location access was denied. Enable it in your browser settings.'); }
          });
          return;
        }
      }
      S.filter = f;
      applyChip(chip);
    });
  });
}
function applyChip(chip) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  renderHome();
}

/* ===== PWA: SERVICE WORKER ===== */
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}

/* ===== PWA: INSTALL PROMPT ===== */
function setupInstall() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    S.deferredInstallPrompt = e;
    const btn = document.getElementById('btn-install');
    btn.classList.remove('hidden');
    btn.addEventListener('click', () => {
      e.prompt();
      e.userChoice.then(() => {
        S.deferredInstallPrompt = null;
        btn.classList.add('hidden');
      });
    });
    const a2hs = document.getElementById('a2hs-prompt');
    if (!localStorage.getItem('kaapi-a2hs-dismissed')) {
      setTimeout(() => a2hs.classList.remove('hidden'), 3000);
    }
    document.getElementById('a2hs-ok').addEventListener('click', () => {
      e.prompt();
      a2hs.classList.add('hidden');
    });
    document.getElementById('a2hs-dismiss').addEventListener('click', () => {
      a2hs.classList.add('hidden');
      localStorage.setItem('kaapi-a2hs-dismissed', '1');
    });
  });
  window.addEventListener('appinstalled', () => {
    document.getElementById('btn-install').classList.add('hidden');
    document.getElementById('a2hs-prompt').classList.add('hidden');
  });
}

/* ===== INIT ===== */
async function init() {
  registerSW();
  setupInstall();
  await loadCafes();
  renderHome();
  setupSearch();
  setupChips();
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  window.openModal = openModal;
  setTimeout(() => {
    const splash = document.getElementById('splash');
    const shell  = document.getElementById('app-shell');
    splash.classList.add('fade-out');
    shell.classList.remove('hidden');
    setTimeout(() => splash.remove(), 500);
  }, 1200);
}

document.addEventListener('DOMContentLoaded', init);
