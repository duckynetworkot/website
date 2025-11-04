// Shared script for theme toggle, particles, and live server status

const SERVERS = [
  { name: 'DuckyEvents', host: 'duckyevents.lol' },
  { name: 'Main DuckyNetwork Hub', host: 'duckynetwork.lol' },
  { name: 'EventCraft', host: 'eventcraft.duckynetwork.lol' },
  { name: 'BlueTraktorEvents', host: 'bluetraktorevents.duckynetwork.lol' },
  { name: 'SMEvents', host: 'smevents.qwertz.lol' }
];

// Theme toggle
const siteEl = document.querySelector('.site');
const saved = localStorage.getItem('dn_theme') || 'dark';
function applyTheme(theme) {
  siteEl.setAttribute('data-theme', theme);
  localStorage.setItem('dn_theme', theme);
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}
applyTheme(saved);
document.addEventListener('click', e => {
  if (e.target && e.target.id === 'themeToggle') {
    applyTheme(siteEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }
});

// Copy IP button
document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-copy-ip]');
  if (!btn) return;
  const ip = btn.getAttribute('data-copy-ip');
  try {
    await navigator.clipboard.writeText(ip);
    const orig = btn.innerHTML;
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.innerHTML = orig), 1600);
  } catch {
    alert('Failed to copy IP');
  }
});

// Particle background
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = (canvas.width = innerWidth),
    h = (canvas.height = innerHeight);
  const particles = [];
  const count = Math.max(24, Math.floor((w * h) / 70000));

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function init() {
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(0.6, 2.6),
        vx: rand(-0.2, 0.2),
        vy: rand(-0.2, 0.2),
        alpha: rand(0.06, 0.22)
      });
    }
  }
  function resize() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    init();
  }
  window.addEventListener('resize', resize);
  init();
  function step() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
      ctx.beginPath();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent-1') || '#f7b500';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  }
  step();
})();

// Fetch server statuses
async function fetchStatus(host) {
  try {
    const res = await fetch('https://api.mcsrvstat.us/3/' + encodeURIComponent(host));
    if (!res.ok) throw new Error('network');
    return await res.json();
  } catch {
    return { online: false };
  }
}

function createEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function createStatusCard(server, data) {
  const card = createEl('div', 'card');
  card.appendChild(createEl('div', 'server-name', server.name));
  card.appendChild(createEl('div', 'server-status', data.online ? '🟢 Online' : '🔴 Offline'));
  card.appendChild(createEl('div', 'server-meta', `Address: ${server.host}`));
  if (data.online) {
    card.appendChild(
      createEl('div', 'server-meta', `Players: ${data.players?.online ?? 0} / ${data.players?.max ?? 0}`)
    );
    const motd = (data.motd && data.motd.clean && data.motd.clean.join(' ')) || '';
    if (motd) card.appendChild(createEl('div', 'server-meta', `MOTD: ${motd}`));
  }
  return card;
}

async function renderStatusesGrid(gridEl) {
  gridEl.innerHTML = '';
  const results = await Promise.all(SERVERS.map(s => fetchStatus(s.host)));
  for (let i = 0; i < SERVERS.length; i++) {
    gridEl.appendChild(createStatusCard(SERVERS[i], results[i]));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('statusGrid');
  if (grid) {
    renderStatusesGrid(grid);
    setInterval(() => renderStatusesGrid(grid), 30000);
  }
});
