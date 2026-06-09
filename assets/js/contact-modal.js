const CONTACT_EMAIL = "jpgsounds@gmail.com";

const modalRoot = document.createElement("div");
modalRoot.className = "contact-modal";
modalRoot.setAttribute("aria-hidden", "true");
modalRoot.innerHTML = `
  <div class="contact-modal__overlay" data-contact-close></div>
  <section class="contact-modal__card" role="dialog" aria-modal="true" aria-labelledby="contactModalTitle">
    <h2 id="contactModalTitle">Contato</h2>
    <p>
      Para duvidas, propostas e suporte, entre em contato por email:
      <strong>${CONTACT_EMAIL}</strong>
    </p>
    <button type="button" class="contact-modal__btn contact-modal__btn--primary" id="copyContactEmail">
      Copiar email
    </button>
    <button type="button" class="contact-modal__btn" data-contact-close>
      Fechar
    </button>
  </section>
`;

document.body.appendChild(modalRoot);

const copyButton = document.getElementById("copyContactEmail");
const closeTargets = modalRoot.querySelectorAll("[data-contact-close]");

function setModalOpen(isOpen) {
  modalRoot.classList.toggle("is-open", isOpen);
  modalRoot.setAttribute("aria-hidden", isOpen ? "false" : "true");
}

document.querySelectorAll('a[href="contact.html"], [data-contact-trigger]').forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    setModalOpen(true);
  });
});

if (/\/contact\.html$/i.test(window.location.pathname)) {
  setModalOpen(true);
}

closeTargets.forEach((target) => {
  target.addEventListener("click", () => setModalOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setModalOpen(false);
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(CONTACT_EMAIL);
    copyButton.textContent = "Email copiado";
  } catch (_error) {
    const fallback = document.createElement("textarea");
    fallback.value = CONTACT_EMAIL;
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
    copyButton.textContent = "Email copiado";
  }

  setTimeout(() => {
    copyButton.textContent = "Copiar email";
  }, 1200);
});
