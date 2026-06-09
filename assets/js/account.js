const ACCOUNT_AUTH_KEY = "jpg_is_logged_in";
const ACCOUNT_PROFILE_KEY = "jpg_user_profile";

if (localStorage.getItem(ACCOUNT_AUTH_KEY) !== "true") {
  window.location.href = "index.html";
}

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_PROFILE_KEY) || "{}");
  } catch (_error) {
    return {};
  }
}

function writeProfile(profile) {
  localStorage.setItem(ACCOUNT_PROFILE_KEY, JSON.stringify(profile));
}

function renderProfile() {
  const profile = readProfile();
  document.getElementById("infoNome").textContent = profile.nome || "-";
  document.getElementById("infoEmail").textContent = profile.email || "-";
  document.getElementById("infoCelular").textContent = profile.celular || "-";
  document.getElementById("infoCpf").textContent = profile.cpf || "-";
  document.getElementById("infoNascimento").textContent = profile.nascimento || "-";
  document.getElementById("novoEmail").value = profile.email || "";
}

document.getElementById("emailForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = readProfile();
  const nextEmail = document.getElementById("novoEmail").value.trim();
  if (!nextEmail) return;
  profile.email = nextEmail;
  writeProfile(profile);
  renderProfile();
  alert("Email atualizado.");
});

document.getElementById("passwordForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const novaSenha = document.getElementById("novaSenha").value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;

  if (novaSenha !== confirmarSenha) {
    alert("As senhas não conferem.");
    return;
  }

  const profile = readProfile();
  profile.senha = novaSenha;
  writeProfile(profile);
  document.getElementById("passwordForm").reset();
  alert("Senha atualizada.");
});

renderProfile();
