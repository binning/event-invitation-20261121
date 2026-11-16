'use strict';

const audio = document.querySelector('#bgm');
const cover = document.querySelector('#cover');
const invitation = document.querySelector('#invitation');
const toggle = document.querySelector('#music-toggle');
const label = document.querySelector('#music-label');
const status = document.querySelector('#status');
let opened = false;
let wantsMusic = false;
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
    if (!wantsMusic || document.hidden) {
      audio.pause();
    }
  } catch (error) {
    if (attempt === playAttempt && wantsMusic && !document.hidden) {
      wantsMusic = false;
      showStatus('音乐暂未播放，轻触右上角音乐按钮重试');
    }
  }
  reflectMusic();
}

function openInvitation(withMusic) {
  if (opened) return;
  opened = true;
  wantsMusic = withMusic;
  invitation.inert = false;
  toggle.hidden = false;
  document.body.classList.add('opened');
  cover.classList.add('leaving');
  // play() stays inside the user's click event for mobile autoplay policies.
  if (withMusic) void startMusic();
  setTimeout(() => {
    cover.hidden = true;
    toggle.focus({ preventScroll: true });
  }, 850);
}

document.querySelector('#open-invitation').addEventListener('click', () => openInvitation(true));
document.querySelector('#open-silently').addEventListener('click', () => openInvitation(false));
toggle.addEventListener('click', () => {
  wantsMusic = !wantsMusic;
  if (wantsMusic) {
    void startMusic();
  } else {
    ++playAttempt;
    audio.pause();
    reflectMusic();
  }
});

audio.addEventListener('play', reflectMusic);
audio.addEventListener('pause', reflectMusic);
audio.addEventListener('error', () => {
  if (opened && wantsMusic) {
    wantsMusic = false;
    reflectMusic();
    showStatus('音乐加载失败，仍可正常查看邀请函');
  }
});

// Pause in the background. An explicit mute remains muted when returning.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    ++playAttempt;
    audio.pause();
  } else if (opened && wantsMusic) {
    void startMusic();
  }
});
window.addEventListener('pagehide', () => audio.pause());
