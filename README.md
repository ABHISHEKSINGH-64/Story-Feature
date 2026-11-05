# 📸 Web Stories Feature

A lightweight, zero-dependency, client-side Stories feature built with vanilla JavaScript, HTML5, and CSS3. Inspired by Instagram, Snapchat, and WhatsApp status updates, this project provides a full-featured story tray and full-screen viewer designed to run entirely in the browser.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Live Demo & Quick Start](#live-demo--quick-start)
- [How It Works (Technical Architecture)](#how-it-works-technical-architecture)
  - [1. Image Ingestion & Compression](#1-image-ingestion--compression)
  - [2. Storage & 24-Hour Auto-Expiration](#2-storage--24-hour-auto-expiration)
  - [3. Full-Screen Viewer & Progress Bar Engine](#3-full-screen-viewer--progress-bar-engine)
  - [4. Navigation & Gesture Controls](#4-navigation--gesture-controls)
- [Configuration & Customization](#configuration--customization)
- [Styling & Design Tokens](#styling--design-tokens)
- [Browser Support & Storage Limits](#browser-support--storage-limits)
- [Roadmap & Enhancements](#roadmap--enhancements)
- [License](#license)

---

## 🌟 Overview

This project implements an ephemeral story viewing system that runs completely client-side without requiring a backend server or external database. Users can upload images directly from their device, which are compressed in memory, stored locally in the browser's `localStorage`, displayed in an interactive story tray, and automatically cleaned up after 24 hours.

---

## ✨ Key Features

- **🚀 Zero Dependencies:** Built with pure Vanilla JavaScript (ES6+), HTML5, and CSS3. No npm packages, build tools, or frameworks required.
- **🖼️ Client-Side Image Compression:** Automatically resizes high-resolution photos to a maximum dimension of 1080x1920 and compresses them to JPEG (0.7 quality) via an off-screen HTML5 `<canvas>` before saving.
- **⏳ 24-Hour Ephemeral Expiry:** Stories store a creation timestamp and are automatically pruned once they exceed 24 hours.
- **⏱️ Segmented Progress Bars:** Clean Instagram-style animated progress indicators that track playback using high-performance `requestAnimationFrame`.
- **👆 Multi-Modal Navigation:**
  - **Left / Right Tap Zones:** Tap the left half of the screen to go back, or the right half to advance.
  - **Swipe Gestures:** Native touch support to swipe left (next) or right (previous) on mobile devices with built-in click de-bouncing.
  - **Auto-Advance:** Stories automatically transition to the next slide every 3 seconds, closing the viewer when the last story finishes.
  - **Direct Thumbnails:** Click any story avatar in the tray to start viewing from that exact item.
- **📱 Fully Responsive:** Beautifully adapts to mobile screens, tablets, and desktop displays with smooth horizontal scrolling for the story avatars.
- **🔒 Privacy First & Offline Ready:** Everything is kept on the user's local browser instance. No telemetry, third-party trackers, or network calls.

---

## 📁 Project Structure

```text
Story Feature/
├── README.md       # Comprehensive documentation and project guide
├── story.html      # Markup for story tray, file picker, and viewer modal
├── story.css       # Clean, modern stylesheet (responsive styles, transitions)
└── story.js        # Core logic: storage, compression, timer engine, gestures
```

### File Breakdown

| File | Purpose |
| :--- | :--- |
| **[`story.html`](story.html)** | Contains the semantic DOM structure: `#storyBar`, the hidden `<input type="file">`, and `#storyViewer` with left/right interaction zones and progress bars. |
| **[`story.css`](story.css)** | Handles the story tray layout, circular avatars with gradient borders, fullscreen modal backdrop, progress bar styling, and mobile breakpoints. |
| **[`story.js`](story.js)** | Implements FileReader handling, Canvas 2D resizing, LocalStorage CRUD operations, 24-hour cleanup routines, timer tick loops, and touch event calculations. |

---

## 🚀 Live Demo & Quick Start

### 1. Direct Browser Launch
No installation or compilation needed. Simply double-click [`story.html`](story.html) or open it from your terminal:

```bash
# macOS
open story.html

# Linux
xdg-open story.html

# Windows
start story.html
```

### 2. Local Development Server (Recommended)
You can also run a simple local web server:

**Using Python 3:**
```bash
python3 -m http.server 8000
```
Then visit: `http://localhost:8000/story.html`

**Using Node.js (`npx serve`):**
```bash
npx serve .
```

---

## 🧠 How It Works (Technical Architecture)

### 1. Image Ingestion & Compression
When a user clicks the **`+`** button, the hidden file input (`<input type="file" accept="image/*">`) is triggered:
1. **Validation:** Checks if the file MIME type matches `image/*`.
2. **File Reading:** Utilizes `FileReader.readAsDataURL()` inside an asynchronous Promise wrapper.
3. **Canvas Resizing:** Calculates proportional scale factors against `MAX_WIDTH` (1080px) and `MAX_HEIGHT` (1920px).
4. **Export:** Renders into an off-screen HTML5 `<canvas>` and outputs a lightweight base64 string using `canvas.toDataURL("image/jpeg", 0.7)`. This prevents blowing past the browser's `localStorage` quota.

### 2. Storage & 24-Hour Auto-Expiration
Stories are stored as a JSON array under the `stories` key:

```json
[
  {
    "id": 1730784200000,
    "image": "data:image/jpeg;base64,...",
    "createdAt": 1730784200000
  }
]
```

On initialization (`initApp`):
- `deleteExpiredStories()` checks each entry against `EXPIRY_MS = 86400000` (24 hours).
- Any story older than 24 hours is purged from the array and persisted back to `localStorage`.
- The remaining valid stories are rendered into the horizontal tray.

### 3. Full-Screen Viewer & Progress Bar Engine
- When a story is opened, `buildProgressBars(count, activeIndex)` dynamically creates progress bars.
  - Previous stories fill to `100%`.
  - Next stories remain at `0%`.
  - The active story fills smoothly via `requestAnimationFrame`.
- The elapsed progress is calculated as:
  $$\text{percent} = \left(\frac{\text{Date.now()} - \text{storyStartedAt}}{\text{STORY\_DURATION}}\right) \times 100$$
- Once $\text{percent} \ge 100$, the system calls `goToNextStory()`. If it was the final story, `closeStoryViewer()` exits the modal and resets the UI.

### 4. Navigation & Gesture Controls
- **Touch Swipe Detection:** Captures `touchstart` and `touchend` coordinates. If the horizontal travel distance ($\Delta x$) exceeds `SWIPE_THRESHOLD` (50px) and dominates vertical travel ($\Delta y$), a swipe is recognized:
  - $\Delta x < 0 \implies$ Next story
  - $\Delta x > 0 \implies$ Previous story
- **Click Debounce (`ignoreClick`):** When a touch gesture completes, mobile browsers often emit a synthetic click event. An `ignoreClick` flag suppresses this click for 400ms to prevent double-skipping stories.
- **Tap Zones:** Invisible buttons covering the left 50% (`#prevZone`) and right 50% (`#nextZone`) handle desktop mouse clicks or stationary mobile taps.

---

## ⚙️ Configuration & Customization

All primary configuration settings are located at the top of [`story.js`](story.js):

```javascript
// Storage identifier in browser localStorage
const STORAGE_KEY = "stories";

// Image dimension limits for canvas scaling
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;

// Display duration per story in milliseconds (3000ms = 3 seconds)
const STORY_DURATION = 3000;

// Expiration time window in milliseconds (24 hours)
const EXPIRY_MS = 24 * 60 * 60 * 1000;

// Minimum horizontal delta required to trigger a swipe
const SWIPE_THRESHOLD = 50;
```

### Common Customizations:
- **Change Story Display Duration:** Adjust `STORY_DURATION` (e.g., set to `5000` for 5 seconds).
- **Change Expiry Period:** Modify `EXPIRY_MS` (e.g., `12 * 60 * 60 * 1000` for 12 hours).
- **Change JPEG Quality:** Edit line 105 in `story.js` (`canvas.toDataURL("image/jpeg", 0.85)`).

---

## 🎨 Styling & Design Tokens

Styles in [`story.css`](story.css) are modular and easy to modify:

- **Story Avatar Ring:** Styled using an Instagram-inspired gradient / border accent:
  ```css
  .story-thumb {
    border: 3px solid #c13584;
    border-radius: 50%;
  }
  ```
- **Story Bar Scrollbar:** Hidden for a native mobile-app feel (`scrollbar-width: none` & `::-webkit-scrollbar { display: none }`).
- **Viewer Backdrop:** Deep black (`#000`) for immersive viewing.
- **Progress Bars:** Translucent white background (`rgba(255, 255, 255, 0.35)`) with solid white fill indicators (`#fff`).

---

## 🌐 Browser Support & Storage Limits

### Browser Support
- Google Chrome (Desktop & Mobile)
- Apple Safari / iOS Safari
- Mozilla Firefox
- Microsoft Edge

### LocalStorage Notice
Standard web browsers typically allocate **5 MB to 10 MB** of `localStorage` per origin. 
- Thanks to the automatic client-side canvas compression (`max 1080x1920` at `0.7` JPEG quality), each story image is typically compressed down to **~100 KB – 300 KB**.
- If storage exceeds browser limits, `saveStories()` catches the `QuotaExceededError` and presents a friendly alert to the user.

---

## 🔮 Roadmap & Enhancements

Ideas for future enhancements:
- [ ] **Hold to Pause:** Pause progress timer and frame animations while the user holds down a finger or mouse button.
- [ ] **Keyboard Navigation:** Support Arrow Left, Arrow Right, and Escape keys.
- [ ] **Video Stories:** Support short video clip playback with synchronized progress bars.
- [ ] **Story Caption / Text Overlays:** Allow users to add text captions or stickers before publishing.
- [ ] **Sound / Audio Toggle:** Include audio mute/unmute buttons for media.
- [ ] **IndexedDB Migration:** Store full-resolution media in IndexedDB to bypass the 5MB `localStorage` limit.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE). Feel free to use, modify, and integrate it into your own web applications!
