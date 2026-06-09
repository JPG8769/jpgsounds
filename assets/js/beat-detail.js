const CHECKOUT_KEY = "jpg_checkout_license";
const PLAYER_TRACK_KEY = "jpg_player_track";

const LICENSES = {
  mp3: {
    id: "mp3",
    label: "MP3",
    price: 120,
    intro: "Arquivo MP3 320kbps",
    features: {
      mp3: true,
      wav: false,
      stems: false,
      commercial: true,
      platforms: true,
      exclusive: false
    }
  },
  wav: {
    id: "wav",
    label: "WAV",
    price: 150,
    intro: "Arquivo WAV sem compressão",
    features: {
      mp3: true,
      wav: true,
      stems: false,
      commercial: true,
      platforms: true,
      exclusive: false
    }
  },
  stems: {
    id: "stems",
    label: "STEMS",
    price: 400,
    intro: "Arquivos stems separados",
    features: {
      mp3: true,
      wav: true,
      stems: true,
      commercial: true,
      platforms: true,
      exclusive: false
    }
  },
  exclusiva: {
    id: "exclusiva",
    label: "EXCLUSIVA",
    priceLabel: "A negociar",
    intro: "Beat vendido com exclusividade",
    features: {
      mp3: true,
      wav: true,
      stems: true,
      commercial: true,
      platforms: true,
      exclusive: true
    }
  }
};

const LICENSE_FEATURES = [
  { key: "mp3", label: "MP3" },
  { key: "wav", label: "WAV" },
  { key: "stems", label: "Stems" },
  { key: "commercial", label: "Uso comercial" },
  { key: "platforms", label: "Distribuição" },
  { key: "exclusive", label: "Exclusivo" }
];

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function writeCheckoutItem(item) {
  localStorage.setItem(CHECKOUT_KEY, JSON.stringify(item));
}

const params = new URLSearchParams(window.location.search);
const storedBeats = window.JPGBeatStore ? window.JPGBeatStore.getAllBeats() : [];
const beatFromData = storedBeats.find((item) => item.id === params.get("id"));
const beat = beatFromData || {
  title: params.get("title") || "Sem título",
  bpm: params.get("bpm") || "-",
  key: params.get("key") || "-",
  cover: params.get("cover") || "",
  audio: params.get("audio") || ""
};

const cover = document.getElementById("beatViewCover");
const title = document.getElementById("beatViewTitle");
const meta = document.getElementById("beatViewMeta");
const price = document.getElementById("beatViewPrice");
const hint = document.getElementById("beatViewLicenseHint");
const features = document.getElementById("beatViewLicenseFeatures");
const feedback = document.getElementById("beatViewFeedback");
const buyButton = document.getElementById("beatViewAddCart");
const licenseButtons = document.querySelectorAll(".beat-view-license-btn");
const beatView = document.querySelector(".beat-view");

let selectedLicense = "wav";

function getAvailableLicenses() {
  if (!Array.isArray(beat.availableLicenses) || !beat.availableLicenses.length) {
    return ["mp3", "wav", "stems", "exclusiva"];
  }

  const available = beat.availableLicenses.filter((license) => LICENSES[license]);
  if (available.includes("mp3") && available.includes("wav") && available.includes("stems")) {
    available.push("exclusiva");
  }

  return available;
}

const availableLicenses = getAvailableLicenses();
const defaultLicense = availableLicenses.includes("wav") ? "wav" : availableLicenses[0];

function renderLicense(licenseId) {
  const license = availableLicenses.includes(licenseId)
    ? LICENSES[licenseId]
    : LICENSES[defaultLicense];

  if (!license) {
    return;
  }

  selectedLicense = license.id;

  licenseButtons.forEach((button) => {
    const isAvailable = availableLicenses.includes(button.dataset.license);
    button.hidden = !isAvailable;
    button.disabled = !isAvailable;
    const active = button.dataset.license === license.id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  features.classList.remove("is-switching");
  price.textContent = typeof license.price === "number" ? formatBRL(license.price) : (license.priceLabel || "A negociar");
  hint.textContent = license.intro || "";
  features.innerHTML = "";

  LICENSE_FEATURES.forEach((item) => {
    const enabled = Boolean(license.features && license.features[item.key]);
    const li = document.createElement("li");
    li.className = enabled ? "is-included" : "is-not-included";
    li.innerHTML = `<span>${item.label}</span><strong>${enabled ? "Inclui" : "Não inclui"}</strong>`;
    features.appendChild(li);
  });

  requestAnimationFrame(() => {
    features.classList.add("is-switching");
  });
}

function pushToGlobalPlayer(autoplay) {
  const track = {
    title: beat.title,
    artist: `${beat.bpm} BPM - ${beat.key}`,
    cover: beat.cover,
    audio: beat.audio,
    autoplay: Boolean(autoplay),
    updatedAt: Date.now()
  };

  localStorage.setItem(PLAYER_TRACK_KEY, JSON.stringify(track));
  window.dispatchEvent(new CustomEvent("jpg:player-track", { detail: track }));
}

cover.src = beat.cover;
cover.alt = `Capa do beat ${beat.title}`;
title.textContent = beat.title;
meta.textContent = `${beat.bpm} BPM - ${beat.key}`;

renderLicense(defaultLicense);

licenseButtons.forEach((button) => {
  button.addEventListener("click", () => renderLicense(button.dataset.license || "wav"));
});

buyButton.addEventListener("click", () => {
  const license = LICENSES[selectedLicense] || LICENSES.wav;

  writeCheckoutItem({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    beatTitle: beat.title,
    bpm: beat.bpm,
    key: beat.key,
    cover: beat.cover,
    audio: beat.audio,
    license: license.id,
    licenseLabel: license.label,
    price: typeof license.price === "number" ? license.price : null,
    priceLabel: typeof license.price === "number" ? formatBRL(license.price) : (license.priceLabel || "A negociar"),
    addedAt: new Date().toISOString()
  });

  feedback.textContent = "Abrindo checkout da licença...";
  window.location.href = "cart.html";
});

pushToGlobalPlayer(false);

if (beatView) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      beatView.classList.add("is-ready");
      window.setTimeout(() => {
        beatView.classList.add("has-entered");
      }, 900);
    });
  });
}
