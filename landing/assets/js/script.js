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
  document.querySelectorAll('.preview-swiper .phone-mockup img').forEach(img => {
    img.src = mode === 'dark' ? img.dataset.dark : img.dataset.light;
  });
}
// Init with light mode
switchPreview('light');

// ── Swiper Slider ──
const previewSwiper = new Swiper('.preview-swiper', {
  loop: true,
  centeredSlides: true,
  slidesPerView: 5,
  spaceBetween: 16,
  speed: 500,
  grabCursor: true,
  initialSlide: 4,
  navigation: {
    nextEl: '.preview-swiper .swiper-button-next',
    prevEl: '.preview-swiper .swiper-button-prev',
  },
  breakpoints: {
    0: {
      slidesPerView: 3,
      spaceBetween: 10,
    },
    768: {
      slidesPerView: 5,
      spaceBetween: 16,
    },
  },
});

// ── Theme Toggle ──
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

function setTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateNavbarBg();
}

// Init from stored value (already set by inline script, just wire up)
themeToggle.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// ── Navbar background on scroll ──
const navbar = document.querySelector('.navbar');
function updateNavbarBg() {
  const isLight = htmlEl.getAttribute('data-theme') === 'light';
  if (isLight) {
    navbar.style.background = window.scrollY > 50
      ? 'rgba(245,247,251,0.95)'
      : 'rgba(245,247,251,0.8)';
  } else {
    navbar.style.background = window.scrollY > 50
      ? 'rgba(5,8,22,0.9)'
      : 'rgba(5,8,22,0.7)';
  }
}
window.addEventListener('scroll', updateNavbarBg);
updateNavbarBg();
