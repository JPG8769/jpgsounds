const CHECKOUT_KEY = "jpg_checkout_license";

const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartCount = document.getElementById("cartCount");
const checkoutDone = document.getElementById("checkoutDone");
const checkoutCustomerForm = document.getElementById("checkoutCustomerForm");
const checkoutAddressForm = document.getElementById("checkoutAddressForm");
const checkoutBackButton = document.getElementById("checkoutBackButton");
const checkoutNextButton = document.getElementById("checkoutNextButton");
const cardPaymentFields = document.getElementById("cardPaymentFields");
const alternativePaymentNote = document.getElementById("alternativePaymentNote");
const paymentInputs = document.querySelectorAll('input[name="payment"]');
const progressItems = document.querySelectorAll("[data-progress-step]");
const stepPanels = document.querySelectorAll("[data-checkout-step]");

let currentStep = 1;

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function readCheckoutItem() {
  try {
    const raw = localStorage.getItem(CHECKOUT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

function clearCheckoutItem() {
  localStorage.removeItem(CHECKOUT_KEY);
}

function itemPriceLabel(item) {
  if (item.priceLabel) return item.priceLabel;
  if (typeof item.price === "number") return formatBRL(item.price);
  return "A negociar";
}

function currentItems() {
  const item = readCheckoutItem();
  return item ? [item] : [];
}

function renderCheckoutSummary() {
  const item = readCheckoutItem();
  const total = item && typeof item.price === "number" ? item.price : 0;

  if (cartCount) cartCount.textContent = item ? "1" : "0";
  if (cartSubtotal) cartSubtotal.textContent = formatBRL(total);
  if (cartTotal) cartTotal.textContent = formatBRL(total);
  if (checkoutNextButton) checkoutNextButton.disabled = !item;

  if (!cartList) return;

  if (!item) {
    cartList.innerHTML = '<div class="checkout-empty">Nenhuma licen&ccedil;a selecionada.</div>';
    return;
  }

  cartList.innerHTML = `
    <article class="checkout-item">
      <img src="${item.cover || "assets/img/xxx.jpg"}" alt="Capa do beat ${item.beatTitle || "Beat"}" />
      <div>
        <h3>${item.beatTitle || "Beat"}</h3>
        <p><span>Licen&ccedil;a</span>${item.licenseLabel || "-"}</p>
        <p><span>BPM/Tom</span>${item.bpm || "-"} - ${item.key || "-"}</p>
      </div>
      <strong class="checkout-item-price">${itemPriceLabel(item)}</strong>
    </article>
  `;
}

function showStep(step) {
  currentStep = step;

  stepPanels.forEach((panel) => {
    const isActive = Number(panel.dataset.checkoutStep) === currentStep;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  progressItems.forEach((item) => {
    const itemStep = Number(item.dataset.progressStep);
    item.classList.toggle("is-active", itemStep === currentStep);
    item.classList.toggle("is-complete", itemStep < currentStep);
  });

  if (checkoutBackButton) {
    checkoutBackButton.hidden = currentStep === 1;
  }
  if (checkoutNextButton) {
    checkoutNextButton.textContent = currentStep === 3 ? "Finalizar compra" : "Continuar";
  }
}

function selectedPaymentMethod() {
  const selected = document.querySelector('input[name="payment"]:checked');
  return selected ? selected.value : "card";
}

function syncPaymentFields() {
  const isCard = selectedPaymentMethod() === "card";

  if (cardPaymentFields) cardPaymentFields.hidden = !isCard;
  if (alternativePaymentNote) alternativePaymentNote.hidden = isCard;
}

function validateFields(container) {
  if (!container) return true;
  const fields = Array.from(container.querySelectorAll("input"));
  const invalid = fields.find((field) => !field.reportValidity());
  return !invalid;
}

function validateCurrentStep() {
  if (currentStep === 1) return validateFields(checkoutCustomerForm);
  if (currentStep === 2) return validateFields(checkoutAddressForm);
  return true;
}

function fieldsToData(container) {
  const data = {};
  if (!container) return data;

  container.querySelectorAll("input").forEach((field) => {
    data[field.name] = String(field.value || "").trim();
  });
  return data;
}

function collectCustomer() {
  const identity = fieldsToData(checkoutCustomerForm);
  const address = fieldsToData(checkoutAddressForm);
  const addressParts = [
    address.street,
    address.number,
    address.complement,
    address.city,
    address.state,
    address.zip
  ].filter(Boolean);

  return {
    name: `${identity.firstName || ""} ${identity.lastName || ""}`.trim(),
    document: identity.document || "",
    phone: identity.phone || "",
    email: identity.email || "",
    address: addressParts.join(", ")
  };
}

function finishCheckout() {
  const items = currentItems();
  if (!items.length) {
    if (checkoutDone) checkoutDone.innerHTML = "Selecione uma licen&ccedil;a antes de continuar.";
    return;
  }

  const order = window.JPGContracts.createOrder(collectCustomer(), items);
  const contractUrl = window.JPGContracts.createTextDownload(order.contractText, order.contractFileName);
  const methodLabel = {
    card: "Cart&atilde;o",
    pix: "Pix",
    paypal: "PayPal"
  }[selectedPaymentMethod()] || "pagamento";

  if (checkoutDone) {
    checkoutDone.innerHTML = `
      <p>Pedido ${order.id} registrado via ${methodLabel}. O contrato foi preenchido automaticamente.</p>
      <a class="small-btn" href="${contractUrl}" download="${order.contractFileName}">Baixar contrato</a>
    `;
  }

  clearCheckoutItem();
  renderCheckoutSummary();
}

if (checkoutBackButton) {
  checkoutBackButton.addEventListener("click", () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });
}

if (checkoutNextButton) {
  checkoutNextButton.addEventListener("click", () => {
    if (!validateCurrentStep()) return;

    if (currentStep < 3) {
      showStep(currentStep + 1);
      return;
    }

    finishCheckout();
  });
}

paymentInputs.forEach((input) => {
  input.addEventListener("change", syncPaymentFields);
});

renderCheckoutSummary();
syncPaymentFields();
showStep(1);
