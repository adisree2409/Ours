/**
 * ours — 0–10 heart rating (0.5 steps), half-filled hearts
 */

function renderHeartRatingHtml(value, opts = {}) {
  const { compact = false, interactive = false, inputName = "rating" } = opts;
  const rating = Math.max(0, Math.min(10, Number(value) || 0));
  const hearts = [];

  for (let i = 1; i <= 10; i += 1) {
    let state = "empty";
    if (rating >= i) state = "full";
    else if (rating >= i - 0.5) state = "half";

    if (interactive) {
      hearts.push(
        `<button type="button" class="heart-btn" data-heart="${i}" aria-label="Rate ${i} out of 10">
          <span class="heart-icon heart-${state}" aria-hidden="true">♥</span>
        </button>`
      );
    } else {
      hearts.push(`<span class="heart-icon heart-${state}" aria-hidden="true">♥</span>`);
    }
  }

  const label = compact
    ? `<span class="rating-value">${rating.toFixed(1)}</span>`
    : `<span class="rating-value">${rating.toFixed(1)}<span class="rating-max">/10</span></span>`;

  return `<div class="heart-rating ${compact ? "heart-rating--compact" : ""} ${interactive ? "heart-rating--interactive" : ""}" data-rating="${rating}">
    <div class="heart-row">${hearts.join("")}</div>
    ${label}
  </div>`;
}

function ratingFromHeartClick(heartIndex, clickX, buttonRect) {
  const mid = buttonRect.left + buttonRect.width / 2;
  const half = clickX < mid;
  return half ? heartIndex - 0.5 : heartIndex;
}

function bindInteractiveRating(container, onChange) {
  let current = Number(container.dataset.rating) || 0;

  const update = (val) => {
    current = Math.max(0, Math.min(10, val));
    container.dataset.rating = String(current);
    container.querySelector(".rating-value").textContent = current.toFixed(1);
    container.querySelectorAll(".heart-btn").forEach((btn) => {
      const i = Number(btn.dataset.heart);
      const icon = btn.querySelector(".heart-icon");
      icon.classList.remove("heart-full", "heart-half", "heart-empty");
      if (current >= i) icon.classList.add("heart-full");
      else if (current >= i - 0.5) icon.classList.add("heart-half");
      else icon.classList.add("heart-empty");
    });
    if (onChange) onChange(current);
  };

  container.querySelectorAll(".heart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect();
      const val = ratingFromHeartClick(Number(btn.dataset.heart), e.clientX, rect);
      update(val);
    });
  });

  return () => current;
}

function ensureSaveModal() {
  let modal = document.getElementById("saveModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "saveModal";
  modal.className = "modal hidden";
  modal.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel" role="dialog" aria-labelledby="saveModalTitle" aria-modal="true">
      <button type="button" class="modal-close" data-close aria-label="Close">×</button>
      <h2 id="saveModalTitle" class="modal-title">save to ours</h2>
      <p class="modal-sub" id="saveModalItem"></p>
      <p class="modal-label">your rating</p>
      <div id="saveModalRating"></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>cancel</button>
        <button type="button" class="btn btn-glow" id="saveModalConfirm">save ♥</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", () => modal.classList.add("hidden"));
  });

  return modal;
}

function openSaveModal(item, onSaved) {
  const modal = ensureSaveModal();
  const titleEl = document.getElementById("saveModalItem");
  const ratingWrap = document.getElementById("saveModalRating");
  const confirmBtn = document.getElementById("saveModalConfirm");

  titleEl.textContent = `${item.title} · ${typeLabel(item.type)}`;
  ratingWrap.innerHTML = renderHeartRatingHtml(8, { interactive: true });
  const getRating = bindInteractiveRating(ratingWrap.firstElementChild, null);

  modal.classList.remove("hidden");

  const onConfirm = () => {
    const rating = getRating();
    const payload = { ...item, rating };
    const added = addToLibrary(payload);
    if (added) {
      modal.classList.add("hidden");
      if (onSaved) onSaved(payload);
    }
    confirmBtn.removeEventListener("click", onConfirm);
  };

  confirmBtn.addEventListener("click", onConfirm);
}
