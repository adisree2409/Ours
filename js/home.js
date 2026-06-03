document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;

  const categories = ["movie", "tv", "book", "youtube"];
  grid.innerHTML = `<p class="search-status"><span class="loading-spinner"></span>curating picks…</p>`;

  const settled = await Promise.allSettled(categories.map((cat) => getFeatured(cat)));
  const allFeatured = settled
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  if (!allFeatured.length) {
    grid.innerHTML = `<p class="search-status">Could not load featured items. Check API keys in config.</p>`;
    return;
  }

  const shuffled = allFeatured.sort(() => Math.random() - 0.5).slice(0, 8);
  renderResultsGrid(grid, shuffled, { showAdd: true });
});
