let activeFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#libraryFilters .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll("#libraryFilters .tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderLibrary();
    });
  });

  document.addEventListener("ours:library-changed", renderLibrary);
  renderLibrary();
});

function renderLibrary() {
  const grid = document.getElementById("libraryGrid");
  const empty = document.getElementById("libraryEmpty");
  let items = loadLibrary();

  if (activeFilter !== "all") {
    items = items.filter((item) => item.type === activeFilter);
  }

  if (!items.length) {
    grid.innerHTML = "";
    grid.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  grid.classList.remove("hidden");
  renderResultsGrid(grid, items, { showAdd: false, showRemove: true });
}
