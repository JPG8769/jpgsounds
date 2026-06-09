const adminForm = document.getElementById("beatAdminForm");
const adminList = document.getElementById("adminBeatList");
const adminFeedback = document.getElementById("adminFeedback");
const adminSubmitButton = document.getElementById("adminSubmitButton");
const titleInput = document.getElementById("beatTitle");
const bpmInput = document.getElementById("beatBpm");
const keyInput = document.getElementById("beatKey");
const coverInput = document.getElementById("beatCover");
const audioInput = document.getElementById("beatAudio");
const wavInput = document.getElementById("beatWav");
const stemsInput = document.getElementById("beatStems");
const mp3FileInput = document.getElementById("beatMp3File");
const wavFileInput = document.getElementById("beatWavFile");
const stemsFileInput = document.getElementById("beatStemsFile");
const mp3LicenseToggle = document.getElementById("enableMp3License");
const wavLicenseToggle = document.getElementById("enableWavLicense");
const stemsLicenseToggle = document.getElementById("enableStemsLicense");
const mp3FilePreview = document.getElementById("mp3FilePreview");
const wavFilePreview = document.getElementById("wavFilePreview");
const stemsFilePreview = document.getElementById("stemsFilePreview");
const mp3FilePlayer = document.getElementById("mp3FilePlayer");
const wavFilePlayer = document.getElementById("wavFilePlayer");
const mp3FilePlay = document.getElementById("mp3FilePlay");
const wavFilePlay = document.getElementById("wavFilePlay");
const mp3FileWave = mp3FilePreview ? mp3FilePreview.querySelector(".file-preview__wave") : null;
const wavFileWave = wavFilePreview ? wavFilePreview.querySelector(".file-preview__wave") : null;
const stemsFileMeta = document.getElementById("stemsFileMeta");
const coverFileInput = document.getElementById("beatCoverFile");
const coverDrop = document.getElementById("beatCoverDrop");
const previewCover = document.getElementById("adminPreviewCover");
const previewPlaceholder = document.getElementById("adminPreviewPlaceholder");
const previewTitle = document.getElementById("adminPreviewTitle");
const previewMeta = document.getElementById("adminPreviewMeta");
const previewTags = document.getElementById("adminPreviewTags");
const previewAudio = document.getElementById("adminPreviewAudio");
const tagInputs = Array.from(document.querySelectorAll('input[name="tags"]'));
const tagGroups = Array.from(document.querySelectorAll(".tag-group"));
const tagTabs = Array.from(document.querySelectorAll(".tag-tab"));

let previewFileUrl = "";
let previewAudioUrl = "";
let filePreviewUrls = { mp3: "", wav: "" };
let editingBeatId = "";
let isReadingCover = false;
let isReadingAudio = false;

const licenseFileMap = {
  mp3: { input: audioInput, fileInput: mp3FileInput, toggle: mp3LicenseToggle, label: "MP3" },
  wav: { input: wavInput, fileInput: wavFileInput, toggle: wavLicenseToggle, label: "WAV" },
  stems: { input: stemsInput, fileInput: stemsFileInput, toggle: stemsLicenseToggle, label: "ZIP" }
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function currentPreviewCover() {
  return previewFileUrl || coverInput.value.trim();
}

function renderPreview() {
  const title = titleInput.value.trim();
  const bpm = bpmInput.value.trim();
  const key = keyInput.value.trim();
  const metaParts = [];

  if (bpm) {
    metaParts.push(`${bpm} BPM`);
  }

  if (key) {
    metaParts.push(key);
  }

  const cover = currentPreviewCover();
  coverDrop.classList.toggle("has-cover", Boolean(cover));
  previewCover.hidden = !cover;
  previewPlaceholder.hidden = Boolean(cover);
  const audioPreviewSource = filePreviewUrls.mp3 || filePreviewUrls.wav || previewAudioUrl || audioInput.value || wavInput.value;
  previewAudio.hidden = !audioPreviewSource;
  if (cover) {
    previewCover.src = cover;
  } else {
    previewCover.removeAttribute("src");
  }
  previewCover.alt = title ? `Pr\u00e9via da capa ou GIF do beat ${title}` : "Pr\u00e9via da capa ou GIF do beat";
  previewTitle.textContent = title;
  previewMeta.textContent = metaParts.join(" - ");
  renderPreviewTags();

  if (previewAudio && previewAudio.getAttribute("src") !== audioPreviewSource) {
    previewAudio.src = audioPreviewSource;
    previewAudio.load();
  }
}

function setSubmitLoading(isLoading) {
  adminSubmitButton.classList.toggle("is-loading", isLoading);
  adminSubmitButton.disabled = isLoading;
  adminSubmitButton.querySelector(".admin-submit__text").textContent = isLoading ? "Enviando..." : "Publicar Beat";
}

function getEnabledLicenses() {
  return Object.entries(licenseFileMap)
    .filter(([, config]) => !config.toggle || config.toggle.checked)
    .map(([license]) => license);
}

function updateLicenseToggle(kind) {
  const config = licenseFileMap[kind];
  if (!config || !config.fileInput || !config.toggle) return;

  const field = config.fileInput.closest(".file-field");
  const text = field ? field.querySelector(".license-toggle__text") : null;
  const enabled = config.toggle.checked;

  if (field) {
    field.classList.toggle("is-license-disabled", !enabled);
  }

  if (text) {
    text.textContent = enabled ? "Dispon\u00edvel" : "Oculto";
  }
}

function updateAllLicenseToggles() {
  Object.keys(licenseFileMap).forEach(updateLicenseToggle);
}

function getSelectedTags() {
  return tagInputs.filter((input) => input.checked).map((input) => input.value);
}

function renderPreviewTags() {
  const tags = getSelectedTags();
  previewTags.innerHTML = "";
  previewTags.hidden = !tags.length;

  tags.forEach((tag) => {
    const item = document.createElement("span");
    item.textContent = tag;
    previewTags.appendChild(item);
  });
}

function setSelectedTags(tags) {
  const selected = new Set(Array.isArray(tags) ? tags : []);
  tagInputs.forEach((input) => {
    input.checked = selected.has(input.value);
  });
  updateTagLimits();
}

function updateTagLimits() {
  tagGroups.forEach((group) => {
    const inputs = Array.from(group.querySelectorAll('input[name="tags"]'));
    const selectedCount = inputs.filter((input) => input.checked).length;

    inputs.forEach((input) => {
      input.disabled = !input.checked && selectedCount >= 3;
      input.closest(".tag-chip").classList.toggle("active", input.checked);
    });

    if (selectedCount >= 3 && group.classList.contains("is-active")) {
      closeTagGroups();
    }
  });

  renderPreviewTags();
}

function closeTagGroups() {
  tagTabs.forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-selected", "false");
  });

  tagGroups.forEach((group) => {
    group.classList.remove("is-active");
    group.setAttribute("aria-hidden", "true");
  });
}

function activateTagGroup(tab) {
  const targetId = tab.getAttribute("aria-controls");
  const targetGroup = document.getElementById(targetId);
  const shouldClose = tab.classList.contains("is-active") && targetGroup && targetGroup.classList.contains("is-active");

  if (shouldClose) {
    closeTagGroups();
    return;
  }

  tagTabs.forEach((button) => {
    const isActive = button === tab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tagGroups.forEach((group) => {
    const isActive = group.id === targetId;
    group.classList.toggle("is-active", isActive);
    group.setAttribute("aria-hidden", String(!isActive));
    group.hidden = false;
  });
}

async function setCoverFile(file) {
  if (!file) {
    previewFileUrl = "";
    coverInput.value = "";
    renderPreview();
    return;
  }

  if (previewFileUrl) {
    URL.revokeObjectURL(previewFileUrl);
  }

  previewFileUrl = URL.createObjectURL(file);
  isReadingCover = true;
  renderPreview();

  try {
    coverInput.value = await readFileAsDataUrl(file);
  } finally {
    isReadingCover = false;
    renderPreview();
  }
}

function setMediaFile(file, targetInput, folder) {
  if (!file) {
    targetInput.value = "";
    renderPreview();
    return;
  }

  targetInput.value = `${folder}/${file.name}`;
  renderPreview();
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function revokeFilePreviewUrl(kind) {
  if (filePreviewUrls[kind]) {
    URL.revokeObjectURL(filePreviewUrls[kind]);
    filePreviewUrls[kind] = "";
  }
}

function updateAudioFilePreview(kind, file, source = "") {
  const preview = kind === "mp3" ? mp3FilePreview : wavFilePreview;
  const player = kind === "mp3" ? mp3FilePlayer : wavFilePlayer;
  const playButton = kind === "mp3" ? mp3FilePlay : wavFilePlay;
  const label = kind === "mp3" ? "MP3" : "WAV";

  if (!preview || !player || !playButton) return;

  preview.hidden = !source;
  preview.classList.remove("is-playing");
  preview.style.setProperty("--file-progress", "0%");
  playButton.textContent = String.fromCharCode(9654);
  playButton.setAttribute("aria-label", `Tocar ${label}`);
  playButton.setAttribute("aria-pressed", "false");

  if (source && player.getAttribute("src") !== source) {
    player.src = source;
    player.load();
  }

  if (!source) {
    player.removeAttribute("src");
  }
}

function updateStemsFilePreview(file, storedPath = "") {
  if (!stemsFilePreview || !stemsFileMeta) return;

  const fileName = file ? file.name : (storedPath ? storedPath.split("/").pop() : "");
  stemsFilePreview.hidden = !fileName;
  stemsFileMeta.textContent = file ? `Pasta de stems - ${formatFileSize(file.size)}` : "Pasta de stems salva";
}

function toggleFilePreviewPlayback(kind) {
  const player = kind === "mp3" ? mp3FilePlayer : wavFilePlayer;
  const playButton = kind === "mp3" ? mp3FilePlay : wavFilePlay;
  const otherPlayer = kind === "mp3" ? wavFilePlayer : mp3FilePlayer;
  const otherButton = kind === "mp3" ? wavFilePlay : mp3FilePlay;
  const label = kind === "mp3" ? "MP3" : "WAV";
  const otherLabel = kind === "mp3" ? "WAV" : "MP3";

  if (!player || !playButton || !player.src) return;

  if (otherPlayer && !otherPlayer.paused) {
    otherPlayer.pause();
    if (otherButton) {
      otherButton.textContent = String.fromCharCode(9654);
      otherButton.setAttribute("aria-label", `Tocar ${otherLabel}`);
      otherButton.setAttribute("aria-pressed", "false");
    }
    const otherPreview = kind === "mp3" ? wavFilePreview : mp3FilePreview;
    if (otherPreview) otherPreview.classList.remove("is-playing");
  }

  if (player.paused) {
    player.play().catch(() => {});
    playButton.textContent = String.fromCharCode(10074, 10074);
    playButton.setAttribute("aria-label", `Pausar ${label}`);
    playButton.setAttribute("aria-pressed", "true");
    const preview = kind === "mp3" ? mp3FilePreview : wavFilePreview;
    if (preview) preview.classList.add("is-playing");
    return;
  }

  player.pause();
  playButton.textContent = String.fromCharCode(9654);
  playButton.setAttribute("aria-label", `Tocar ${label}`);
  playButton.setAttribute("aria-pressed", "false");
  const preview = kind === "mp3" ? mp3FilePreview : wavFilePreview;
  if (preview) preview.classList.remove("is-playing");
}


function updateFilePreviewProgress(kind) {
  const player = kind === "mp3" ? mp3FilePlayer : wavFilePlayer;
  const preview = kind === "mp3" ? mp3FilePreview : wavFilePreview;

  if (!player || !preview || !player.duration) {
    if (preview) preview.style.setProperty("--file-progress", "0%");
    return;
  }

  const progress = Math.min(100, Math.max(0, (player.currentTime / player.duration) * 100));
  preview.style.setProperty("--file-progress", `${progress}%`);
}

function seekFilePreview(kind, event) {
  const player = kind === "mp3" ? mp3FilePlayer : wavFilePlayer;
  const wave = event.currentTarget;

  if (!player || !player.duration || !wave) return;

  const rect = wave.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  player.currentTime = player.duration * ratio;
  updateFilePreviewProgress(kind);
}

function updateFileField(input, storedPath = "") {
  const field = input.closest(".file-field");
  const labelText = field ? field.querySelector(".file-upload__text") : null;
  const file = input.files && input.files[0];
  const storedName = storedPath ? storedPath.split("/").pop() : "";

  if (!field || !labelText) {
    return;
  }

  field.classList.toggle("is-complete", Boolean(file || storedName));
  labelText.textContent = file ? file.name : storedName || labelText.dataset.default;

  if (input === mp3FileInput && !file) {
    updateAudioFilePreview("mp3", null, storedPath);
  }

  if (input === wavFileInput && !file) {
    updateAudioFilePreview("wav", null, storedPath);
  }

  if (input === stemsFileInput && !file) {
    updateStemsFilePreview(null, storedPath);
  }
}

function resetFileFields() {
  revokeFilePreviewUrl("mp3");
  revokeFilePreviewUrl("wav");
  updateAudioFilePreview("mp3", null, "");
  updateAudioFilePreview("wav", null, "");
  updateStemsFilePreview(null, "");

  [mp3FileInput, wavFileInput, stemsFileInput].forEach((input) => {
    updateFileField(input);
  });

  Object.values(licenseFileMap).forEach((config) => {
    if (config.toggle) config.toggle.checked = true;
  });
  updateAllLicenseToggles();
}

async function setPreviewAudioFile(file, targetInput) {
  const kind = targetInput === audioInput ? "mp3" : "wav";
  setMediaFile(file, targetInput, "assets/audio");

  if (!file) {
    revokeFilePreviewUrl(kind);
    updateAudioFilePreview(kind, null, "");
    renderPreview();
    return;
  }

  revokeFilePreviewUrl(kind);
  filePreviewUrls[kind] = URL.createObjectURL(file);
  updateAudioFilePreview(kind, file, filePreviewUrls[kind]);
  renderPreview();

  if (targetInput === audioInput) {
    isReadingAudio = true;

    try {
      audioInput.value = await readFileAsDataUrl(file);
    } catch (_error) {
      adminFeedback.textContent = "N\u00e3o foi poss\u00edvel preparar o preview completo do MP3. Voc\u00ea ainda pode tentar publicar.";
    } finally {
      isReadingAudio = false;
      renderPreview();
    }
  }
}

function createAdminBeatItem(beat) {
  const item = document.createElement("article");
  item.className = "beat-card admin-beat-item";

  const img = document.createElement("img");
  img.className = "beat-cover";
  img.src = beat.cover;
  img.alt = `Capa do beat ${beat.title}`;

  const info = document.createElement("div");
  info.className = "beat-info admin-beat-item__info";

  const title = document.createElement("h3");
  title.className = "beat-title";
  title.textContent = beat.title;

  const meta = document.createElement("p");
  meta.className = "beat-meta";
  meta.textContent = `${beat.bpm} BPM - ${beat.key}`;

  info.append(title, meta);

  const actions = document.createElement("div");
  actions.className = "admin-beat-item__actions";

  const openLink = document.createElement("a");
  openLink.className = "small-btn";
  openLink.href = `beat.html?${new URLSearchParams({ id: beat.id }).toString()}`;
  openLink.textContent = "Visualizar";

  const editButton = document.createElement("button");
  editButton.className = "small-btn small-btn--ghost";
  editButton.type = "button";
  editButton.textContent = "Editar";
  editButton.addEventListener("click", () => {
    editingBeatId = beat.id;
    titleInput.value = beat.title || "";
    bpmInput.value = beat.bpm || "";
    keyInput.value = beat.key || "";
    coverInput.value = beat.cover || "";
    audioInput.value = beat.audio || "";
    wavInput.value = beat.wav || "";
    stemsInput.value = beat.stems || "";
    const beatLicenses = Array.isArray(beat.availableLicenses) && beat.availableLicenses.length
      ? beat.availableLicenses
      : ["mp3", "wav", "stems"];
    Object.entries(licenseFileMap).forEach(([license, config]) => {
      if (config.toggle) config.toggle.checked = beatLicenses.includes(license);
    });
    updateAllLicenseToggles();
    updateFileField(mp3FileInput, audioInput.value);
    updateFileField(wavFileInput, wavInput.value);
    updateFileField(stemsFileInput, stemsInput.value);
    previewAudioUrl = "";
    setSelectedTags(beat.tags || (beat.typeBeat ? beat.typeBeat.split(",").map((tag) => tag.trim()) : []));
    previewFileUrl = "";
    renderPreview();
    adminFeedback.textContent = `Editando ${beat.title}.`;
    titleInput.focus();
  });

  const removeButton = document.createElement("button");
  removeButton.className = "small-btn small-btn--ghost";
  removeButton.type = "button";
  removeButton.textContent = "Excluir";
  removeButton.addEventListener("click", () => {
    window.JPGBeatStore.removeCustomBeat(beat.id);
    if (editingBeatId === beat.id) {
      editingBeatId = "";
      adminForm.reset();
      setSelectedTags([]);
      previewFileUrl = "";
      previewAudioUrl = "";
      resetFileFields();
      renderPreview();
    }
    renderAdminBeats();
  });

  actions.append(openLink, editButton, removeButton);
  item.append(img, info, actions);
  return item;
}

function renderAdminBeats() {
  const beats = window.JPGBeatStore ? window.JPGBeatStore.readCustomBeats() : [];
  adminList.innerHTML = "";

  if (!beats.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Nenhum beat cadastrado por aqui ainda.";
    adminList.appendChild(empty);
    return;
  }

  beats.forEach((beat) => adminList.appendChild(createAdminBeatItem(beat)));
}

adminForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(adminForm);
  if (isReadingCover) {
    adminFeedback.textContent = "Aguarde a capa terminar de carregar.";
    return;
  }

  if (isReadingAudio) {
    adminFeedback.textContent = "Aguarde o MP3 terminar de carregar.";
    return;
  }

  if (!currentPreviewCover()) {
    adminFeedback.textContent = "Selecione uma capa ou GIF antes de publicar.";
    coverDrop.focus();
    return;
  }

  const enabledLicenses = getEnabledLicenses();
  if (!enabledLicenses.length) {
    adminFeedback.textContent = "Ative pelo menos uma licen\u00e7a antes de publicar.";
    return;
  }

  const missingFiles = enabledLicenses
    .filter((license) => !licenseFileMap[license].input.value)
    .map((license) => licenseFileMap[license].label);

  if (missingFiles.length) {
    adminFeedback.textContent = `Envie os arquivos das licen\u00e7as ativas: ${missingFiles.join(", ")}.`;
    return;
  }

  setSubmitLoading(true);

  const beatData = {
    title: formData.get("title"),
    bpm: formData.get("bpm"),
    key: formData.get("key"),
    cover: formData.get("cover"),
    audio: formData.get("audio"),
    wav: formData.get("wav"),
    stems: formData.get("stems"),
    availableLicenses: enabledLicenses,
    tags: getSelectedTags()
  };

  window.setTimeout(() => {
    try {
      if (editingBeatId) {
        window.JPGBeatStore.removeCustomBeat(editingBeatId);
      }

      const beat = window.JPGBeatStore.saveCustomBeat({
        title: beatData.title,
        bpm: beatData.bpm,
        key: beatData.key,
        cover: beatData.cover,
        audio: beatData.audio,
        wav: beatData.wav,
        stems: beatData.stems,
        availableLicenses: beatData.availableLicenses,
        tags: beatData.tags
      });

      adminForm.reset();
      setSelectedTags([]);
      editingBeatId = "";
      previewFileUrl = "";
      previewAudioUrl = "";
      renderPreview();
      resetFileFields();
      adminFeedback.textContent = `${beat.title} publicado.`;
      renderAdminBeats();
    } catch (error) {
      const isStorageError = error && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
      adminFeedback.textContent = isStorageError
        ? "O arquivo ficou grande demais para salvar no navegador. Use um MP3 menor ou publique com backend/storage."
        : "N\u00e3o foi poss\u00edvel publicar agora. Tente novamente.";
    } finally {
      setSubmitLoading(false);
    }
  }, 360);
});

[titleInput, bpmInput, keyInput, coverInput].forEach((input) => {
  input.addEventListener("input", renderPreview);
});

tagInputs.forEach((input) => {
  input.addEventListener("change", updateTagLimits);
});

tagTabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTagGroup(tab));
});

Object.entries(licenseFileMap).forEach(([license, config]) => {
  if (config.toggle) {
    config.toggle.addEventListener("change", () => updateLicenseToggle(license));
  }
});

coverFileInput.addEventListener("change", () => {
  const file = coverFileInput.files && coverFileInput.files[0];
  setCoverFile(file);
});

mp3FileInput.addEventListener("change", () => {
  const file = mp3FileInput.files && mp3FileInput.files[0];
  updateFileField(mp3FileInput);
  setPreviewAudioFile(file, audioInput);
});

wavFileInput.addEventListener("change", () => {
  const file = wavFileInput.files && wavFileInput.files[0];
  updateFileField(wavFileInput);
  setPreviewAudioFile(file, wavInput);
});

stemsFileInput.addEventListener("change", () => {
  const file = stemsFileInput.files && stemsFileInput.files[0];
  updateFileField(stemsFileInput);
  setMediaFile(file, stemsInput, "assets/stems");
  updateStemsFilePreview(file);
});

if (mp3FilePlay) {
  mp3FilePlay.addEventListener("click", () => toggleFilePreviewPlayback("mp3"));
}

if (wavFilePlay) {
  wavFilePlay.addEventListener("click", () => toggleFilePreviewPlayback("wav"));
}

if (mp3FileWave) {
  mp3FileWave.addEventListener("click", (event) => seekFilePreview("mp3", event));
}

if (wavFileWave) {
  wavFileWave.addEventListener("click", (event) => seekFilePreview("wav", event));
}

if (mp3FilePlayer && mp3FilePlay) {
  mp3FilePlayer.addEventListener("timeupdate", () => updateFilePreviewProgress("mp3"));
  mp3FilePlayer.addEventListener("loadedmetadata", () => updateFilePreviewProgress("mp3"));
  mp3FilePlayer.addEventListener("ended", () => {
    mp3FilePlay.textContent = String.fromCharCode(9654);
    mp3FilePlay.setAttribute("aria-label", "Tocar MP3");
    mp3FilePlay.setAttribute("aria-pressed", "false");
    if (mp3FilePreview) mp3FilePreview.classList.remove("is-playing");
  });
}

if (wavFilePlayer && wavFilePlay) {
  wavFilePlayer.addEventListener("timeupdate", () => updateFilePreviewProgress("wav"));
  wavFilePlayer.addEventListener("loadedmetadata", () => updateFilePreviewProgress("wav"));
  wavFilePlayer.addEventListener("ended", () => {
    wavFilePlay.textContent = String.fromCharCode(9654);
    wavFilePlay.setAttribute("aria-label", "Tocar WAV");
    wavFilePlay.setAttribute("aria-pressed", "false");
    if (wavFilePreview) wavFilePreview.classList.remove("is-playing");
  });
}

coverDrop.addEventListener("click", () => coverFileInput.click());
coverDrop.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    coverFileInput.click();
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  coverDrop.addEventListener(eventName, (event) => {
    event.preventDefault();
    coverDrop.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  coverDrop.addEventListener(eventName, (event) => {
    event.preventDefault();
    coverDrop.classList.remove("is-dragging");
  });
});

coverDrop.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files && event.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    coverFileInput.files = event.dataTransfer.files;
    setCoverFile(file);
  }
});

renderAdminBeats();
updateAllLicenseToggles();
renderPreview();
updateTagLimits();
resetFileFields();
