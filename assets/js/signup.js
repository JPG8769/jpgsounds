const AUTH_KEY = "jpg_is_logged_in";
const PROFILE_KEY = "jpg_user_profile";
const LICENSES_KEY = "jpg_licenses";

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(signupForm);
  const senha = String(formData.get("senha") || "");
  const confirmação = String(formData.get("confirmação") || "");

  if (senha !== confirmação) {
    alert("Senha e confirmação precisam ser iguais.");
    return;
  }

  const profile = {
    nome: String(formData.get("nome") || ""),
    email: String(formData.get("email") || ""),
    celular: String(formData.get("celular") || ""),
    cpf: String(formData.get("cpf") || ""),
    nascimento: String(formData.get("nascimento") || ""),
    senha
  };

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(AUTH_KEY, "true");

  if (!localStorage.getItem(LICENSES_KEY)) {
    localStorage.setItem(LICENSES_KEY, "[]");
  }

  window.location.href = "index.html";
});
