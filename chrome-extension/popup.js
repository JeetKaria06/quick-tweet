// DOM Elements
const tweetInput = document.getElementById('tweetInput');
const postBtn = document.getElementById('postBtn');
const charCount = document.getElementById('charCount');
const counterFill = document.getElementById('counterFill');
const status = document.getElementById('status');
const themeToggle = document.getElementById('themeToggle');

const MAX_CHARS = 280;
const WARNING_THRESHOLD = 260;
const CIRCUMFERENCE = 62.83; // 2 * PI * radius (10)

let isPosting = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  tweetInput.focus();
  updateCharCounter();
});

// Listen for status updates from background script
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
      // Auto-close after showing success
      setTimeout(() => {
        window.close();
      }, 1500);
      break;
    
    case 'error':
      showStatus(message || 'Failed to post tweet', 'error');
      resetPostingState();
      break;
    
    default:
      if (message) {
        showStatus(message, 'info');
      }
  }
}

function resetPostingState() {
  isPosting = false;
  postBtn.classList.remove('loading');
  postBtn.disabled = false;
  tweetInput.disabled = false;
  tweetInput.focus();
}

// Theme Management
function loadTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    const theme = result.theme || 'dark';
    setTheme(theme);
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  chrome.storage.local.set({ theme });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  
  // Add a little animation feedback
  themeToggle.style.transform = 'rotate(360deg)';
  setTimeout(() => {
    themeToggle.style.transform = '';
  }, 300);
}

themeToggle.addEventListener('click', toggleTheme);

// Character Counter
function updateCharCounter() {
  const length = tweetInput.value.length;
  const percentage = length / MAX_CHARS;
  
  // Update text
  charCount.textContent = length;
  
  // Update ring
  const offset = CIRCUMFERENCE - (percentage * CIRCUMFERENCE);
  counterFill.style.strokeDashoffset = Math.max(0, offset);
  
  // Remove all state classes
  tweetInput.classList.remove('warning', 'over-limit');
  counterFill.classList.remove('warning', 'over-limit');
  charCount.classList.remove('warning', 'over-limit');
  
  // Add appropriate state class
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
}

tweetInput.addEventListener('input', updateCharCounter);

// Post Tweet
async function postTweet() {
  const tweet = tweetInput.value.trim();
  
  if (!tweet || tweet.length > MAX_CHARS || isPosting) {
    return;
  }
  
  isPosting = true;
  
  // Set loading state
  postBtn.classList.add('loading');
  postBtn.disabled = true;
  tweetInput.disabled = true;
  
  showStatus('Starting...', 'info');
  
  try {
    chrome.runtime.sendMessage({
      type: 'POST_TWEET',
      tweet
    });
  } catch (error) {
    showStatus('Failed to start posting', 'error');
    resetPostingState();
  }
}

postBtn.addEventListener('click', postTweet);

// Keyboard shortcut: Ctrl/Cmd + Enter to post
tweetInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!postBtn.disabled && !isPosting) {
      postTweet();
    }
  }
});

// Status Messages
function showStatus(message, type = 'info') {
  const statusText = status.querySelector('.status-text');
  if (statusText) {
    statusText.textContent = message;
  } else {
    status.textContent = message;
  }
  status.className = `status ${type}`;
}

function hideStatus() {
  status.classList.add('hidden');
}

// Auto-resize textarea
tweetInput.addEventListener('input', () => {
  tweetInput.style.height = 'auto';
  tweetInput.style.height = Math.min(tweetInput.scrollHeight, 200) + 'px';
});
