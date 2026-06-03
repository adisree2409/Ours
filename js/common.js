/**
 * ours — shared utilities, storage, navigation, loader
 */

const OURS_STORAGE_KEY = "ours.library.v2";
const OURS_PARTNER_KEY = "ours.partner.v1";

/** @typedef {{ id: string, type: string, title: string, creator: string, year: string, image: string, link: string, rating?: number, addedAt: string }} LibraryItem */

function isActivePage(path) {
  const current = window.location.pathname.split("/").pop() || "index.html";
  return current === path || (path === "index.html" && (current === "" || current === "index.html"));
}

function markActiveNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const target = link.getAttribute("data-nav");
    if (target && isActivePage(target)) link.classList.add("active");
  });
}

function loadLibrary() {
  try {
    const raw = localStorage.getItem(OURS_STORAGE_KEY);
    if (!raw) return migrateLegacyLibrary();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function migrateLegacyLibrary() {
  try {
    const old = localStorage.getItem("ours.library.v1");
    if (!old) return [];
    const parsed = JSON.parse(old);
    if (Array.isArray(parsed)) {
      saveLibrary(parsed);
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveLibrary(items) {
  localStorage.setItem(OURS_STORAGE_KEY, JSON.stringify(items));
}

function getLibraryItem(id, type) {
  return loadLibrary().find((e) => e.id === id && e.type === type) || null;
}

function addToLibrary(item) {
  const library = loadLibrary();
  const exists = library.some((e) => e.id === item.id && e.type === item.type);
  if (exists) return false;
  library.unshift({
    ...item,
    rating: item.rating != null ? Number(item.rating) : null,
    addedAt: new Date().toISOString()
  });
  saveLibrary(library);
  return true;
}

function removeFromLibrary(id, type) {
  saveLibrary(loadLibrary().filter((e) => !(e.id === id && e.type === type)));
}

function isInLibrary(id, type) {
  return loadLibrary().some((e) => e.id === id && e.type === type);
}

function getPartner() {
  try {
    const raw = localStorage.getItem(OURS_PARTNER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setPartner(name) {
  if (!name?.trim()) {
    localStorage.removeItem(OURS_PARTNER_KEY);
    return null;
  }
  const partner = { name: name.trim(), linkedAt: new Date().toISOString() };
  localStorage.setItem(OURS_PARTNER_KEY, JSON.stringify(partner));
  return partner;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function typeBadgeClass(type) {
  const map = { movie: "badge-movie", tv: "badge-tv", book: "badge-book", youtube: "badge-youtube" };
  return map[type] || "badge-movie";
}

function typeLabel(type) {
  const map = { movie: "Movie", tv: "TV Show", book: "Book", youtube: "YouTube" };
  return map[type] || type;
}

function typeEmoji(type) {
  const map = { movie: "🎬", tv: "📺", book: "📚", youtube: "▶️" };
  return map[type] || "✦";
}

function injectPageLoader() {
  if (document.getElementById("page-loader")) return;

  const loader = document.createElement("div");
  loader.id = "page-loader";
  loader.className = "page-loader";
  loader.innerHTML = `
    <div class="loader-orbit">
      <img class="loader-heart loader-heart-a" src="assets/logo.svg" alt="" width="56" height="38" />
      <img class="loader-heart loader-heart-b" src="assets/logo.svg" alt="" width="40" height="28" />
    </div>
    <p class="loader-text">ours</p>
  `;
  document.body.prepend(loader);
}

function hidePageLoader() {
  const loader = document.getElementById("page-loader");
  if (!loader) return;
  loader.classList.add("page-loader--hide");
  setTimeout(() => loader.remove(), 700);
}

function initPageLoader() {
  injectPageLoader();
  const start = Date.now();
  const done = () => {
    const elapsed = Date.now() - start;
    const wait = Math.max(0, 1100 - elapsed);
    setTimeout(hidePageLoader, wait);
  };
  if (document.readyState === "complete") done();
  else window.addEventListener("load", done);
}

initPageLoader();
document.addEventListener("DOMContentLoaded", markActiveNav);
