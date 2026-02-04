# Quick Tweet - Chrome Extension

A lightweight Chrome extension that lets you tweet on the go without opening Twitter/X. It uses your existing Twitter session from the browser, so no API keys required!

![Quick Tweet Preview](./preview.png)

## Features

✨ **Session-based Authentication** - Uses your existing Twitter login, no API keys needed  
📝 **Clean Tweet Composer** - Medium-sized text area with character counter  
👤 **Profile Display** - Shows your username and profile picture  
⚡ **Keyboard Shortcut** - Press `Ctrl/Cmd + Enter` to post instantly  
🎨 **Native X/Twitter Design** - Matches the dark theme aesthetic  
📊 **Real-time Character Counter** - Visual progress ring with 280 character limit  

## Installation

### Step 1: Download the Extension
Download or clone this repository to your local machine.

### Step 2: Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder

### Step 3: Login to Twitter/X
Make sure you're logged into Twitter/X in your browser. The extension uses your existing session.

### Step 4: Start Tweeting!
Click the extension icon in your toolbar and start tweeting!

## How It Works

This extension leverages your existing Twitter session cookies to authenticate API requests:

1. When you log into Twitter/X in Chrome, authentication cookies are stored
2. The extension reads these cookies (with your permission)
3. It uses Twitter's internal GraphQL API to:
   - Fetch your profile info (name, username, avatar)
   - Post tweets on your behalf

**No API keys or developer accounts required!**

## Permissions Explained

- **storage** - Save your preferences locally
- **cookies** - Read Twitter session cookies for authentication
- **host_permissions (twitter.com, x.com)** - Access Twitter's API endpoints

## Usage

1. **Click the extension icon** in Chrome toolbar
2. **If not logged in** - You'll see a prompt to log into Twitter first
3. **Compose your tweet** in the text area (280 character limit)
4. **Click "Post"** or press `Ctrl/Cmd + Enter`
5. **Success!** Your tweet is posted

## Troubleshooting

### "Please log in to Twitter first"
- Make sure you're logged into Twitter/X in your browser
- Try refreshing your Twitter tab
- Click the "Refresh" button in the extension

### Tweet fails to post
- Your Twitter session may have expired - refresh Twitter.com and try again
- Check if Twitter is having issues
- Make sure you're not rate-limited

### Extension doesn't load
- Ensure Developer mode is enabled in chrome://extensions
- Try removing and re-adding the extension

## Tech Stack

- **Manifest V3** - Latest Chrome extension architecture
- **Vanilla JavaScript** - No frameworks, lightweight
- **Twitter GraphQL API** - Internal API for posting tweets
- **Chrome Storage API** - Secure credential handling

## Privacy

- No data is sent to any third-party servers
- All authentication happens directly with Twitter
- Your credentials are never stored - only session tokens are used
- Works entirely client-side

## License

MIT License - Feel free to modify and distribute!

---

Made with ❤️ for quick tweeters everywhere
