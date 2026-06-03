/**
 * ours — search & recommendations (TMDB, YouTube Data API, Open Library)
 */

function getApiConfig() {
  const c = typeof window !== "undefined" && window.OURS_CONFIG ? window.OURS_CONFIG : {};
  return {
    TMDB_API_KEY: (c.TMDB_API_KEY || "").trim(),
    YOUTUBE_API_KEY: (c.YOUTUBE_API_KEY || "").trim()
  };
}

const CATEGORY_DEFAULTS = {
  movie: ["Parasite", "Interstellar", "Spirited Away", "The Grand Budapest Hotel"],
  tv: ["Breaking Bad", "Severance", "The Bear", "Dark"],
  book: ["Norwegian Wood", "The Midnight Library", "Project Hail Mary"],
  youtube: ["cinematic video essay", "travel documentary 4k", "science explained"]
};

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

async function tmdbFetch(path) {
  const { TMDB_API_KEY } = getApiConfig();
  if (!TMDB_API_KEY) return null;
  const url = `https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function mapTmdbMovie(m) {
  return {
    id: String(m.id),
    type: "movie",
    title: m.title,
    creator: m.vote_average ? `★ ${m.vote_average.toFixed(1)} TMDB` : "Film",
    year: m.release_date ? m.release_date.slice(0, 4) : "",
    image: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : "",
    link: `https://www.themoviedb.org/movie/${m.id}`,
    overview: (m.overview || "").slice(0, 160)
  };
}

function mapTmdbTv(t) {
  return {
    id: String(t.id),
    type: "tv",
    title: t.name,
    creator: t.vote_average ? `★ ${t.vote_average.toFixed(1)} TMDB` : "Series",
    year: t.first_air_date ? t.first_air_date.slice(0, 4) : "",
    image: t.poster_path ? `${TMDB_IMG}${t.poster_path}` : "",
    link: `https://www.themoviedb.org/tv/${t.id}`,
    overview: (t.overview || "").slice(0, 160)
  };
}

async function searchMedia(category, query) {
  const q = query.trim();
  if (!q) return { results: [], recommendations: [] };

  let results = [];
  let recommendations = [];

  switch (category) {
    case "movie":
      results = await searchMovies(q);
      recommendations = await getMovieRecommendations(results);
      break;
    case "tv":
      results = await searchTV(q);
      recommendations = await getTVRecommendations(results);
      break;
    case "book":
      results = await searchBooks(q);
      recommendations = await getBookRecommendations(q, results);
      break;
    case "youtube":
      results = await searchYouTube(q);
      recommendations = await getYouTubeRecommendations(q, results);
      break;
    default:
      break;
  }

  return { results, recommendations };
}

async function searchMovies(query) {
  const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}&page=1`);
  if (data?.results?.length) {
    return data.results.slice(0, 12).map(mapTmdbMovie);
  }
  return [];
}

async function searchTV(query) {
  const data = await tmdbFetch(`/search/tv?query=${encodeURIComponent(query)}&page=1`);
  if (data?.results?.length) {
    return data.results.slice(0, 12).map(mapTmdbTv);
  }
  return [];
}

async function searchYouTube(query) {
  const { YOUTUBE_API_KEY } = getApiConfig();
  if (!YOUTUBE_API_KEY) return [];
  try {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      q: query,
      maxResults: "12",
      key: YOUTUBE_API_KEY,
      relevanceLanguage: "en",
      safeSearch: "moderate"
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item) => {
      const sn = item.snippet || {};
      const thumbs = sn.thumbnails || {};
      return {
        id: item.id?.videoId || "",
        type: "youtube",
        title: sn.title || "Video",
        creator: sn.channelTitle || "YouTube",
        year: sn.publishedAt ? sn.publishedAt.slice(0, 4) : "",
        image: thumbs.medium?.url || thumbs.default?.url || "",
        link: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : "#",
        overview: (sn.description || "").slice(0, 120)
      };
    }).filter((v) => v.id);
  } catch (e) {
    console.warn("YouTube search failed", e);
    return [];
  }
}

async function searchBooks(query) {
  const results = [];
  try {
    const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&language=eng&fields=key,title,author_name,first_publish_year,cover_i`;
    const res = await fetch(olUrl);
    if (res.ok) {
      const data = await res.json();
      for (const doc of (data.docs || []).slice(0, 12)) {
        results.push({
          id: doc.key || String(Math.random()),
          type: "book",
          title: doc.title || "Untitled",
          creator: (doc.author_name && doc.author_name[0]) || "Unknown author",
          year: doc.first_publish_year ? String(doc.first_publish_year) : "",
          image: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
          link: doc.key ? `https://openlibrary.org${doc.key}` : "#",
          overview: ""
        });
      }
    }
  } catch (e) {
    console.warn("Open Library failed", e);
  }

  if (results.length < 4) {
    try {
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&langRestrict=en`;
      const res = await fetch(gbUrl);
      if (res.ok) {
        const data = await res.json();
        for (const item of data.items || []) {
          const v = item.volumeInfo || {};
          results.push({
            id: item.id,
            type: "book",
            title: v.title || "Untitled",
            creator: (v.authors && v.authors[0]) || "Unknown",
            year: v.publishedDate ? v.publishedDate.slice(0, 4) : "",
            image: v.imageLinks?.thumbnail?.replace("http:", "https:") || "",
            link: v.infoLink || "#",
            overview: (v.description || "").slice(0, 120)
          });
        }
      }
    } catch (e) {
      console.warn("Google Books failed", e);
    }
  }

  return dedupeByTitle(results).slice(0, 12);
}

async function getMovieRecommendations(results) {
  if (!results[0]?.id) return [];
  const data = await tmdbFetch(`/movie/${results[0].id}/recommendations?page=1`);
  if (data?.results?.length) {
    return data.results.slice(0, 6).map((m) => ({
      ...mapTmdbMovie(m),
      overview: "Recommended for you"
    }));
  }
  return [];
}

async function getTVRecommendations(results) {
  if (!results[0]?.id) return [];
  const data = await tmdbFetch(`/tv/${results[0].id}/recommendations?page=1`);
  if (data?.results?.length) {
    return data.results.slice(0, 6).map((t) => ({
      ...mapTmdbTv(t),
      overview: "Recommended for you"
    }));
  }
  return [];
}

async function getBookRecommendations(query, results) {
  const author = results[0]?.creator;
  if (author && author !== "Unknown author" && author !== "Unknown") {
    try {
      const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=6&language=eng&fields=key,title,author_name,first_publish_year,cover_i`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return (data.docs || []).slice(0, 6).map((doc) => ({
          id: doc.key,
          type: "book",
          title: doc.title,
          creator: (doc.author_name && doc.author_name[0]) || author,
          year: doc.first_publish_year ? String(doc.first_publish_year) : "",
          image: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
          link: `https://openlibrary.org${doc.key}`,
          overview: `More by ${author}`
        }));
      }
    } catch (e) {
      console.warn("Book author recs failed", e);
    }
  }
  return [];
}

async function getYouTubeRecommendations(query, results) {
  if (results[0]?.creator) {
    const related = await searchYouTube(`${results[0].creator} official`);
    return related.filter((r) => r.id !== results[0].id).slice(0, 6);
  }
  return searchYouTube(`${query} related`).then((r) => r.slice(0, 6));
}

async function getFeatured(category) {
  const picks = CATEGORY_DEFAULTS[category] || [];
  const random = picks[Math.floor(Math.random() * picks.length)];
  const { results } = await searchMedia(category, random);
  return results.slice(0, 3);
}

function dedupeByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type}:${item.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createResultCard(item, opts = {}) {
  const { showAdd = true, showRemove = false } = opts;
  const card = document.createElement("article");
  card.className = "result-card";
  card.dataset.id = item.id;
  card.dataset.type = item.type;

  const inLib = isInLibrary(item.id, item.type);
  const libItem = inLib ? getLibraryItem(item.id, item.type) : null;
  const ratingHtml =
    libItem?.rating != null
      ? `<div class="card-rating">${renderHeartRatingHtml(libItem.rating, { compact: true })}</div>`
      : "";

  const posterContent = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy" />`
    : `<span class="poster-fallback">${typeEmoji(item.type)}</span>`;

  card.innerHTML = `
    <div class="result-poster">${posterContent}</div>
    <div class="result-body">
      <span class="badge ${typeBadgeClass(item.type)}">${typeLabel(item.type)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="result-meta">${escapeHtml(item.creator)}${item.year ? ` · ${escapeHtml(item.year)}` : ""}</p>
      ${item.overview ? `<p class="result-overview">${escapeHtml(item.overview)}</p>` : ""}
      ${ratingHtml}
      <div class="result-actions">
        ${showAdd ? `<button type="button" class="btn btn-sm btn-glow add-btn" ${inLib ? "disabled" : ""}>${inLib ? "saved ♥" : "save to ours"}</button>` : ""}
        ${showRemove ? `<button type="button" class="btn btn-sm btn-ghost remove-btn">remove</button>` : ""}
        ${item.link && item.link !== "#" ? `<a href="${escapeHtml(item.link)}" class="btn btn-sm btn-ghost" target="_blank" rel="noopener">view</a>` : ""}
      </div>
    </div>
  `;

  const addBtn = card.querySelector(".add-btn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      if (typeof openSaveModal === "function") {
        openSaveModal(item, (saved) => {
          addBtn.textContent = "saved ♥";
          addBtn.disabled = true;
          const html = renderHeartRatingHtml(saved.rating ?? 0, { compact: true });
          const existing = card.querySelector(".card-rating");
          if (existing) existing.outerHTML = `<div class="card-rating">${html}</div>`;
          else card.querySelector(".result-actions")?.insertAdjacentHTML("beforebegin", `<div class="card-rating">${html}</div>`);
        });
      }
    });
  }

  const removeBtn = card.querySelector(".remove-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      removeFromLibrary(item.id, item.type);
      card.remove();
      document.dispatchEvent(new CustomEvent("ours:library-changed"));
    });
  }

  return card;
}

function renderResultsGrid(container, items, opts) {
  container.innerHTML = "";
  if (!items.length) {
    const cfg = getApiConfig();
    let hint = "Try another title or keyword.";
    if (!cfg.TMDB_API_KEY && (opts?.needsTmdb || true)) {
      hint += " Ensure js/config.js is loaded with your API keys.";
    }
    container.innerHTML = `<p class="search-status">${hint}</p>`;
    return;
  }
  items.forEach((item) => container.appendChild(createResultCard(item, opts)));
}
