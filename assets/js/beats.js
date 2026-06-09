const beatGrid = document.querySelector(".beats-grid");
const beats = window.JPGBeatStore ? window.JPGBeatStore.getAllBeats() : [];
const beatSearchInput = document.getElementById("beatSearchInput");
const beatBpmMin = document.getElementById("beatBpmMin");
const beatBpmMax = document.getElementById("beatBpmMax");
const beatsCount = document.getElementById("beatsCount");
const bpmPresetButtons = document.querySelectorAll("[data-bpm-preset]");

function createBeatUrl(beat) {
  const params = new URLSearchParams({ id: beat.id });
  return `beat.html?${params.toString()}`;
}

function normalizeSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function beatSearchText(beat) {
  return normalizeSearch([
    beat.title,
    beat.key,
    beat.bpm,
    ...(Array.isArray(beat.tags) ? beat.tags : []),
    beat.typeBeat
  ].filter(Boolean).join(" "));
}

function beatBpmValue(beat) {
  const bpm = Number(String(beat.bpm || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(bpm) ? bpm : null;
}

function beatVisibleTags(beat) {
  return Array.isArray(beat.tags) ? beat.tags.filter(Boolean).slice(0, 3) : [];
}

function createDownloadName(beat) {
  const title = String(beat.title || "beat")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${title || "beat"}-preview.mp3`;
}

function downloadBeatAudio(beat) {
  if (!beat.audio) {
    window.alert("Este beat ainda n\u00e3o possui MP3 dispon\u00edvel para download.");
    return;
  }

  const startDownload = () => {
    const link = document.createElement("a");
    link.href = beat.audio;
    link.download = createDownloadName(beat);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (window.JPGDownloadWarning) {
    window.JPGDownloadWarning.open({
      beat,
      licenseUrl: createBeatUrl(beat),
      onConfirm: startDownload
    });
    return;
  }

  startDownload();
}

function currentFilters() {
  const min = Number(beatBpmMin?.value || "");
  const max = Number(beatBpmMax?.value || "");

  return {
    query: normalizeSearch(beatSearchInput?.value),
    minBpm: Number.isFinite(min) && min > 0 ? min : null,
    maxBpm: Number.isFinite(max) && max > 0 ? max : null
  };
}

function matchesFilters(beat, filters) {
  if (filters.query && !beatSearchText(beat).includes(filters.query)) {
    return false;
  }

  const bpm = beatBpmValue(beat);
  if (filters.minBpm !== null && (bpm === null || bpm < filters.minBpm)) {
    return false;
  }

  if (filters.maxBpm !== null && (bpm === null || bpm > filters.maxBpm)) {
    return false;
  }

  return true;
}

function createBeatCard(beat) {
  const card = document.createElement("article");
  card.className = "beat-card";
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `Abrir beat ${beat.title}`);
  card.style.cursor = "pointer";

  const cover = document.createElement("img");
  cover.className = "beat-cover";
  cover.src = beat.cover;
  cover.alt = `Capa do beat ${beat.title}`;

  const info = document.createElement("div");
  info.className = "beat-info";

  const title = document.createElement("h3");
  title.className = "beat-title";
  title.textContent = beat.title;

  const meta = document.createElement("p");
  meta.className = "beat-meta";
  meta.textContent = `${beat.bpm} BPM - ${beat.key}`;

  const details = document.createElement("div");
  details.className = "beat-card__details";

  const tags = document.createElement("div");
  tags.className = "beat-tags";
  beatVisibleTags(beat).forEach((tag) => {
    const item = document.createElement("span");
    item.textContent = tag;
    tags.appendChild(item);
  });

  const actions = document.createElement("div");
  actions.className = "beat-card__actions";

  const downloadButton = document.createElement("button");
  downloadButton.className = "beat-download";
  downloadButton.type = "button";
  downloadButton.innerHTML = '<span aria-hidden="true">&darr;</span>';
  downloadButton.title = "Baixar MP3";
  downloadButton.setAttribute("aria-label", `Baixar MP3 do beat ${beat.title}`);
  downloadButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    downloadBeatAudio(beat);
  });

  actions.appendChild(downloadButton);
  details.append(title, meta);
  info.append(details, actions, tags);
  card.append(cover, info);

  const openBeat = () => {
    window.location.href = createBeatUrl(beat);
  };

  card.addEventListener("click", openBeat);
  card.addEventListener("keydown", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openBeat();
    }
  });

  return card;
}

function renderBeats() {
  if (!beatGrid) return;

  const filters = currentFilters();
  const filteredBeats = beats.filter((beat) => matchesFilters(beat, filters));

  beatGrid.innerHTML = "";
  filteredBeats.forEach((beat) => beatGrid.appendChild(createBeatCard(beat)));

  if (beatsCount) {
    const label = filteredBeats.length === 1 ? "1 beat" : `${filteredBeats.length} beats`;
    beatsCount.textContent = filters.query || filters.minBpm || filters.maxBpm ? label : "";
  }

  if (!filteredBeats.length) {
    const empty = document.createElement("p");
    empty.className = "beats-empty";
    empty.textContent = "Nenhum beat encontrado com esses filtros.";
    beatGrid.appendChild(empty);
  }
}

function applyBpmPreset(preset) {
  if (!beatBpmMin || !beatBpmMax) return;

  if (preset === "clear") {
    if (beatSearchInput) beatSearchInput.value = "";
    beatBpmMin.value = "";
    beatBpmMax.value = "";
  }

  renderBeats();
}

const params = new URLSearchParams(window.location.search);
if (beatSearchInput && params.get("q")) {
  beatSearchInput.value = params.get("q");
}

[beatSearchInput, beatBpmMin, beatBpmMax].forEach((input) => {
  input?.addEventListener("input", renderBeats);
});

bpmPresetButtons.forEach((button) => {
  button.addEventListener("click", () => applyBpmPreset(button.dataset.bpmPreset));
});

renderBeats();
