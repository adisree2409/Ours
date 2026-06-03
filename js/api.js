/**
 * Ours — search & recommendations via free public APIs
 * Movies/TV: TMDB (optional key) + iTunes fallback
 * Books: Open Library + Google Books fallback
 * YouTube: Invidious public API (no key required)
 */

const CONFIG = {
  /** Get a free key at https://www.themoviedb.org/settings/api — paste below for richer movie/TV results */
  TMDB_API_KEY: "",
  /** Invidious instances rotate; first working one is used */
  INVIDIOUS_INSTANCES: [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://invidious.io.lol"
  ]
};

const CATEGORY_DEFAULTS = {
  movie: ["Spirited Away", "Parasite", "Amélie", "Cinema Paradiso"],
  tv: ["Breaking Bad", "Dark", "Squid Game", "Fleabag"],
  book: ["One Hundred Years of Solitude", "Norwegian Wood", "The God of Small Things"],
  youtube: ["travel documentary", "cooking tutorial", "science explained"]
};

/**
 * @param {string} category
 * @param {string} query
 */
async function searchMedia(category, query) {
  const q = query.trim();
  if (!q) return { results: [], recommendations: [] };

  let results = [];
  let recommendations = [];

  switch (category) {
    case "movie":
      results = await searchMovies(q);
      recommendations = await getMovieRecommendations(q, results);
      break;
    case "tv":
      results = await searchTV(q);
      recommendations = await getTVRecommendations(q, results);
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
  if (CONFIG.TMDB_API_KEY) {
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).slice(0, 12).map((m) => ({
          id: String(m.id),
          type: "movie",
          title: m.title,
          creator: m.original_language ? `Lang: ${m.original_language.toUpperCase()}` : "Film",
          year: m.release_date ? m.release_date.slice(0, 4) : "",
          image: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : "",
          link: `https://www.themoviedb.org/movie/${m.id}`,
          overview: m.overview || ""
        }));
      }
    } catch (e) {
      console.warn("TMDB movie search failed", e);
    }
  }
  return searchITunes(query, "movie");
}

async function searchTV(query) {
  if (CONFIG.TMDB_API_KEY) {
    try {
      const url = `https://api.themoviedb.org/3/search/tv?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).slice(0, 12).map((t) => ({
          id: String(t.id),
          type: "tv",
          title: t.name,
          creator: t.original_language ? `Lang: ${t.original_language.toUpperCase()}` : "Series",
          year: t.first_air_date ? t.first_air_date.slice(0, 4) : "",
          image: t.poster_path ? `https://image.tmdb.org/t/p/w342${t.poster_path}` : "",
          link: `https://www.themoviedb.org/tv/${t.id}`,
          overview: t.overview || ""
        }));
      }
    } catch (e) {
      console.warn("TMDB TV search failed", e);
    }
  }
  return searchITunes(query, "tv");
}

async function searchITunes(query, media) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=${media}&limit=12`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((item) => ({
      id: String(item.trackId || item.collectionId || item.artistId),
      type: media === "tvSeason" || media === "tv" ? "tv" : "movie",
      title: item.trackName || item.collectionName || item.artistName,
      creator: item.artistName || item.primaryGenreName || "",
      year: item.releaseDate ? String(new Date(item.releaseDate).getFullYear()) : "",
      image: item.artworkUrl100 ? item.artworkUrl100.replace("100x100", "600x600") : "",
      link: item.trackViewUrl || item.collectionViewUrl || "#",
      overview: item.longDescription || item.shortDescription || ""
    }));
  } catch (e) {
    console.warn("iTunes search failed", e);
    return [];
  }
}

async function searchBooks(query) {
  const results = [];
  try {
    const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&fields=key,title,author_name,first_publish_year,cover_i,language`;
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
          overview: doc.language ? `Languages: ${doc.language.join(", ")}` : ""
        });
      }
    }
  } catch (e) {
    console.warn("Open Library failed", e);
  }

  if (results.length < 4) {
    try {
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`;
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
            overview: v.description ? String(v.description).slice(0, 120) : ""
          });
        }
      }
    } catch (e) {
      console.warn("Google Books failed", e);
    }
  }

  return dedupeByTitle(results).slice(0, 12);
}

async function searchYouTube(query) {
  for (const base of CONFIG.INVIDIOUS_INSTANCES) {
    try {
      const url = `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort=relevance`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      return (data || []).slice(0, 12).map((v) => ({
        id: v.videoId,
        type: "youtube",
        title: v.title,
        creator: v.author || "YouTube",
        year: v.published ? String(new Date(v.published * 1000).getFullYear()) : "",
        image: v.videoThumbnails?.[0]?.url || "",
        link: `https://www.youtube.com/watch?v=${v.videoId}`,
        overview: v.description ? String(v.description).slice(0, 100) : ""
      }));
    } catch {
      continue;
    }
  }
  return [];
}

async function getMovieRecommendations(query, results) {
  if (CONFIG.TMDB_API_KEY && results[0]?.id) {
    try {
      const url = `https://api.themoviedb.org/3/movie/${results[0].id}/recommendations?api_key=${CONFIG.TMDB_API_KEY}&language=en-US&page=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).slice(0, 6).map((m) => ({
          id: String(m.id),
          type: "movie",
          title: m.title,
          creator: "Recommended",
          year: m.release_date ? m.release_date.slice(0, 4) : "",
          image: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : "",
          link: `https://www.themoviedb.org/movie/${m.id}`,
          overview: "Because you searched for similar films"
        }));
      }
    } catch (e) {
      console.warn("TMDB recommendations failed", e);
    }
  }
  const seed = results[0]?.creator || query.split(" ")[0] || "drama";
  return searchITunes(seed, "movie").then((r) => r.slice(0, 6));
}

async function getTVRecommendations(query, results) {
  if (CONFIG.TMDB_API_KEY && results[0]?.id) {
    try {
      const url = `https://api.themoviedb.org/3/tv/${results[0].id}/recommendations?api_key=${CONFIG.TMDB_API_KEY}&language=en-US&page=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).slice(0, 6).map((t) => ({
          id: String(t.id),
          type: "tv",
          title: t.name,
          creator: "Recommended",
          year: t.first_air_date ? t.first_air_date.slice(0, 4) : "",
          image: t.poster_path ? `https://image.tmdb.org/t/p/w342${t.poster_path}` : "",
          link: `https://www.themoviedb.org/tv/${t.id}`,
          overview: "Because you searched for similar shows"
        }));
      }
    } catch (e) {
      console.warn("TMDB TV recs failed", e);
    }
  }
  const alt = query.includes(" ") ? query.split(" ").slice(-1)[0] : "series";
  return searchITunes(alt, "tv").then((r) => r.slice(0, 6));
}

async function getBookRecommendations(query, results) {
  const author = results[0]?.creator;
  if (author && author !== "Unknown author" && author !== "Unknown") {
    try {
      const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i`;
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
  const subject = query.split(" ")[0] || "fiction";
  try {
    const url = `https://openlibrary.org/search.json?subject=${encodeURIComponent(subject)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return (data.docs || []).map((doc) => ({
        id: doc.key,
        type: "book",
        title: doc.title,
        creator: (doc.author_name && doc.author_name[0]) || "",
        year: doc.first_publish_year ? String(doc.first_publish_year) : "",
        image: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
        link: `https://openlibrary.org${doc.key}`,
        overview: "Related reads"
      }));
    }
  } catch (e) {
    console.warn("Book subject recs failed", e);
  }
  return [];
}

async function getYouTubeRecommendations(query, results) {
  const channel = results[0]?.creator;
  if (channel && channel !== "YouTube") {
    const related = await searchYouTube(channel);
    return related.filter((r) => r.id !== results[0]?.id).slice(0, 6);
  }
  const words = query.split(" ").filter(Boolean);
  const alt = words.length > 1 ? words.slice(0, -1).join(" ") : `${query} documentary`;
  return searchYouTube(alt).then((r) => r.slice(0, 6));
}

/**
 * Featured picks for home page (no search needed)
 * @param {string} category
 */
async function getFeatured(category) {
  const picks = CATEGORY_DEFAULTS[category] || [];
  const random = picks[Math.floor(Math.random() * picks.length)];
  const { results } = await searchMedia(category, random);
  return results.slice(0, 4);
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

/**
 * Build a result card DOM element
 * @param {object} item
 * @param {{ showAdd?: boolean, showRemove?: boolean }} opts
 */
function createResultCard(item, opts = {}) {
  const { showAdd = true, showRemove = false } = opts;
  const card = document.createElement("article");
  card.className = "result-card";
  card.dataset.id = item.id;
  card.dataset.type = item.type;

  const inLib = isInLibrary(item.id, item.type);
  const posterContent = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy" />`
    : typeEmoji(item.type);

  card.innerHTML = `
    <div class="result-poster">${posterContent}</div>
    <div class="result-body">
      <span class="badge ${typeBadgeClass(item.type)}">${typeLabel(item.type)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="result-meta">${escapeHtml(item.creator)}${item.year ? ` · ${escapeHtml(item.year)}` : ""}</p>
      <div class="result-actions">
        ${showAdd ? `<button type="button" class="btn btn-sm btn-secondary add-btn" ${inLib ? "disabled" : ""}>${inLib ? "Saved ♥" : "Save to Ours"}</button>` : ""}
        ${showRemove ? `<button type="button" class="btn btn-sm btn-ghost remove-btn">Remove</button>` : ""}
        ${item.link && item.link !== "#" ? `<a href="${escapeHtml(item.link)}" class="btn btn-sm btn-ghost" target="_blank" rel="noopener">View</a>` : ""}
      </div>
    </div>
  `;

  const addBtn = card.querySelector(".add-btn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const added = addToLibrary({
        id: item.id,
        type: item.type,
        title: item.title,
        creator: item.creator,
        year: item.year,
        image: item.image,
        link: item.link
      });
      if (added) {
        addBtn.textContent = "Saved ♥";
        addBtn.disabled = true;
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
    container.innerHTML = `<p class="search-status">No results found. Try another title or keyword.</p>`;
    return;
  }
  items.forEach((item) => container.appendChild(createResultCard(item, opts)));
}
