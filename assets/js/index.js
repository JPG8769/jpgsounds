const actions = document.querySelector(".actions");
const userMenuButton = document.getElementById("userMenuButton");
const userDropdown = document.getElementById("userDropdown");
const searchButton = document.getElementById("searchButton");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const homeLatestSection = document.querySelector(".home-latest");
const homeLatestGrid = document.querySelector(".home-latest__grid");

function renderUserMenu() {
  if (!userDropdown) return;

  userDropdown.innerHTML = `
    <a class="dropdown-link" href="admin.html">Admin beats</a>
  `;
}

function createHomeBeatUrl(beat) {
  return `beat.html?${new URLSearchParams({ id: beat.id }).toString()}`;
}

function playHomeBeat(beat) {
  if (!beat || !beat.audio) return;

  const track = {
    title: beat.title,
    artist: `${beat.bpm} BPM - ${beat.key}`,
    cover: beat.cover,
    audio: beat.audio,
    autoplay: true,
    updatedAt: Date.now()
  };

  localStorage.setItem("jpg_player_track", JSON.stringify(track));
  window.dispatchEvent(new CustomEvent("jpg:player-track", { detail: track }));
}

function createHomeDownloadName(beat) {
  const title = String(beat.title || "beat")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${title || "beat"}-preview.mp3`;
}

function downloadHomeBeatAudio(beat) {
  if (!beat.audio) {
    window.alert("Este beat ainda n\u00e3o possui MP3 dispon\u00edvel para download.");
    return;
  }

  const startDownload = () => {
    const link = document.createElement("a");
    link.href = beat.audio;
    link.download = createHomeDownloadName(beat);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (window.JPGDownloadWarning) {
    window.JPGDownloadWarning.open({
      beat,
      licenseUrl: createHomeBeatUrl(beat),
      onConfirm: startDownload
    });
    return;
  }

  startDownload();
}

function renderHomeLatestBeats() {
  const beats = window.JPGBeatStore ? window.JPGBeatStore.getAllBeats() : [];
  if (!homeLatestGrid || !beats.length) return;

  homeLatestSection?.classList.remove("is-ready", "has-entered");
  homeLatestGrid.innerHTML = "";
  beats.slice(0, 3).forEach((beat, index) => {
    const link = document.createElement("a");
    link.className = "beat-card home-beat-card";
    link.href = "#";
    link.setAttribute("role", "button");
    link.setAttribute("aria-label", `Ouvir beat ${beat.title}`);
    link.style.setProperty("--home-delay", `${130 + index * 90}ms`);

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
      downloadHomeBeatAudio(beat);
    });

    actions.appendChild(downloadButton);
    details.append(title, meta);
    info.append(details, actions);
    link.append(cover, info);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      homeLatestGrid.querySelectorAll(".home-beat-card.is-playing").forEach((card) => {
        card.classList.remove("is-playing");
      });
      link.classList.add("is-playing");
      playHomeBeat(beat);
    });
    link.addEventListener("keydown", (event) => {
      if (event.target.closest("button")) return;
      if (event.key !== " ") return;
      event.preventDefault();
      link.click();
    });
    homeLatestGrid.appendChild(link);
  });

  if (homeLatestSection) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        homeLatestSection.classList.add("is-ready");
        window.setTimeout(() => {
          homeLatestSection.classList.add("has-entered");
        }, 780);
      });
    });
  }
}

renderUserMenu();
renderHomeLatestBeats();

if (userMenuButton && userDropdown && actions) {
  userMenuButton.addEventListener("click", () => {
    if (actions.classList.contains("search-active")) {
      actions.classList.remove("search-active");
    }
    const isOpen = userDropdown.classList.toggle("is-open");
    userMenuButton.setAttribute("aria-expanded", isOpen);
  });
}

if (searchButton && searchInput && actions && userDropdown && userMenuButton) {
  searchButton.addEventListener("click", () => {
    userDropdown.classList.remove("is-open");
    userMenuButton.setAttribute("aria-expanded", "false");
    actions.classList.add("search-active");
    setTimeout(() => searchInput.focus(), 180);
  });
}

document.addEventListener("click", (event) => {
  const clickedSearchArea = event.target.closest(".actions");
  if (actions && !clickedSearchArea && actions.classList.contains("search-active")) {
    actions.classList.remove("search-active");
  }

  const clickedInsideMenu = event.target.closest(".user-menu");
  if (userDropdown && userMenuButton && !clickedInsideMenu) {
    userDropdown.classList.remove("is-open");
    userMenuButton.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (actions && event.key === "Escape" && actions.classList.contains("search-active")) {
    actions.classList.remove("search-active");
  }
});

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchInput ? searchInput.value.trim() : "";
    if (query) {
      window.location.href = `beats.html?${new URLSearchParams({ q: query }).toString()}`;
    }
  });
}
