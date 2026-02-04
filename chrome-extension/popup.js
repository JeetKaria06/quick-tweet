// DOM Elements
const loginScreen = document.getElementById('login-screen');
const tweetScreen = document.getElementById('tweet-screen');
const loadingScreen = document.getElementById('loading-screen');
const refreshBtn = document.getElementById('refresh-btn');
const tweetInput = document.getElementById('tweet-input');
const tweetBtn = document.getElementById('tweet-btn');
const charCount = document.getElementById('char-count');
const counterProgress = document.getElementById('counter-progress');
const statusEl = document.getElementById('status');
const profilePic = document.getElementById('profile-pic');
const displayName = document.getElementById('display-name');
const usernameEl = document.getElementById('username');

const MAX_CHARS = 280;
const CIRCLE_CIRCUMFERENCE = 62.83; // 2 * PI * 10

// Show/hide screens
function showScreen(screen) {
  loginScreen.classList.add('hidden');
  tweetScreen.classList.add('hidden');
  loadingScreen.classList.add('hidden');
  screen.classList.remove('hidden');
}

// Show status message
function showStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove('hidden');
  
  if (type === 'success') {
    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 3000);
  }
}

// Hide status
function hideStatus() {
  statusEl.classList.add('hidden');
}

// Update character counter
function updateCharCounter() {
  const length = tweetInput.value.length;
  charCount.textContent = length;
  
  // Update progress ring
  const progress = (length / MAX_CHARS) * CIRCLE_CIRCUMFERENCE;
  counterProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE - progress;
  
  // Update colors based on remaining chars
  const remaining = MAX_CHARS - length;
  
  charCount.classList.remove('warning', 'error');
  counterProgress.classList.remove('warning', 'error');
  tweetInput.classList.remove('warning', 'error');
  
  if (remaining <= 0) {
    charCount.classList.add('error');
    counterProgress.classList.add('error');
    tweetInput.classList.add('error');
  } else if (remaining <= 20) {
    charCount.classList.add('warning');
    counterProgress.classList.add('warning');
    tweetInput.classList.add('warning');
  }
  
  // Enable/disable tweet button
  tweetBtn.disabled = length === 0 || length > MAX_CHARS;
}

// Fetch user info from Twitter
async function fetchUserInfo() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getUserInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error || 'Failed to fetch user info'));
      }
    });
  });
}

// Post tweet
async function postTweet(text) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'postTweet', text }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error || 'Failed to post tweet'));
      }
    });
  });
}

// Update UI with user info
function updateUserUI(user) {
  profilePic.src = user.profileImageUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2371767b"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
  displayName.textContent = user.name || 'Twitter User';
  usernameEl.textContent = `@${user.screenName || 'user'}`;
}

// Initialize
async function init() {
  showScreen(loadingScreen);
  
  try {
    const userInfo = await fetchUserInfo();
    updateUserUI(userInfo);
    showScreen(tweetScreen);
    
    // Save user info to storage
    chrome.storage.local.set({ userInfo });
  } catch (error) {
    console.error('Init error:', error);
    showScreen(loginScreen);
  }
}

// Event Listeners
refreshBtn.addEventListener('click', () => {
  init();
});

tweetInput.addEventListener('input', () => {
  updateCharCounter();
  hideStatus();
});

tweetBtn.addEventListener('click', async () => {
  const text = tweetInput.value.trim();
  
  if (!text || text.length > MAX_CHARS) return;
  
  tweetBtn.disabled = true;
  document.body.classList.add('posting');
  hideStatus();
  
  try {
    await postTweet(text);
    showStatus('Tweet posted successfully!', 'success');
    tweetInput.value = '';
    updateCharCounter();
  } catch (error) {
    console.error('Tweet error:', error);
    showStatus(error.message || 'Failed to post tweet', 'error');
  } finally {
    document.body.classList.remove('posting');
    tweetBtn.disabled = tweetInput.value.length === 0;
  }
});

// Keyboard shortcut: Ctrl/Cmd + Enter to post
tweetInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !tweetBtn.disabled) {
    tweetBtn.click();
  }
});

// Initialize on popup open
init();
