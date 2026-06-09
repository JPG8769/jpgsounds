(function () {
  const CART_KEY = "jpg_cart_items";

  const formatBRL = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (typeof window.renderCart === "function") {
      window.renderCart();
    }
  }

  function priceLabel(item) {
    if (item.priceLabel) return item.priceLabel;
    if (typeof item.price === "number") return formatBRL(item.price);
    return "A negociar";
  }

  function totalValue(items) {
    return items.reduce((sum, item) => sum + (typeof item.price === "number" ? item.price : 0), 0);
  }

  function buildModal() {
    const modal = document.createElement("div");
    modal.className = "cart-modal";
    modal.id = "cartModal";
    modal.innerHTML = `
      <div class="cart-modal__overlay" data-cart-close></div>
      <section class="cart-modal__panel" role="dialog" aria-modal="true" aria-labelledby="cartModalTitle">
        <button class="cart-modal__close" type="button" aria-label="Fechar carrinho" data-cart-close>&times;</button>
        <div class="cart-modal__content" id="cartModalContent"></div>
      </section>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  const modal = buildModal();
  const content = document.getElementById("cartModalContent");
  let checkoutStep = 0;
  let checkoutData = {};

  function renderCartView() {
    checkoutStep = 0;
    const items = readCart();
    const total = totalValue(items);

    content.innerHTML = `
      <div class="cart-modal__head">
        <h2 id="cartModalTitle">Carrinho</h2>
        <span>${items.length} ${items.length === 1 ? "beat" : "beats"}</span>
      </div>

      <div class="cart-modal__items">
        ${
          items.length
            ? items
                .map(
                  (item) => `
                    <article class="cart-modal__item">
                      <img src="${item.cover || "assets/img/xxx.jpg"}" alt="Capa do beat ${item.beatTitle || "Beat"}" />
                      <div>
                        <h3>${item.beatTitle || "Beat"}</h3>
                        <p>${item.licenseLabel || "Licença"} - ${item.bpm || "-"} BPM - ${item.key || "-"}</p>
                        <button type="button" data-cart-remove="${item.id}">Remover</button>
                      </div>
                      <strong>${priceLabel(item)}</strong>
                    </article>
                  `
                )
                .join("")
            : '<p class="cart-modal__empty">Seu carrinho está vazio.</p>'
        }
      </div>

      <div class="cart-modal__summary">
        <span>Total</span>
        <strong>${formatBRL(total)}</strong>
      </div>

      <button class="cart-modal__primary" type="button" data-cart-checkout ${items.length ? "" : "disabled"}>
        Ir para pagamento
      </button>
    `;
  }

  function stepTitle() {
    if (checkoutStep === 1) return "Dados para contrato";
    if (checkoutStep === 2) return "Endereço";
    return "Pagamento";
  }

  function renderCheckoutView() {
    const items = readCart();
    const total = totalValue(items);

    content.innerHTML = `
      <div class="cart-modal__head">
        <h2 id="cartModalTitle">${stepTitle()}</h2>
        <span>Etapa ${checkoutStep} de 3</span>
      </div>

      <div class="cart-modal__steps" aria-label="Etapas do pagamento">
        <span class="${checkoutStep === 1 ? "is-active" : ""}"></span>
        <span class="${checkoutStep === 2 ? "is-active" : ""}"></span>
        <span class="${checkoutStep === 3 ? "is-active" : ""}"></span>
      </div>

      <form class="cart-modal__form" id="cartModalCheckoutForm">
        ${checkoutStep === 1 ? personalFields() : ""}
        ${checkoutStep === 2 ? billingFields() : ""}
        ${checkoutStep === 3 ? paymentFields(total) : ""}
      </form>

      <div class="cart-modal__footer">
        <button class="cart-modal__secondary" type="button" data-cart-back>
          ${checkoutStep === 1 ? "Voltar ao carrinho" : "Voltar"}
        </button>
        <button class="cart-modal__primary" type="button" data-cart-next>
          ${checkoutStep === 3 ? "Pagar e finalizar" : "Continuar"}
        </button>
      </div>
    `;
  }

  function personalFields() {
    return `
      <label>Nome completo
        <input name="name" type="text" autocomplete="name" placeholder="Seu nome completo" value="${checkoutData.name || ""}" required />
      </label>
      <label>CPF/CNPJ
        <input name="document" type="text" inputmode="numeric" placeholder="000.000.000-00" value="${checkoutData.document || ""}" required />
      </label>
      <label>Email para entrega
        <input name="email" type="email" autocomplete="email" placeholder="seu@email.com" value="${checkoutData.email || ""}" required />
      </label>
      <label>Telefone
        <input name="phone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000" value="${checkoutData.phone || ""}" required />
      </label>
    `;
  }

  function billingFields() {
    return `
      <label>Endereço completo
        <input name="address" type="text" autocomplete="street-address" placeholder="Rua, número, bairro, cidade/UF" value="${checkoutData.address || ""}" required />
      </label>
    `;
  }

  function paymentFields(total) {
    return `
      <div class="cart-modal__payment-total">
        <span>Total</span>
        <strong>${formatBRL(total)}</strong>
      </div>
      <label>Forma de pagamento
        <select name="paymentMethod">
          <option value="card">Cartão de crédito</option>
          <option value="pix">Pix</option>
          <option value="paypal">PayPal</option>
        </select>
      </label>
      <label>Nome no cartão
        <input name="cardName" type="text" autocomplete="cc-name" placeholder="Nome impresso no cartão" />
      </label>
      <label>Número do cartão
        <input name="cardNumber" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" />
      </label>
      <div class="cart-modal__split">
        <label>Validade
          <input name="cardExpiry" type="text" autocomplete="cc-exp" placeholder="MM/AA" />
        </label>
        <label>CVV
          <input name="cardCvv" type="text" inputmode="numeric" autocomplete="cc-csc" placeholder="000" />
        </label>
      </div>
    `;
  }

  function collectStepData() {
    const form = document.getElementById("cartModalCheckoutForm");
    if (!form) return true;
    if (!form.reportValidity()) return false;

    const formData = new FormData(form);
    formData.forEach((value, key) => {
      checkoutData[key] = String(value || "").trim();
    });
    return true;
  }

  function renderDoneView() {
    const items = readCart();
    const order = window.JPGContracts.createOrder(checkoutData, items);
    const contractUrl = window.JPGContracts.createTextDownload(order.contractText, order.contractFileName);

    content.innerHTML = `
      <div class="cart-modal__done">
        <h2 id="cartModalTitle">Pagamento recebido</h2>
        <p>Pedido ${order.id} registrado. O contrato foi preenchido com os dados informados.</p>
        <a class="cart-modal__primary" href="${contractUrl}" download="${order.contractFileName}">Baixar contrato</a>
        <button class="cart-modal__secondary" type="button" data-cart-close>Fechar</button>
      </div>
    `;

    writeCart([]);
  }

  function openModal() {
    renderCartView();
    modal.classList.add("is-open");
    document.body.classList.add("has-cart-modal");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.body.classList.remove("has-cart-modal");
  }

  document.addEventListener("click", (event) => {
    const cartLink = event.target.closest('a[href="cart.html"]');
    if (cartLink) {
      event.preventDefault();
      openModal();
      return;
    }

    if (event.target.closest("[data-cart-close]")) {
      closeModal();
      return;
    }

    const removeButton = event.target.closest("[data-cart-remove]");
    if (removeButton) {
      const id = removeButton.getAttribute("data-cart-remove");
      writeCart(readCart().filter((item) => item.id !== id));
      renderCartView();
      return;
    }

    if (event.target.closest("[data-cart-checkout]")) {
      checkoutData = {};
      checkoutStep = 1;
      renderCheckoutView();
      return;
    }

    if (event.target.closest("[data-cart-back]")) {
      collectStepData();
      if (checkoutStep <= 1) {
        renderCartView();
      } else {
        checkoutStep -= 1;
        renderCheckoutView();
      }
      return;
    }

    if (event.target.closest("[data-cart-next]")) {
      if (!collectStepData()) return;

      if (checkoutStep < 3) {
        checkoutStep += 1;
        renderCheckoutView();
      } else {
        renderDoneView();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
})();
