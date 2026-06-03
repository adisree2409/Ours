/**
 * Ours — shared utilities, storage, and navigation helpers
 */

const OURS_STORAGE_KEY = "ours.library.v1";

/** @typedef {{ id: string, type: string, title: string, creator: string, year: string, image: string, link: string, addedAt: string }} LibraryItem */

/**
 * @param {string} path - e.g. "index.html" or "search.html"
 * @returns {boolean}
 */
function isActivePage(path) {
  const current = window.location.pathname.split("/").pop() || "index.html";
  return current === path || (path === "index.html" && (current === "" || current === "index.html"));
}

function markActiveNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const target = link.getAttribute("data-nav");
    if (target && isActivePage(target)) {
      link.classList.add("active");
    }
  });
}

/** @returns {LibraryItem[]} */
function loadLibrary() {
  try {
    const raw = localStorage.getItem(OURS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {LibraryItem[]} items */
function saveLibrary(items) {
  localStorage.setItem(OURS_STORAGE_KEY, JSON.stringify(items));
}

/**
 * @param {LibraryItem} item
 * @returns {boolean} true if newly added
 */
function addToLibrary(item) {
  const library = loadLibrary();
  const exists = library.some((e) => e.id === item.id && e.type === item.type);
  if (exists) return false;
  library.unshift({ ...item, addedAt: new Date().toISOString() });
  saveLibrary(library);
  return true;
}

/**
 * @param {string} id
 * @param {string} type
 */
function removeFromLibrary(id, type) {
  const filtered = loadLibrary().filter((e) => !(e.id === id && e.type === type));
  saveLibrary(filtered);
}

/**
 * @param {string} id
 * @param {string} type
 */
function isInLibrary(id, type) {
  return loadLibrary().some((e) => e.id === id && e.type === type);
}

/**
 * @param {string} text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * @param {string} type
 */
function typeBadgeClass(type) {
  const map = { movie: "badge-movie", tv: "badge-tv", book: "badge-book", youtube: "badge-youtube" };
  return map[type] || "badge-movie";
}

/**
 * @param {string} type
 */
function typeLabel(type) {
  const map = { movie: "Movie", tv: "TV Show", book: "Book", youtube: "YouTube" };
  return map[type] || type;
}

/**
 * @param {string} type
 */
function typeEmoji(type) {
  const map = { movie: "🎬", tv: "📺", book: "📚", youtube: "▶️" };
  return map[type] || "💫";
}

document.addEventListener("DOMContentLoaded", markActiveNav);
