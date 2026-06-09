const THEME_KEY = "jpg_theme";

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("theme-dark", isDark);
  return isDark;
}

function nextTheme(current) {
  return current === "dark" ? "light" : "dark";
}

const initialTheme = localStorage.getItem(THEME_KEY) || "light";
const initialIsDark = applyTheme(initialTheme);

const themeToggle = document.createElement("button");
themeToggle.type = "button";
themeToggle.className = "icon-btn theme-toggle-nav";
themeToggle.setAttribute("aria-label", "Ativar ou desativar modo escuro");
themeToggle.setAttribute("title", "Modo escuro");
themeToggle.setAttribute("aria-pressed", initialIsDark ? "true" : "false");
themeToggle.innerHTML = `
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z"></path>
  </svg>
`;

themeToggle.addEventListener("click", () => {
  const current = localStorage.getItem(THEME_KEY) || "light";
  const updated = nextTheme(current);
  localStorage.setItem(THEME_KEY, updated);
  const isDark = applyTheme(updated);
  themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
});

const actionsContainer = document.querySelector(".actions");

if (actionsContainer) {
  actionsContainer.appendChild(themeToggle);
} else {
  themeToggle.classList.add("theme-toggle-floating");
  document.body.appendChild(themeToggle);
}
