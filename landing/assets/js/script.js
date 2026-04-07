// ── APK Download URL ──
const APK_DOWNLOAD_URL = './wperp-suite-v1.0.0.apk';
document.getElementById('downloadBtn').href = APK_DOWNLOAD_URL;
document.getElementById('downloadBtn2').href = APK_DOWNLOAD_URL;

// ── Scroll Reveal ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Bento card mouse glow ──
document.querySelectorAll('.bento-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
  });
});

// ── App Preview toggle ──
function switchPreview(mode) {
  document.querySelectorAll('.preview-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  document.querySelectorAll('#previewScroll img').forEach(img => {
    img.src = mode === 'dark' ? img.dataset.dark : img.dataset.light;
  });
}
// Init with light mode
switchPreview('light');

// ── Infinite clone-based loop slider ──
const scrollEl = document.getElementById('previewScroll');
const origFrames = Array.from(scrollEl.querySelectorAll('.phone-frame'));
const total = origFrames.length;

// Clone all frames before and after for seamless loop
origFrames.forEach(f => scrollEl.appendChild(f.cloneNode(true)));
origFrames.forEach(f => scrollEl.insertBefore(f.cloneNode(true), scrollEl.firstChild));

// Sync cloned images on mode switch
const _origSwitch = switchPreview;
switchPreview = function(mode) {
  _origSwitch(mode);
  scrollEl.querySelectorAll('.phone-frame img').forEach(img => {
    img.src = mode === 'dark' ? img.dataset.dark : img.dataset.light;
  });
};

const allFrames = scrollEl.querySelectorAll('.phone-frame');
function fw() { return origFrames[0].offsetWidth + 28; }
const realStart = () => total * fw();

// Position to real middle set
function jumpToReal(idx) {
  scrollEl.scrollLeft = realStart() + idx * fw() - scrollEl.offsetWidth / 2 + origFrames[0].offsetWidth / 2;
}
setTimeout(() => jumpToReal(Math.floor(total / 2)), 100);

// Highlight closest to center
function updateActive() {
  const center = scrollEl.scrollLeft + scrollEl.offsetWidth / 2;
  let best = 0, bestDist = Infinity;
  allFrames.forEach((f, i) => {
    const d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - center);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  allFrames.forEach((f, i) => f.classList.toggle('active', i === best));
}
scrollEl.addEventListener('scroll', updateActive, { passive: true });
setTimeout(updateActive, 150);

// Reposition silently after scroll fully stops
let idleTimer = null;
let lastScrollLeft = 0;
scrollEl.addEventListener('scroll', () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    // Double-check scroll has actually stopped (no movement in 100ms)
    lastScrollLeft = scrollEl.scrollLeft;
    setTimeout(() => {
      if (Math.abs(scrollEl.scrollLeft - lastScrollLeft) > 2) return; // still moving
      const pos = scrollEl.scrollLeft;
      const rs = realStart();
      const re = rs + total * fw();
      if (pos < rs || pos >= re) {
        let np = ((pos - rs) % (total * fw()));
        if (np < 0) np += total * fw();
        scrollEl.scrollLeft = rs + np;
      }
    }, 100);
  }, 400);
}, { passive: true });

// Arrow slide
function slidePreview(dir) {
  scrollEl.scrollBy({ left: fw() * dir, behavior: 'smooth' });
}

// Click to center
allFrames.forEach(frame => {
  frame.addEventListener('click', () => {
    scrollEl.scrollTo({
      left: frame.offsetLeft - scrollEl.offsetWidth / 2 + frame.offsetWidth / 2,
      behavior: 'smooth'
    });
  });
});

// ── Navbar background on scroll ──
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.style.background = window.scrollY > 50
    ? 'rgba(5,8,22,0.9)'
    : 'rgba(5,8,22,0.7)';
});
