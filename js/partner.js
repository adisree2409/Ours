document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("partnerForm");
  const nameInput = document.getElementById("partnerName");
  const statusEl = document.getElementById("partnerStatus");
  const cardEl = document.getElementById("partnerCard");

  const existing = getPartner();
  if (existing) {
    nameInput.value = existing.name;
    renderPartnerCard(existing);
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const partner = setPartner(nameInput.value);
    if (partner) {
      statusEl.textContent = `Linked with ${partner.name} — couple view will sync when accounts launch.`;
      statusEl.classList.remove("error");
      renderPartnerCard(partner);
    } else {
      statusEl.textContent = "Partner cleared.";
      cardEl.innerHTML = "";
    }
  });

  document.getElementById("clearPartner")?.addEventListener("click", () => {
    setPartner("");
    nameInput.value = "";
    statusEl.textContent = "Partner link removed.";
    cardEl.innerHTML = "";
  });
});

function renderPartnerCard(partner) {
  const cardEl = document.getElementById("partnerCard");
  if (!cardEl) return;
  const lib = loadLibrary();
  cardEl.innerHTML = `
    <div class="partner-linked glass-panel">
      <img src="assets/logo.svg" alt="" width="48" height="33" />
      <h3>our bond</h3>
      <p class="partner-name">${escapeHtml(partner.name)}</p>
      <p class="partner-meta">Your saves: ${lib.length} · Partner feed arrives with Google sign-in (Phase 2)</p>
    </div>
  `;
}
