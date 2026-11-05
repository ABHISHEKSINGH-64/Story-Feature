// Configuration & Constants
const STORAGE_KEY = "stories", MAX_WIDTH = 1080, MAX_HEIGHT = 1920;
const STORY_DURATION = 3000, EXPIRY_MS = 24 * 60 * 60 * 1000, SWIPE_THRESHOLD = 50;

let currentIndex = 0, progressFrameId = null, storyStartedAt = 0;
let touchStartX = 0, touchStartY = 0, ignoreClick = false;

const storyList = document.getElementById("storyList"),
  storyFile = document.getElementById("storyFile"),
  storyViewer = document.getElementById("storyViewer"),
  progressBars = document.getElementById("progressBars"),
  storyImage = document.getElementById("storyImage");

function getStories() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function saveStories(stories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch { alert("Storage is full. This story could not be saved."); }
}
function deleteExpiredStories() {
  const stories = getStories();
  const active = stories.filter(story => Date.now() - story.createdAt < EXPIRY_MS);
  if (active.length < stories.length) saveStories(active);
  return active;
}

function resizeImage(img) {
  let { width, height } = img;
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type || !file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      try {
        const stories = getStories();
        stories.push({ id: Date.now(), image: resizeImage(img), createdAt: Date.now(), seen: false });
        saveStories(stories);
        renderStories();
      } catch { alert("Could not read this image."); }
    };
    img.onerror = reader.onerror = () => alert("Could not read this image.");
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

function renderStories() {
  storyList.innerHTML = "";
  getStories().forEach((story, index) => {
    const item = document.createElement("div");
    item.className = "story-item";
    item.innerHTML = `<button class="story-thumb ${story.seen ? 'seen' : ''}" type="button" aria-label="View story ${index + 1}"><img src="${story.image}" alt="Story"></button><span class="story-label">Story ${index + 1}</span>`;
    item.firstElementChild.onclick = () => openStoryViewer(index);
    storyList.appendChild(item);
  });
}

function clearStoryTimer() {
  if (progressFrameId !== null) cancelAnimationFrame(progressFrameId);
  progressFrameId = null;
}
function setProgressFill(index, percent) {
  const bar = progressBars.children[index];
  if (bar && bar.firstElementChild) {
    bar.firstElementChild.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }
}
function buildProgressBars(count, activeIndex) {
  progressBars.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.innerHTML = `<div class="progress-fill" style="width:${i < activeIndex ? 100 : 0}%"></div>`;
    progressBars.appendChild(bar);
  }
}
function startStoryTimer() {
  clearStoryTimer();
  storyStartedAt = Date.now();
  function tick() {
    if (storyViewer.hidden) return clearStoryTimer();
    const percent = ((Date.now() - storyStartedAt) / STORY_DURATION) * 100;
    if (percent >= 100) {
      setProgressFill(currentIndex, 100);
      clearStoryTimer();
      goToNextStory();
      return;
    }
    setProgressFill(currentIndex, percent);
    progressFrameId = requestAnimationFrame(tick);
  }
  progressFrameId = requestAnimationFrame(tick);
}

function markAsSeen(index) {
  const stories = getStories();
  if (stories[index] && !stories[index].seen) {
    stories[index].seen = true;
    saveStories(stories);
    const thumbs = document.querySelectorAll(".story-thumb");
    if (thumbs[index]) thumbs[index].classList.add("seen");
  }
}
function showStory(index) {
  const stories = getStories();
  if (!stories[index]) return closeStoryViewer();
  currentIndex = index;
  markAsSeen(index);
  storyImage.src = stories[index].image;
  const mins = Math.floor((Date.now() - stories[index].createdAt) / 60000);
  const timeEl = document.getElementById("viewerTime");
  if (timeEl) timeEl.textContent = mins < 1 ? "Just now" : mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
  const avatar = document.getElementById("viewerAvatar");
  if (avatar) avatar.style.backgroundImage = `url(${stories[index].image})`;
  clearStoryTimer();
  buildProgressBars(stories.length, index);
  startStoryTimer();
}
function openStoryViewer(index) {
  if (index >= 0 && index < getStories().length) {
    storyViewer.hidden = false;
    showStory(index);
  }
}
function closeStoryViewer() {
  clearStoryTimer();
  storyViewer.hidden = true;
  storyImage.removeAttribute("src");
  progressBars.innerHTML = "";
}
function goToNextStory() {
  if (currentIndex < getStories().length - 1) showStory(currentIndex + 1);
  else closeStoryViewer();
}
function goToPreviousStory() {
  showStory(currentIndex > 0 ? currentIndex - 1 : 0);
}

function handleZoneClick(action) {
  if (ignoreClick) { ignoreClick = false; return; }
  action();
}
function handleTouchStart(e) {
  if (e.touches[0]) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}
function handleTouchEnd(e) {
  const touch = e.changedTouches[0];
  if (!touch) return;
  const dx = touch.clientX - touchStartX, dy = touch.clientY - touchStartY;
  touchStartX = touchStartY = 0;
  if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
    ignoreClick = true;
    setTimeout(() => { ignoreClick = false; }, 400);
    if (dx < 0) goToNextStory();
    else goToPreviousStory();
  }
}

// Initialization
function initApp() {
  deleteExpiredStories();
  renderStories();
  document.getElementById("addStoryBtn").onclick = () => storyFile.click();
  storyFile.onchange = handleFileSelect;
  document.getElementById("closeViewerBtn").onclick = closeStoryViewer;
  document.getElementById("prevZone").onclick = () => handleZoneClick(goToPreviousStory);
  document.getElementById("nextZone").onclick = () => handleZoneClick(goToNextStory);
  storyViewer.addEventListener("touchstart", handleTouchStart);
  storyViewer.addEventListener("touchend", handleTouchEnd);
}

initApp();
