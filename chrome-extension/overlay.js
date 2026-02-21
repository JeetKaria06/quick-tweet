// overlay.js — Cinematic overlay wrapper, loads popup.html in an iframe
(() => {
  // Toggle: if already open, close it
  const existing = document.getElementById('quick-tweet-overlay');
  if (existing) {
    existing.style.opacity = '0';
    existing.querySelector('iframe').style.transform = 'scale(0.92) translateY(16px)';
    setTimeout(() => existing.remove(), 250);
    return;
  }

  // Freeze background scroll
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'quick-tweet-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    opacity: '0',
    transition: 'opacity 0.25s ease',
    fontFamily: 'sans-serif'
  });

  // Create iframe
  const frame = document.createElement('iframe');
  frame.src = chrome.runtime.getURL('popup.html?mode=overlay');
  Object.assign(frame.style, {
    width: 'min(820px, 85vw)',
    height: '220px', // Initial height, will auto-resize
    border: 'none',
    borderRadius: '20px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
    transform: 'scale(0.92) translateY(16px)',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
    background: '#000'
  });

  overlay.appendChild(frame);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    frame.style.transform = 'scale(1) translateY(0)';
  });

  // Close function
  function close() {
    document.body.style.overflow = originalOverflow;
    overlay.style.opacity = '0';
    frame.style.transform = 'scale(0.92) translateY(16px)';
    setTimeout(() => overlay.remove(), 250);
  }

  // Click outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Escape on parent page
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handler);
    }
  });

  // Listen for messages from iframe
  window.addEventListener('message', (e) => {
    if (e.data === 'QUICK_TWEET_CLOSE') {
      close();
    } else if (e.data && e.data.type === 'QUICK_TWEET_RESIZE') {
      frame.style.height = Math.ceil(e.data.height) + 'px';
    }
  });
})();
