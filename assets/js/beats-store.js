const JPG_CUSTOM_BEATS_KEY = "jpg_custom_beats";

function normalizeBeatText(value) {
  return String(value || "").trim();
}

function normalizeBeatTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeBeatText).filter(Boolean);
}

function normalizeBeatLicenses(value) {
  const allowed = ["mp3", "wav", "stems", "exclusiva"];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeBeatText).filter((license) => allowed.includes(license));
}

function createBeatId(title) {
  const base = normalizeBeatText(title)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "beat"}-${Date.now().toString(36)}`;
}

function readCustomBeats() {
  try {
    const raw = localStorage.getItem(JPG_CUSTOM_BEATS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeCustomBeats(beats) {
  localStorage.setItem(JPG_CUSTOM_BEATS_KEY, JSON.stringify(beats));
}

function getDefaultBeats() {
  return Array.isArray(window.JPG_DEFAULT_BEATS) ? window.JPG_DEFAULT_BEATS : [];
}

function getAllBeats() {
  return [...readCustomBeats(), ...getDefaultBeats()];
}

function saveCustomBeat(data) {
  const beat = {
    id: createBeatId(data.title),
    title: normalizeBeatText(data.title),
    bpm: normalizeBeatText(data.bpm),
    key: normalizeBeatText(data.key),
    cover: normalizeBeatText(data.cover),
    audio: normalizeBeatText(data.audio),
    wav: normalizeBeatText(data.wav),
    stems: normalizeBeatText(data.stems),
    availableLicenses: normalizeBeatLicenses(data.availableLicenses),
    tags: normalizeBeatTags(data.tags),
    typeBeat: normalizeBeatText(data.typeBeat),
    createdAt: new Date().toISOString()
  };

  const beats = readCustomBeats();
  beats.unshift(beat);
  writeCustomBeats(beats);
  return beat;
}

function removeCustomBeat(id) {
  const nextBeats = readCustomBeats().filter((beat) => beat.id !== id);
  writeCustomBeats(nextBeats);
}

window.JPGBeatStore = {
  getAllBeats,
  readCustomBeats,
  saveCustomBeat,
  removeCustomBeat
};
