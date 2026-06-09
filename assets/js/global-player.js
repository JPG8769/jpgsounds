(function () {
  const TRACK_KEY = "jpg_player_track";
  const STATE_KEY = "jpg_player_state";
  const QUEUE_KEY = "jpg_player_queue";
  const INDEX_KEY = "jpg_player_queue_index";
  const MODE_KEY = "jpg_player_mode";
  const SESSION_VISIBLE_KEY = "jpg_player_visible_session";

  let track = null;
  let state = { time: 0, playing: false, volume: 1 };
  let queue = [];
  let queueIndex = -1;
  let mode = { shuffle: false, repeat: false };
  let isVisible = false;
  let sessionVisible = sessionStorage.getItem(SESSION_VISIBLE_KEY) === "true";

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  track = readJson(TRACK_KEY, null);
  state = { ...state, ...readJson(STATE_KEY, {}) };
  queue = readJson(QUEUE_KEY, []);
  queueIndex = Number(localStorage.getItem(INDEX_KEY));
  mode = { ...mode, ...readJson(MODE_KEY, {}) };

  if (!Array.isArray(queue)) queue = [];
  if (!Number.isFinite(queueIndex)) queueIndex = queue.length ? 0 : -1;

  const root = document.createElement("div");
  root.className = "global-player";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <img class="global-player__cover" src="" alt="" />
    <div class="global-player__meta">
      <p class="global-player__title">Nenhum beat selecionado</p>
      <p class="global-player__artist">Clique em um beat para ouvir</p>
    </div>

    <div class="global-player__controls" role="group" aria-label="Controles do player">
      <button type="button" class="global-player__btn" data-action="shuffle" aria-label="Aleat&oacute;rio" title="Aleat&oacute;rio">s</button>
      <button type="button" class="global-player__btn" data-action="prev" aria-label="Anterior">&lsaquo;</button>
      <button type="button" class="global-player__btn global-player__btn--primary" data-action="toggle" aria-label="Play/Pause">&#9654;</button>
      <button type="button" class="global-player__btn" data-action="next" aria-label="Pr&oacute;xima">&rsaquo;</button>
      <button type="button" class="global-player__btn" data-action="repeat" aria-label="Repetir" title="Repetir">r</button>
    </div>

    <input class="global-player__seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Progresso" />
    <div class="global-player__side">
      <span class="global-player__time">0:00</span>
      <span class="global-player__divider">/</span>
      <span class="global-player__duration">0:00</span>
      <input class="global-player__volume" type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume" />
    </div>
    <button type="button" class="global-player__close" data-action="close" aria-label="Fechar player">&times;</button>
    <audio class="global-player__audio" preload="metadata"></audio>
  `;

  document.body.appendChild(root);

  const cover = root.querySelector(".global-player__cover");
  const title = root.querySelector(".global-player__title");
  const artist = root.querySelector(".global-player__artist");
  const controls = root.querySelector(".global-player__controls");
  const toggle = root.querySelector('[data-action="toggle"]');
  const closeButton = root.querySelector('[data-action="close"]');
  const shuffleBtn = root.querySelector('[data-action="shuffle"]');
  const repeatBtn = root.querySelector('[data-action="repeat"]');
  const seek = root.querySelector(".global-player__seek");
  const time = root.querySelector(".global-player__time");
  const durationLabel = root.querySelector(".global-player__duration");
  const volume = root.querySelector(".global-player__volume");
  const audio = root.querySelector(".global-player__audio");

  audio.volume = typeof state.volume === "number" ? state.volume : 1;
  volume.value = String(audio.volume);

  function updateVisibility() {
    const shouldShow = Boolean(track && track.audio && sessionVisible);
    if (shouldShow === isVisible) {
      return;
    }

    isVisible = shouldShow;
    root.classList.toggle("is-visible", shouldShow);
    root.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    document.body.classList.toggle("has-global-player", shouldShow);
  }

  function persistState() {
    state = {
      time: audio.currentTime || 0,
      playing: !audio.paused,
      volume: audio.volume
    };
    writeJson(STATE_KEY, state);
    writeJson(QUEUE_KEY, queue);
    localStorage.setItem(INDEX_KEY, String(queueIndex));
    writeJson(MODE_KEY, mode);
  }

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function syncUi() {
    if (!track) {
      cover.style.visibility = "hidden";
      title.textContent = "Nenhum beat selecionado";
      artist.textContent = "Clique em um beat para ouvir";
      toggle.textContent = String.fromCharCode(9654);
      seek.value = "0";
      time.textContent = "0:00";
      durationLabel.textContent = "0:00";
      shuffleBtn.classList.toggle("is-active", Boolean(mode.shuffle));
      repeatBtn.classList.toggle("is-active", Boolean(mode.repeat));
      updateVisibility();
      return;
    }

    cover.style.visibility = "visible";
    cover.src = track.cover || "";
    cover.alt = track.title || "Beat";
    title.textContent = track.title || "Beat";
    artist.textContent = track.artist || "";
    toggle.textContent = audio.paused ? String.fromCharCode(9654) : String.fromCharCode(10074, 10074);
    shuffleBtn.classList.toggle("is-active", Boolean(mode.shuffle));
    repeatBtn.classList.toggle("is-active", Boolean(mode.repeat));

    const duration = audio.duration || 0;
    const current = audio.currentTime || 0;
    if (duration > 0) {
      seek.value = String((current / duration) * 100);
    }
    time.textContent = formatTime(current);
    durationLabel.textContent = formatTime(duration);
    updateVisibility();
  }

  function findQueueIndex(nextTrack) {
    return queue.findIndex((item) => item && item.audio === nextTrack.audio && item.title === nextTrack.title);
  }

  function loadTrack(nextTrack, autoPlay, resetTime) {
    if (!nextTrack || !nextTrack.audio) return;
    track = nextTrack;
    writeJson(TRACK_KEY, track);

    const nextSrc = new URL(track.audio, window.location.href).href;
    const sourceChanged = audio.src !== nextSrc;

    if (resetTime) {
      state.time = 0;
      seek.value = "0";
      time.textContent = "0:00";
      try {
        audio.currentTime = 0;
      } catch (_error) {}
    }

    if (sourceChanged) {
      audio.src = track.audio;
      audio.load();
    } else if (resetTime) {
      try {
        audio.currentTime = 0;
      } catch (_error) {}
    }

    const desiredTime = resetTime ? 0 : (typeof state.time === "number" ? state.time : 0);
    const onLoaded = () => {
      if (Number.isFinite(desiredTime) && desiredTime < (audio.duration || Number.MAX_SAFE_INTEGER)) {
        try {
          audio.currentTime = Math.max(0, desiredTime);
        } catch (_error) {}
      }
      if (autoPlay || track.autoplay || state.playing) {
        audio.play().catch(() => {});
      }
      syncUi();
    };

    if (audio.readyState >= 1) {
      onLoaded();
    } else {
      audio.addEventListener("loadedmetadata", onLoaded, { once: true });
    }

    syncUi();
    persistState();
  }

  function randomQueueIndex() {
    if (queue.length <= 1) return queueIndex;
    let next = queueIndex;
    while (next === queueIndex) {
      next = Math.floor(Math.random() * queue.length);
    }
    return next;
  }

  function goPrev() {
    if (!queue.length || queueIndex < 0) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      syncUi();
      persistState();
      return;
    }

    if (mode.shuffle) {
      queueIndex = randomQueueIndex();
    } else if (queueIndex > 0) {
      queueIndex -= 1;
    } else if (mode.repeat) {
      queueIndex = queue.length - 1;
    } else {
      queueIndex = 0;
    }

    state.time = 0;
    state.playing = true;
    loadTrack(queue[queueIndex], true, true);
  }

  function goNext(forceWrap) {
    if (!queue.length || queueIndex < 0) return;

    if (mode.shuffle) {
      queueIndex = randomQueueIndex();
    } else if (queueIndex < queue.length - 1) {
      queueIndex += 1;
    } else if (mode.repeat || forceWrap) {
      queueIndex = 0;
    } else {
      audio.pause();
      audio.currentTime = 0;
      syncUi();
      persistState();
      return;
    }

    state.time = 0;
    state.playing = true;
    loadTrack(queue[queueIndex], true, true);
  }

  function acceptIncomingTrack(nextTrack, autoPlay) {
    if (!nextTrack || !nextTrack.audio) return;
    sessionVisible = true;
    sessionStorage.setItem(SESSION_VISIBLE_KEY, "true");

    let existingIndex = findQueueIndex(nextTrack);
    if (existingIndex === -1) {
      queue.push({ ...nextTrack, autoplay: false });
      existingIndex = queue.length - 1;
    }

    queueIndex = existingIndex;
    state.time = 0;
    state.playing = Boolean(autoPlay || nextTrack.autoplay);
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch (_error) {}
    seek.value = "0";
    time.textContent = "0:00";
    loadTrack(queue[queueIndex], Boolean(autoPlay || nextTrack.autoplay), true);
  }

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.getAttribute("data-action");
    if (action === "toggle") {
      if (!track) return;
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      return;
    }

    if (action === "shuffle") {
      mode.shuffle = !mode.shuffle;
      syncUi();
      persistState();
      return;
    }

    if (action === "repeat") {
      mode.repeat = !mode.repeat;
      syncUi();
      persistState();
      return;
    }

    if (action === "prev") {
      goPrev();
      return;
    }

    if (action === "next") {
      goNext(true);
      return;
    }

    if (action === "close") {
      audio.pause();
      sessionVisible = false;
      sessionStorage.setItem(SESSION_VISIBLE_KEY, "false");
      state.playing = false;
      syncUi();
      persistState();
    }
  });

  closeButton.addEventListener("click", () => {
    audio.pause();
    sessionVisible = false;
    sessionStorage.setItem(SESSION_VISIBLE_KEY, "false");
    state.playing = false;
    syncUi();
    persistState();
  });

  seek.addEventListener("input", () => {
    if (!audio.duration) return;
    const ratio = Number(seek.value) / 100;
    audio.currentTime = audio.duration * ratio;
    syncUi();
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    persistState();
  });

  audio.addEventListener("play", () => {
    syncUi();
    persistState();
  });

  audio.addEventListener("pause", () => {
    syncUi();
    persistState();
  });

  audio.addEventListener("timeupdate", () => {
    syncUi();
    persistState();
  });

  audio.addEventListener("loadedmetadata", () => {
    syncUi();
    persistState();
  });

  audio.addEventListener("ended", () => {
    goNext(mode.repeat);
  });

  window.addEventListener("jpg:player-track", (event) => {
    const next = event.detail;
    if (!next) return;
    acceptIncomingTrack(next, Boolean(next.autoplay));
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== TRACK_KEY || !event.newValue) return;
    try {
      const next = JSON.parse(event.newValue);
      if (!next) return;
      state = { ...state, ...readJson(STATE_KEY, {}) };
      queue = readJson(QUEUE_KEY, queue);
      queueIndex = Number(localStorage.getItem(INDEX_KEY));
      mode = { ...mode, ...readJson(MODE_KEY, mode) };
      if (!Number.isFinite(queueIndex)) queueIndex = queue.length ? 0 : -1;
      acceptIncomingTrack(next, Boolean(next.autoplay));
    } catch (_error) {}
  });

  window.addEventListener("beforeunload", persistState);

  if (track && track.audio) {
    if (!queue.length) {
      queue = [track];
      queueIndex = 0;
    } else {
      const idx = findQueueIndex(track);
      queueIndex = idx >= 0 ? idx : queueIndex;
      if (idx === -1) {
        queue.push(track);
        queueIndex = queue.length - 1;
      }
    }
    loadTrack(track, Boolean(track.autoplay || state.playing), false);
  } else {
    syncUi();
  }
})();
