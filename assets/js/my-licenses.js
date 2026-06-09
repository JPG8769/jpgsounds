const MY_LICENSES_AUTH_KEY = "jpg_is_logged_in";
const MY_LICENSES_STORAGE_KEY = "jpg_licenses";

if (localStorage.getItem(MY_LICENSES_AUTH_KEY) !== "true") {
  window.location.href = "index.html";
}

const licensesList = document.getElementById("licensesList");
let licenses = [];

try {
  licenses = JSON.parse(localStorage.getItem(MY_LICENSES_STORAGE_KEY) || "[]");
} catch (_error) {
  licenses = [];
}

if (!Array.isArray(licenses) || licenses.length === 0) {
  licensesList.innerHTML = `
    <div class="empty-state">
      Você ainda não tem beats comprados.
    </div>
  `;
} else {
  licensesList.innerHTML = licenses
    .map(
      (item) => `
        <article class="license-item">
          <div>
            <h3 class="license-title">${item.beatName || "Beat sem nome"}</h3>
            <p class="license-meta">Licença: ${item.licenseName || "Padrão"}</p>
          </div>
          <div class="license-actions">
            <a class="small-btn" href="${item.audioUrl || "#"}" download>Baixar áudio</a>
            <a class="small-btn" href="${item.contractUrl || "#"}" download>Baixar contrato PDF</a>
          </div>
        </article>
      `
    )
    .join("");
}
