document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;

  const categories = ["movie", "tv", "book", "youtube"];
  const allFeatured = [];

  for (const cat of categories) {
    try {
      const picks = await getFeatured(cat);
      allFeatured.push(...picks);
    } catch (e) {
      console.warn("Featured load failed for", cat, e);
    }
  }

  const shuffled = allFeatured.sort(() => Math.random() - 0.5).slice(0, 8);
  renderResultsGrid(grid, shuffled, { showAdd: true });
});
