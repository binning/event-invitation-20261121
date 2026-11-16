'use strict';
document.documentElement.classList.add('js');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const audio = document.querySelector('#bgm');
const toggle = document.querySelector('#music-toggle');
const label = document.querySelector('#music-label');
const status = document.querySelector('#status');
let wantsMusic = false;
let musicChosen = false;
let toastTimer;
let playAttempt = 0;
audio.volume = 0.3;
function showStatus(message) {
  clearTimeout(toastTimer);
  status.textContent = message;
  status.classList.add('visible');
  toastTimer = setTimeout(() => status.classList.remove('visible'), 3500);
}
function reflectMusic() {
  const playing = !audio.paused && !audio.ended;
  toggle.setAttribute('aria-pressed', String(playing));
  toggle.setAttribute('aria-label', playing ? '关闭背景音乐' : '开启背景音乐');
  label.textContent = playing ? '音乐开' : '音乐关';
}
async function startMusic() {
  const attempt = ++playAttempt;
  try {
    await audio.play();
    if (attempt !== playAttempt) return;
    if (!wantsMusic || document.hidden) audio.pause();
  } catch {
    if (attempt === playAttempt && wantsMusic && !document.hidden) {
      wantsMusic = false;
      showStatus('轻触右上角乐符，可开启背景音乐');
    }
  }
  reflectMusic();
}
toggle.addEventListener('click', () => {
  musicChosen = true;
  wantsMusic = !wantsMusic;
  if (wantsMusic) void startMusic();
  else { ++playAttempt; audio.pause(); reflectMusic(); }
});
document.querySelectorAll('[data-start-music]').forEach(link => {
  link.addEventListener('click', () => {
    if (!musicChosen) {
      musicChosen = true;
      wantsMusic = true;
      void startMusic();
    }
  });
});
audio.addEventListener('play', reflectMusic);
audio.addEventListener('pause', reflectMusic);
audio.addEventListener('error', () => {
  if (wantsMusic) { wantsMusic = false; showStatus('音乐暂未加载，您仍可正常阅函'); }
  reflectMusic();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { ++playAttempt; audio.pause(); }
  else if (wantsMusic) void startMusic();
});
window.addEventListener('pagehide', () => audio.pause());
// Complete text remains available to assistive technology, reduced motion and no-JS visitors.
const lines = [...document.querySelectorAll('[data-type-line]')];
const completeLines = lines.map(line => line.textContent);
const showPoem = document.querySelector('#show-poem');
let typingTimer;
let typingStopped = false;
function finishPoem() {
  typingStopped = true;
  clearTimeout(typingTimer);
  lines.forEach((line, index) => {
    line.textContent = completeLines[index];
    line.classList.remove('typing');
    line.classList.add('typed');
  });
  showPoem.hidden = true;
}
function typeLine(lineIndex, characterIndex) {
  if (typingStopped) return;
  if (lineIndex >= lines.length) { finishPoem(); return; }
  const line = lines[lineIndex];
  const chars = Array.from(completeLines[lineIndex]);
  line.classList.add('typing');
  line.textContent = chars.slice(0, characterIndex).join('');
  if (characterIndex < chars.length) {
    typingTimer = setTimeout(() => typeLine(lineIndex, characterIndex + 1), /[，。]/.test(chars[characterIndex]) ? 330 : 125);
  } else {
    line.classList.replace('typing', 'typed');
    typingTimer = setTimeout(() => typeLine(lineIndex + 1, 0), 450);
  }
}
showPoem.addEventListener('click', finishPoem);
if (reducedMotion.matches) finishPoem();
else {
  lines.forEach(line => { line.textContent = ''; });
  typingTimer = setTimeout(() => typeLine(0, 0), 650);
}
reducedMotion.addEventListener('change', event => { if (event.matches) finishPoem(); });
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  reveals.forEach(element => revealObserver.observe(element));
} else reveals.forEach(element => element.classList.add('is-visible'));
const chapters = [...document.querySelectorAll('.chapter')];
const navLinks = [...document.querySelectorAll('.chapter-nav a')];
const progress = document.querySelector('#progress-fill');
let scheduled = false;
function updateChapter() {
  const marker = window.innerHeight * 0.42;
  let selected = 0;
  chapters.forEach((chapter, index) => { if (chapter.getBoundingClientRect().top <= marker) selected = index; });
  chapters.forEach((chapter, index) => chapter.classList.toggle('is-current', index === selected));
  navLinks.forEach((link, index) => {
    if (index === selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  progress.style.width = `${(selected + 1) * 25}%`;
  scheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateChapter); }
}, { passive: true });
window.addEventListener('resize', updateChapter);
updateChapter();
const poster = document.querySelector('#poster-dialog');
const openPoster = document.querySelector('#open-poster');
openPoster.addEventListener('click', () => {
  if (typeof poster.showModal === 'function') { poster.showModal(); document.body.classList.add('modal-open'); }
  else window.location.href = 'invitation.png?v=20261116-1500';
});
document.querySelector('#close-poster').addEventListener('click', () => poster.close());
poster.addEventListener('click', event => { if (event.target === poster) poster.close(); });
poster.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  openPoster.focus({ preventScroll: true });
});
reflectMusic();
