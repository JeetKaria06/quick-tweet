# Quick Tweet - Chrome Extension

A lightweight Chrome extension that lets you tweet on the go without opening Twitter/X. Save ideas for later in your Stash. Uses your existing Twitter session — no API keys required!

![Quick Tweet Preview](./preview.png)

## Features

✨ **Session-based Authentication** - Uses your existing Twitter login, no API keys needed  
📝 **Clean Tweet Composer** - Minimal text area with character counter  
🔖 **Stash** - Save tweet ideas for later, edit, delete, or post them when ready  
🌍 **Cinematic Overlay** - Open Quick Tweet anywhere as a beautiful centered modal  
⚡ **Keyboard Shortcuts** - Press `Alt/⌥ + Shift + T` to open, `Ctrl/⌘ + Enter` to post instantly  
🎨 **Light & Dark Theme** - Toggle between themes to match your preference  
📊 **Real-time Character Counter** - Visual progress ring with 280 character limit  
🔄 **Persistent Status** - Reopen the popup mid-post to see progress

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

1. You log into Twitter/X normally in Chrome
2. Click the extension icon to open the composer
3. Write your tweet and click **Post** — the extension opens a compose tab in the background, types your tweet, and clicks post
4. The tab closes automatically and you get a success confirmation

**No API keys or developer accounts required!**

## Cinematic Overlay

Instead of clicking the extension icon, you can bring up Quick Tweet **on any webpage** as a beautiful centered modal.

- Press `Alt/⌥ + Shift + T` on any page to open the overlay
- It features the exact same UI as the popup, but wider and centered on your screen
- The background page is locked and blurred so you can focus on writing
- Press `Esc` or click outside to close it instantly

## Stash — Save Ideas for Later

Got a tweet idea but not ready to post? **Stash it.**

- Click the 🔖 **bookmark icon** next to the Post button to save your draft
- Switch to the **Stash tab** (bookmark icon in the header) to see all saved ideas
- **Edit** — tap the pencil icon to modify inline
- **Post** — tap the send icon to post directly from the stash
- **Delete** — tap the trash icon to remove

All stash data is stored locally in your browser — nothing leaves your machine.

## Permissions Explained

- **storage** - Save your preferences, stash drafts, and tweet posting state locally
- **tabs** - Open a compose tab in the background to post tweets
- **scripting** - Inject the tweet text into the compose page
- **host_permissions (twitter.com, x.com)** - Access Twitter's compose page

## Usage

1. **Click the extension icon** in Chrome toolbar
2. **Compose your tweet** in the text area (280 character limit)
3. **Click "Post"** or press `Ctrl/Cmd + Enter`
4. **Success!** Your tweet is posted
5. **Or save it** — click the bookmark icon to stash it for later

## Troubleshooting

### Tweet fails to post

- Make sure you're logged into Twitter/X in your browser
- Try refreshing your Twitter tab
- Your Twitter session may have expired — log in again at x.com

### Extension doesn't load

- Ensure Developer mode is enabled in `chrome://extensions`
- Try removing and re-adding the extension

## Tech Stack

- **Manifest V3** - Latest Chrome extension architecture
- **Vanilla JavaScript** - No frameworks, lightweight
- **DOM Injection** - Posts tweets via Twitter's native compose UI
- **Chrome Storage API** - Local storage for preferences and stash

## Privacy

- No data is sent to any third-party servers
- All authentication happens directly with Twitter
- Your credentials are never stored — only your existing session is used
- Stash drafts are stored locally in your browser
- Works entirely client-side

## License

**Proprietary** - All Rights Reserved. You may not use, copy, modify, distribute, or sell this software without explicit permission.

---

Made with ❤️ for quick tweeters everywhere
