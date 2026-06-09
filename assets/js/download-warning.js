function buildDownloadWarningModal() {
  const modal = document.createElement("div");
  modal.className = "download-warning";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="download-warning__overlay" data-download-warning-close></div>
    <section class="download-warning__card" role="dialog" aria-modal="true" aria-labelledby="downloadWarningTitle">
      <p class="download-warning__eyebrow">Uso do MP3</p>
      <h2 id="downloadWarningTitle">Antes de baixar</h2>
      <p class="download-warning__text">
        Este arquivo &eacute; liberado apenas para escuta e avalia&ccedil;&atilde;o. N&atilde;o &eacute; permitido gravar,
        distribuir, publicar ou monetizar este beat sem comprar uma licen&ccedil;a.
      </p>
      <div class="download-warning__summary" id="downloadWarningSummary"></div>
      <div class="download-warning__actions">
        <button type="button" class="download-warning__btn" data-download-warning-close>Cancelar</button>
        <button type="button" class="download-warning__btn" id="downloadWarningLicense">Ver licen&ccedil;as</button>
        <button type="button" class="download-warning__btn download-warning__btn--primary" id="downloadWarningConfirm">Baixar MP3</button>
      </div>
    </section>
  `;
  document.body.appendChild(modal);
  return modal;
}

const downloadWarningModal = buildDownloadWarningModal();
const downloadWarningSummary = document.getElementById("downloadWarningSummary");
const downloadWarningConfirm = document.getElementById("downloadWarningConfirm");
const downloadWarningLicense = document.getElementById("downloadWarningLicense");
let pendingDownload = null;
let pendingLicenseUrl = "";

function setDownloadWarningOpen(isOpen) {
  downloadWarningModal.classList.toggle("is-open", isOpen);
  downloadWarningModal.setAttribute("aria-hidden", isOpen ? "false" : "true");

  if (!isOpen) {
    pendingDownload = null;
    pendingLicenseUrl = "";
  }
}

function openDownloadWarning(options) {
  const beat = options && options.beat ? options.beat : {};
  pendingDownload = typeof options.onConfirm === "function" ? options.onConfirm : null;
  pendingLicenseUrl = options.licenseUrl || "";

  if (downloadWarningSummary) {
    downloadWarningSummary.innerHTML = `
      <strong>${beat.title || "Beat"}</strong>
      <span>${beat.bpm || "-"} BPM - ${beat.key || "-"}</span>
    `;
  }

  setDownloadWarningOpen(true);
  downloadWarningConfirm?.focus();
}

downloadWarningModal.querySelectorAll("[data-download-warning-close]").forEach((button) => {
  button.addEventListener("click", () => setDownloadWarningOpen(false));
});

downloadWarningConfirm?.addEventListener("click", () => {
  const callback = pendingDownload;
  setDownloadWarningOpen(false);
  if (callback) callback();
});

downloadWarningLicense?.addEventListener("click", () => {
  if (!pendingLicenseUrl) return;
  window.location.href = pendingLicenseUrl;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && downloadWarningModal.classList.contains("is-open")) {
    setDownloadWarningOpen(false);
  }
});

window.JPGDownloadWarning = {
  open: openDownloadWarning
};
