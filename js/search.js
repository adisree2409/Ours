let activeCategory = "movie";

const params = new URLSearchParams(window.location.search);
if (params.get("type") && ["movie", "tv", "book", "youtube"].includes(params.get("type"))) {
  activeCategory = params.get("type");
}
if (params.get("q")) {
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("searchInput").value = params.get("q");
    runSearch(params.get("q"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn[data-category]");
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");

  tabs.forEach((tab) => {
    if (tab.dataset.category === activeCategory) {
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
    }

    tab.addEventListener("click", () => {
      activeCategory = tab.dataset.category;
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      updatePlaceholder();
    });
  });

  updatePlaceholder();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runSearch(input.value.trim());
  });
});

function updatePlaceholder() {
  const input = document.getElementById("searchInput");
  const placeholders = {
    movie: "Search movies worldwide — e.g. Parasite, Amélie, RRR…",
    tv: "Search TV shows — e.g. Dark, Fleabag, Money Heist…",
    book: "Search books — e.g. Murakami, One Hundred Years of Solitude…",
    youtube: "Search YouTube — e.g. cooking, documentary, music…"
  };
  input.placeholder = placeholders[activeCategory] || "Search…";
}

async function runSearch(query) {
  const status = document.getElementById("searchStatus");
  const resultsGrid = document.getElementById("resultsGrid");
  const recSection = document.getElementById("recommendationsSection");
  const recGrid = document.getElementById("recommendationsGrid");

  if (!query) {
    status.textContent = "Enter a title or keyword to search.";
    status.classList.add("error");
    return;
  }

  status.classList.remove("error");
  status.innerHTML = `<span class="loading-spinner"></span>Searching ${typeLabel(activeCategory).toLowerCase()} libraries…`;
  resultsGrid.innerHTML = "";
  recSection.classList.add("hidden");

  try {
    const { results, recommendations } = await searchMedia(activeCategory, query);

    if (!results.length) {
      const cfg = getApiConfig();
      let msg = "No results found. Try different spelling or a broader keyword.";
      if ((activeCategory === "movie" || activeCategory === "tv") && !cfg.TMDB_API_KEY) {
        msg += " (TMDB key missing — add js/config.js or GitHub Actions secrets.)";
      }
      if (activeCategory === "youtube" && !cfg.YOUTUBE_API_KEY) {
        msg += " (YouTube key missing.)";
      }
      status.textContent = msg;
      status.classList.add("error");
      return;
    }

    status.textContent = `Found ${results.length} result${results.length === 1 ? "" : "s"} for “${query}”.`;
    renderResultsGrid(resultsGrid, results, { showAdd: true });

    if (recommendations.length) {
      recSection.classList.remove("hidden");
      renderResultsGrid(recGrid, recommendations, { showAdd: true });
    }
  } catch (err) {
    console.error(err);
    status.textContent = "Something went wrong. Check your connection and try again.";
    status.classList.add("error");
  }
}
