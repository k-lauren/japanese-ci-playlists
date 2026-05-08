const D = window.SITE_DATA;

const STATE = {
  bucket: 'beginner',
  channel: '',
  jlpt: '',
  format: '',
  length: '',
  english: '',
  sort: 'views',
  videoId: null,
};

const $ = sel => document.querySelector(sel);
const fmtViews = n => {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toString();
};

function uniq(arr) { return Array.from(new Set(arr)).filter(Boolean); }

function buildFilterOptions() {
  const vids = D.videos[STATE.bucket];
  const channels = uniq(vids.map(v => v.channel)).sort();
  const formats = uniq(vids.map(v => v.tags.format)).sort();
  const jlpts = uniq(vids.map(v => v.tags.jlpt));

  const fillSelect = (id, items, label) => {
    const sel = document.getElementById(id);
    sel.innerHTML = `<option value="">${label}</option>` + items.map(i => `<option value="${i}">${i}</option>`).join('');
  };
  fillSelect('f-channel', channels, 'All channels');
  fillSelect('f-jlpt', jlpts, 'Any JLPT');
  fillSelect('f-format', formats, 'Any format');
}

function applyFilters(vids) {
  return vids.filter(v => {
    if (STATE.channel && v.channel !== STATE.channel) return false;
    if (STATE.jlpt && v.tags.jlpt !== STATE.jlpt) return false;
    if (STATE.format && v.tags.format !== STATE.format) return false;
    if (STATE.length && v.tags.length !== STATE.length) return false;
    if (STATE.english === 'yes' && !v.tags.english_subs) return false;
    return true;
  });
}

function sortVids(vids) {
  const copy = vids.slice();
  switch (STATE.sort) {
    case 'views': copy.sort((a, b) => b.views - a.views); break;
    case 'recent': copy.sort((a, b) => (a.published < b.published ? 1 : -1)); break;
    case 'oldest': copy.sort((a, b) => (a.published > b.published ? 1 : -1)); break;
    case 'shortest': copy.sort((a, b) => a.duration_s - b.duration_s); break;
    case 'longest': copy.sort((a, b) => b.duration_s - a.duration_s); break;
  }
  return copy;
}

function renderList() {
  const vids = sortVids(applyFilters(D.videos[STATE.bucket]));
  const list = $('#video-list');
  $('#list-count').textContent = `${vids.length} video${vids.length === 1 ? '' : 's'}`;

  if (!vids.length) {
    list.innerHTML = '<div class="empty">No videos match these filters.</div>';
    return;
  }
  list.innerHTML = vids.map(v => {
    const tags = [];
    if (v.tags.jlpt) tags.push(`<span class="tag jlpt">${v.tags.jlpt}</span>`);
    if (v.tags.format) tags.push(`<span class="tag">${v.tags.format}</span>`);
    if (v.tags.length) tags.push(`<span class="tag">${v.tags.length}</span>`);
    if (v.tags.english_subs) tags.push(`<span class="tag">EN sub</span>`);
    return `
      <div class="video-card ${v.id === STATE.videoId ? 'active' : ''}" data-id="${v.id}">
        <div class="thumb">
          <img loading="lazy" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="">
          <span class="dur">${v.duration}</span>
        </div>
        <div class="video-meta">
          <h3 class="video-title">${escapeHTML(v.title)}</h3>
          <div class="video-sub">
            <span class="channel">${escapeHTML(v.channel)}</span>
            <span class="views">${fmtViews(v.views)} views</span>
            <span>${v.published}</span>
          </div>
          <div class="tag-row">${tags.join('')}</div>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('.video-card').forEach(el => {
    el.addEventListener('click', () => playVideo(el.dataset.id));
  });
}

function escapeHTML(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function playVideo(id) {
  STATE.videoId = id;
  const v = D.videos[STATE.bucket].find(x => x.id === id);
  if (!v) return;
  $('#player').innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  $('#player-title').textContent = v.title;
  $('#player-info').innerHTML = `<span class="channel">${escapeHTML(v.channel)}</span> · ${fmtViews(v.views)} views · ${v.duration} · ${v.published}`;
  $('#player-link').innerHTML = `<a href="https://youtu.be/${id}" target="_blank" rel="noopener">Open on YouTube ↗</a>`;
  document.querySelectorAll('.video-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));
}

function renderPlaylistLinks() {
  const b = STATE.bucket;
  const p1 = D.playlists[`${b}_pt1`];
  const p2 = D.playlists[`${b}_pt2`];
  const html = `
    <a href="https://www.youtube.com/playlist?list=${p1}" target="_blank" rel="noopener">Pt 1 ↗</a>
    <a href="https://www.youtube.com/playlist?list=${p2}" target="_blank" rel="noopener">Pt 2 ↗</a>
  `;
  $('#playlist-links').innerHTML = html;
}

function setBucket(b) {
  STATE.bucket = b;
  STATE.channel = ''; STATE.jlpt = ''; STATE.format = ''; STATE.length = ''; STATE.english = '';
  STATE.videoId = null;
  document.querySelectorAll('.bucket-tabs button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bucket === b);
  });
  ['f-channel','f-jlpt','f-format','f-length','f-english'].forEach(id => { document.getElementById(id).value = ''; });
  buildFilterOptions();
  renderList();
  renderPlaylistLinks();
  // Auto-load top video
  const first = sortVids(applyFilters(D.videos[STATE.bucket]))[0];
  if (first) playVideo(first.id);
}

function init() {
  // Bucket counts
  document.querySelectorAll('.bucket-tabs button').forEach(btn => {
    const b = btn.dataset.bucket;
    btn.querySelector('.count').textContent = D.videos[b].length;
    btn.addEventListener('click', () => setBucket(b));
  });
  // Filter handlers
  const bind = (id, key) => document.getElementById(id).addEventListener('change', e => {
    STATE[key] = e.target.value;
    renderList();
  });
  bind('f-channel', 'channel');
  bind('f-jlpt', 'jlpt');
  bind('f-format', 'format');
  bind('f-length', 'length');
  bind('f-english', 'english');
  document.getElementById('f-sort').addEventListener('change', e => {
    STATE.sort = e.target.value;
    renderList();
  });

  setBucket('beginner');
}

document.addEventListener('DOMContentLoaded', init);
