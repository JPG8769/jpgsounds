(function () {
  const CART_KEY = "jpg_cart_items";

  function formatBRL(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  }

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
  }

  function itemPriceLabel(item) {
    if (item.priceLabel) return item.priceLabel;
    if (typeof item.price === "number") return formatBRL(item.price);
    return "A negociar";
  }

  function cartTotal(items) {
    return items.reduce((sum, item) => sum + (typeof item.price === "number" ? item.price : 0), 0);
  }

  function buildDrawer() {
    const drawer = document.createElement("div");
    drawer.className = "cart-drawer";
    drawer.id = "cartDrawer";
    drawer.innerHTML = `
      <div class="cart-drawer__overlay" data-cart-drawer-close></div>
      <aside class="cart-drawer__panel" aria-label="Resumo do carrinho" aria-hidden="true">
        <div class="cart-drawer__head">
          <h2 id="cartDrawerTitle">Resumo</h2>
          <button class="cart-drawer__close" type="button" aria-label="Fechar carrinho" data-cart-drawer-close>&times;</button>
        </div>
        <div class="cart-drawer__content" id="cartDrawerContent"></div>
      </aside>
    `;
    document.body.appendChild(drawer);
    return drawer;
  }

  const drawer = buildDrawer();
  const panel = drawer.querySelector(".cart-drawer__panel");
  const content = document.getElementById("cartDrawerContent");
  const title = document.getElementById("cartDrawerTitle");

  function renderDrawer() {
    const items = readCart();
    const total = cartTotal(items);

    title.textContent = `Resumo (${items.length})`;

    content.innerHTML = `
      <div class="cart-drawer__items">
        ${
          items.length
            ? items
                .map(
                  (item) => `
                    <article class="cart-drawer__item">
                      <img src="${item.cover || "assets/img/xxx.jpg"}" alt="Capa do beat ${item.beatTitle || "Beat"}" />
                      <div>
                        <h3>${item.beatTitle || "Beat"}</h3>
                        <p>${item.licenseLabel || "Licença"} - ${item.bpm || "-"} BPM - ${item.key || "-"}</p>
                        <button type="button" data-cart-drawer-remove="${item.id}">Remover</button>
                      </div>
                      <strong>${itemPriceLabel(item)}</strong>
                    </article>
                  `
                )
                .join("")
            : '<div class="cart-drawer__empty">Seu carrinho está vazio.</div>'
        }
      </div>

      <div class="cart-drawer__summary">
        <div>
          <span>Subtotal</span>
          <strong>${formatBRL(total)}</strong>
        </div>
        <div>
          <span>Entrega</span>
          <strong>Grátis</strong>
        </div>
        <div class="cart-drawer__total">
          <span>Total</span>
          <strong>${formatBRL(total)}</strong>
        </div>
      </div>

      <a class="cart-drawer__checkout ${items.length ? "" : "is-disabled"}" href="cart.html" aria-disabled="${items.length ? "false" : "true"}">
        Finalizar compra
      </a>
      <button class="cart-drawer__continue" type="button" data-cart-drawer-close>Continuar comprando</button>
    `;
  }

  function openDrawer() {
    renderDrawer();
    drawer.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-cart-drawer");
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-cart-drawer");
  }

  document.addEventListener("click", (event) => {
    const cartLink = event.target.closest('a[href="cart.html"]');
    if (cartLink && !event.target.closest(".cart-drawer__checkout")) {
      event.preventDefault();
      openDrawer();
      return;
    }

    if (event.target.closest("[data-cart-drawer-close]")) {
      closeDrawer();
      return;
    }

    const removeButton = event.target.closest("[data-cart-drawer-remove]");
    if (removeButton) {
      const id = removeButton.getAttribute("data-cart-drawer-remove");
      writeCart(readCart().filter((item) => item.id !== id));
      renderDrawer();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  });
})();
