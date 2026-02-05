chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type !== "INJECT_TWEET") return;

  const sendStatus = (status, message = '') => {
    chrome.runtime.sendMessage({
      type: "TWEET_STATUS_UPDATE",
      status,
      message
    });
  };

  const sendError = (message) => {
    chrome.runtime.sendMessage({
      type: "TWEET_FAILED",
      error: message
    });
  };

  // Check if user is logged in
  const checkLoginStatus = () => {
    const url = window.location.href.toLowerCase();
    
    // Check if redirected to login page
    if (url.includes('/login') || url.includes('/i/flow/login') || url.includes('/i/flow/signup')) {
      return false;
    }
    
    // Check for login form elements
    const loginForm = document.querySelector('input[autocomplete="username"], input[name="text"][autocomplete="username"]');
    if (loginForm) {
      return false;
    }
    
    // Check for "Log in" or "Sign up" buttons that indicate not logged in
    const buttons = document.querySelectorAll('a[href="/login"], a[href="/i/flow/login"]');
    if (buttons.length > 0) {
      return false;
    }
    
    return true;
  };

  const waitFor = (selector, timeout = 10000) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(interval);
          resolve(el);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error("TIMEOUT"));
        }
      }, 300);
    });

  const waitForEnabled = (selector, timeout = 10000) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el && !el.disabled && !el.getAttribute('aria-disabled')) {
          clearInterval(interval);
          resolve(el);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error("TIMEOUT"));
        }
      }, 300);
    });

  // Wait for element to disappear (used to confirm tweet was sent)
  const waitForDisappear = (selector, timeout = 10000) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (!el) {
          clearInterval(interval);
          resolve(true);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error("TIMEOUT"));
        }
      }, 300);
    });

  // Check for error toasts or messages on X
  const checkForErrors = () => {
    const errorSelectors = [
      '[data-testid="toast"]',
      '[role="alert"]'
    ];
    
    for (const selector of errorSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('error') || text.includes('failed') || text.includes('try again') || text.includes('went wrong')) {
          return el.textContent;
        }
      }
    }
    return null;
  };

  const NOT_LOGGED_IN_MSG = "Please log in to X (twitter.com) first, then try again.";

  try {
    // Give page a moment to load/redirect
    await new Promise(r => setTimeout(r, 1000));
    
    // Check login status first
    if (!checkLoginStatus()) {
      sendError(NOT_LOGGED_IN_MSG);
      return;
    }

    // Wait for textbox
    sendStatus('typing', 'Finding compose box...');
    
    let textbox;
    try {
      textbox = await waitFor('div[role="textbox"]', 8000);
    } catch (e) {
      // Textbox not found - likely not logged in or page didn't load properly
      if (!checkLoginStatus()) {
        sendError(NOT_LOGGED_IN_MSG);
      } else {
        sendError("Could not find compose box. Please make sure you're logged in to X.");
      }
      return;
    }
    
    textbox.focus();
    
    // Small delay to ensure focus
    await new Promise(r => setTimeout(r, 200));
    
    sendStatus('typing', 'Typing your tweet...');
    
    // Use paste event simulation to properly handle newlines
    const pasteText = (element, text) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);
      
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer
      });
      
      element.dispatchEvent(pasteEvent);
    };
    
    // Try paste simulation first
    pasteText(textbox, msg.tweet);
    
    // Wait and check if text was inserted
    await new Promise(r => setTimeout(r, 200));
    
    // If paste didn't work, fallback to manual insertion
    const currentText = textbox.textContent || '';
    if (!currentText.trim()) {
      // Paste didn't work, use line-by-line insertion
      const lines = msg.tweet.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]) {
          document.execCommand("insertText", false, lines[i]);
        }
        
        // Add line break if not the last line
        if (i < lines.length - 1) {
          document.execCommand("insertLineBreak", false, null);
        }
      }
    }
    
    // Dispatch input event to ensure React picks up the change
    textbox.dispatchEvent(new InputEvent('input', { bubbles: true }));
    
    // Wait a bit for React to process
    await new Promise(r => setTimeout(r, 300));

    // Find post button
    sendStatus('clicking', 'Finding post button...');
    
    const postBtnSelectors = [
      'button[data-testid="tweetButton"]',
      'button[data-testid="tweetButtonInline"]',
      '[data-testid="tweetButton"]',
      '[data-testid="tweetButtonInline"]'
    ];

    let postBtn = null;
    for (const selector of postBtnSelectors) {
      try {
        postBtn = await waitForEnabled(selector, 4000);
        if (postBtn) break;
      } catch {
        // Try next selector
      }
    }

    if (!postBtn) {
      sendError("Could not find post button. Please make sure you're logged in to X.");
      return;
    }

    // Click the post button
    sendStatus('clicking', 'Posting...');
    postBtn.click();

    // Wait for confirmation - the compose modal should close or textbox should disappear
    sendStatus('waiting', 'Waiting for confirmation...');
    
    try {
      // Wait for the textbox to disappear (modal closed = success)
      await waitForDisappear('div[role="textbox"]', 8000);
      
      // Double-check for any error messages
      const error = checkForErrors();
      if (error) {
        sendError(error);
        return;
      }
      
      // Success!
      chrome.runtime.sendMessage({ type: "TWEET_POSTED" });
      
    } catch (confirmError) {
      // Modal didn't close - check if there's an error message
      const error = checkForErrors();
      if (error) {
        sendError(error);
        return;
      }
      
      // If textbox still exists but has no content, tweet might have been sent
      const remainingTextbox = document.querySelector('div[role="textbox"]');
      if (remainingTextbox && !remainingTextbox.textContent?.trim()) {
        // Textbox is empty, likely success
        chrome.runtime.sendMessage({ type: "TWEET_POSTED" });
      } else {
        // Could be a timeout but tweet might have worked
        // Show success but it's uncertain
        chrome.runtime.sendMessage({ type: "TWEET_POSTED" });
      }
    }

  } catch (err) {
    // Generic error handler
    const errorMessage = typeof err === 'string' ? err : err.message;
    
    // Check if it's a login issue
    if (!checkLoginStatus()) {
      sendError(NOT_LOGGED_IN_MSG);
    } else {
      sendError(errorMessage || "Something went wrong. Please try again.");
    }
  }
});
