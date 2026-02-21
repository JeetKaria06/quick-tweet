// DOM Elements
const tweetInput = document.getElementById('tweetInput');
const postBtn = document.getElementById('postBtn');
const charCount = document.getElementById('charCount');
const counterFill = document.getElementById('counterFill');
const status = document.getElementById('status');
const themeToggle = document.getElementById('themeToggle');
const stashBtn = document.getElementById('stashBtn');
const stashCount = document.getElementById('stashCount');
const stashList = document.getElementById('stashList');
const stashEmpty = document.getElementById('stashEmpty');
const composeView = document.getElementById('composeView');
const stashView = document.getElementById('stashView');
const tabToggle = document.getElementById('tabToggle');

const MAX_CHARS = 280;
const WARNING_THRESHOLD = 260;
const CIRCUMFERENCE = 62.83;

let isPosting = false;
let currentTab = 'compose';
const isOverlay = new URLSearchParams(window.location.search).get('mode') === 'overlay';

// Close helper — works for both popup and overlay
function closeWindow() {
  if (isOverlay) {
    window.parent.postMessage('QUICK_TWEET_CLOSE', '*');
  } else {
    window.close();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (isOverlay) {
    document.body.classList.add('overlay-mode');
    
    // Broadcast content size changes to parent overlay for dynamic resizing
    const observer = new ResizeObserver(() => {
      window.parent.postMessage({
        type: 'QUICK_TWEET_RESIZE',
        height: document.body.offsetHeight
      }, '*');
    });
    observer.observe(document.body);
  }

  loadTheme();
  tweetInput.focus();
  updateCharCounter();
  restoreTweetState();
  updateStashCount();

  // Escape to close overlay
  if (isOverlay) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeWindow();
    });
  }
});

// ===== TWEET STATE PERSISTENCE =====

function restoreTweetState() {
  chrome.storage.local.get(['tweetState'], (result) => {
    const state = result.tweetState;
    if (!state) return;

    const age = Date.now() - state.timestamp;
    if (age > 30000) {
      chrome.storage.local.remove('tweetState');
      return;
    }

    // Set posting state FIRST so updateCharCounter hides the stash button
    if (['opening', 'typing', 'clicking', 'waiting'].includes(state.status)) {
      isPosting = true;
      postBtn.classList.add('loading');
      postBtn.disabled = true;
      tweetInput.disabled = true;
      stashBtn.style.display = 'none';
    }

    if (state.tweetText && !tweetInput.value) {
      tweetInput.value = state.tweetText;
      updateCharCounter();
    }

    handleStatusUpdate(state.status, state.message);
  });
}

// ===== STATUS UPDATES =====

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TWEET_STATUS') {
    handleStatusUpdate(msg.status, msg.message, msg.detail);
  }
});

function handleStatusUpdate(statusType, message, detail) {
  switch (statusType) {
    case 'opening':
      showStatus('Opening X...', 'info');
      break;
    case 'typing':
      showStatus('Typing your tweet...', 'info');
      break;
    case 'clicking':
      showStatus('Clicking post button...', 'info');
      break;
    case 'waiting':
      showStatus('Waiting for confirmation...', 'info');
      break;
    case 'success':
      showStatus('Tweet posted successfully!', 'success');
      isPosting = false;
      tweetInput.value = '';
      chrome.storage.local.remove('tweetState');
      setTimeout(() => {
        closeWindow();
      }, 1500);
      break;
    case 'error':
      showStatus(message || 'Failed to post tweet', 'error');
      resetPostingState();
      chrome.storage.local.remove('tweetState');
      break;
    default:
      if (message) showStatus(message, 'info');
  }
}

function resetPostingState() {
  isPosting = false;
  postBtn.classList.remove('loading');
  postBtn.disabled = false;
  tweetInput.disabled = false;
  tweetInput.focus();
}

// ===== TAB SWITCHING =====

tabToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn || btn.dataset.tab === currentTab) return;

  currentTab = btn.dataset.tab;

  // Update tab buttons
  tabToggle.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Switch views
  if (currentTab === 'compose') {
    composeView.classList.add('active');
    stashView.classList.remove('active');
    tweetInput.focus();
  } else {
    composeView.classList.remove('active');
    stashView.classList.add('active');
    renderDrafts();
  }
});

// ===== THEME =====

function loadTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    setTheme(result.theme || 'dark');
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  chrome.storage.local.set({ theme });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
  themeToggle.style.transform = 'rotate(360deg)';
  setTimeout(() => { themeToggle.style.transform = ''; }, 300);
}

themeToggle.addEventListener('click', toggleTheme);

// ===== CHARACTER COUNTER =====

function updateCharCounter() {
  const length = tweetInput.value.length;
  const percentage = length / MAX_CHARS;

  charCount.textContent = length;

  const offset = CIRCUMFERENCE - (percentage * CIRCUMFERENCE);
  counterFill.style.strokeDashoffset = Math.max(0, offset);

  tweetInput.classList.remove('warning', 'over-limit');
  counterFill.classList.remove('warning', 'over-limit');
  charCount.classList.remove('warning', 'over-limit');

  if (length > MAX_CHARS) {
    tweetInput.classList.add('over-limit');
    counterFill.classList.add('over-limit');
    charCount.classList.add('over-limit');
    postBtn.disabled = true;
  } else if (length >= WARNING_THRESHOLD) {
    tweetInput.classList.add('warning');
    counterFill.classList.add('warning');
    charCount.classList.add('warning');
    postBtn.disabled = isPosting;
  } else {
    postBtn.disabled = length === 0 || isPosting;
  }

  // Show/hide stash button (hidden when empty, during posting, or over limit)
  stashBtn.style.display = length > 0 && !isPosting && length <= MAX_CHARS ? 'flex' : 'none';
}

tweetInput.addEventListener('input', updateCharCounter);

// Auto-resize textarea
tweetInput.addEventListener('input', () => {
  tweetInput.style.height = 'auto';
  tweetInput.style.height = Math.min(tweetInput.scrollHeight, 200) + 'px';
});

// ===== POST TWEET =====

async function postTweet(text) {
  const tweet = text || tweetInput.value.trim();
  if (!tweet || tweet.length > MAX_CHARS || isPosting) return;

  isPosting = true;
  postBtn.classList.add('loading');
  postBtn.disabled = true;
  tweetInput.disabled = true;
  stashBtn.style.display = 'none';

  // If we came from the stash, fill in the textarea
  if (text && tweetInput.value !== text) {
    tweetInput.value = text;
    updateCharCounter();
  }

  showStatus('Starting...', 'info');

  try {
    chrome.runtime.sendMessage({ type: 'POST_TWEET', tweet });
  } catch (error) {
    showStatus('Failed to start posting', 'error');
    resetPostingState();
  }
}

postBtn.addEventListener('click', () => postTweet());

tweetInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!postBtn.disabled && !isPosting) {
      postTweet();
    }
  }
});

// ===== STATUS MESSAGES =====

function showStatus(message, type = 'info') {
  const statusText = status.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = message;
  } else {
    status.textContent = message;
  }
  status.className = `status ${type}`;
}

// ===== STASH (DRAFTS) =====

function getDrafts() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['drafts'], (result) => {
      resolve(result.drafts || []);
    });
  });
}

function saveDrafts(drafts) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ drafts }, resolve);
  });
}

async function addDraft(text) {
  const drafts = await getDrafts();
  drafts.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text: text.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  await saveDrafts(drafts);
  updateStashCount();
}

async function updateDraft(id, newText) {
  const drafts = await getDrafts();
  const draft = drafts.find(d => d.id === id);
  if (draft) {
    draft.text = newText.trim();
    draft.updatedAt = Date.now();
    await saveDrafts(drafts);
  }
}

async function deleteDraft(id) {
  let drafts = await getDrafts();
  drafts = drafts.filter(d => d.id !== id);
  await saveDrafts(drafts);
  updateStashCount();
}

async function updateStashCount() {
  const drafts = await getDrafts();
  stashCount.textContent = drafts.length > 0 ? drafts.length : '';
}

// Save to Stash
stashBtn.addEventListener('click', async () => {
  const text = tweetInput.value.trim();
  if (!text) return;

  await addDraft(text);
  tweetInput.value = '';
  updateCharCounter();

  showStatus('Saved to Stash!', 'success');
  setTimeout(() => {
    status.classList.add('hidden');
  }, 1500);
});

// Relative time
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Render drafts
async function renderDrafts() {
  const drafts = await getDrafts();

  if (drafts.length === 0) {
    stashEmpty.style.display = 'flex';
    stashList.style.display = 'none';
    return;
  }

  stashEmpty.style.display = 'none';
  stashList.style.display = 'flex';
  stashList.innerHTML = '';

  drafts.forEach(draft => {
    const card = document.createElement('div');
    card.className = 'draft-card';
    card.dataset.id = draft.id;

    card.innerHTML = `
      <div class="draft-text">${escapeHtml(draft.text)}</div>
      <div class="draft-meta">
        <span class="draft-time">${timeAgo(draft.updatedAt)}</span>
        <div class="draft-actions">
          <button class="draft-action-btn edit" title="Edit">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="draft-action-btn post" title="Post this tweet">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
          <button class="draft-action-btn delete" title="Delete">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>
    `;

    // Action handlers
    card.querySelector('.edit').addEventListener('click', () => enterEditMode(card, draft));
    card.querySelector('.post').addEventListener('click', () => postFromDraft(draft));
    card.querySelector('.delete').addEventListener('click', () => confirmDelete(card, draft));

    stashList.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Edit mode
function enterEditMode(card, draft) {
  card.classList.add('editing');
  card.innerHTML = `
    <textarea class="draft-edit-area">${escapeHtml(draft.text)}</textarea>
    <div class="draft-edit-actions">
      <button class="draft-edit-btn cancel">Cancel</button>
      <button class="draft-edit-btn save">Save</button>
    </div>
  `;

  const textarea = card.querySelector('.draft-edit-area');
  textarea.focus();
  textarea.selectionStart = textarea.value.length;

  card.querySelector('.save').addEventListener('click', async () => {
    const newText = textarea.value.trim();
    if (newText && newText.length <= MAX_CHARS) {
      await updateDraft(draft.id, newText);
      renderDrafts();
    }
  });

  card.querySelector('.cancel').addEventListener('click', () => {
    renderDrafts();
  });
}

// Post from draft
async function postFromDraft(draft) {
  // Switch to compose tab
  currentTab = 'compose';
  tabToggle.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === 'compose');
  });
  composeView.classList.add('active');
  stashView.classList.remove('active');

  // Fill and post
  tweetInput.value = draft.text;
  updateCharCounter();
  postTweet(draft.text);

  // Remove from stash after posting
  await deleteDraft(draft.id);
}

// Delete draft
function confirmDelete(card, draft) {
  deleteDraft(draft.id).then(() => {
    card.style.opacity = '0';
    card.style.transform = 'translateX(20px)';
    card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    setTimeout(() => renderDrafts(), 200);
  });
}
