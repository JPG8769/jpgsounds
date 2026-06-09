(function () {
  const ORDER_KEY = "jpg_orders";

  const LICENSE_RULES = {
    mp3: {
      title: "Licença MP3",
      delivery: "Arquivo MP3 320kbps",
      scope: "Licença não exclusiva para uso comercial, distribuição digital e publicação em redes sociais."
    },
    wav: {
      title: "Licença WAV",
      delivery: "Arquivo WAV sem compressão",
      scope: "Licença não exclusiva para uso comercial, distribuição digital, videoclipes e redes sociais."
    },
    stems: {
      title: "Licença STEMS",
      delivery: "Arquivo WAV e arquivos stems separados",
      scope: "Licença não exclusiva com acesso aos stems para gravação, mixagem e masterização."
    },
    exclusiva: {
      title: "Licença Exclusiva",
      delivery: "Arquivos WAV, MP3 e STEMS",
      scope: "Licença exclusiva. Após confirmação, o beat deve ser removido da loja."
    }
  };

  function formatBRL(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value || 0);
  }

  function todayBR() {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date());
  }

  function readOrders() {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function saveOrder(order) {
    const orders = readOrders();
    orders.unshift(order);
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  }

  function buildItemLine(item, index) {
    const license = LICENSE_RULES[item.license] || {
      title: item.licenseLabel || "Licença",
      delivery: item.licenseLabel || "Arquivo digital",
      scope: "Licença conforme selecionada no checkout."
    };

    return [
      `${index + 1}. Beat: ${item.beatTitle || "Beat"}`,
      `   Licença: ${license.title}`,
      `   Arquivos: ${license.delivery}`,
      `   Valor: ${item.priceLabel || formatBRL(item.price)}`,
      `   Termos: ${license.scope}`
    ].join("\n");
  }

  function buildContract(order) {
    const customer = order.customer || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const total = items.reduce((sum, item) => sum + (typeof item.price === "number" ? item.price : 0), 0);

    return `CONTRATO DE LICENÇA DE USO DE BEAT

Data: ${todayBR()}
Pedido: ${order.id}

LICENCIANTE
JPG Sounds
Contato: direct no Instagram @jpgoncalvezz

LICENCIADO
Nome completo: ${customer.name || "-"}
CPF/CNPJ: ${customer.document || "-"}
Email: ${customer.email || "-"}
Telefone: ${customer.phone || "-"}
Endereço: ${customer.address || "-"}

OBRA(S) LICENCIADA(S)
${items.map(buildItemLine).join("\n\n")}

VALOR TOTAL
${formatBRL(total)}

CONDIÇÕES GERAIS
1. O licenciado recebe o direito de uso conforme a licença escolhida no momento da compra.
2. Licenças não exclusivas podem continuar disponíveis para outros artistas.
3. Licenças exclusivas retiram o beat da loja após confirmação do pagamento.
4. É proibida a revenda isolada do beat, dos stems ou de qualquer arquivo entregue.
5. Os arquivos digitais e este contrato devem ser enviados ao email informado após confirmação do pagamento.

ASSINATURA DIGITAL
JPG Sounds
${customer.name || "Licenciado"}
`;
  }

  function createTextDownload(text, filename) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    return URL.createObjectURL(blob);
  }

  function createOrder(customer, items) {
    const order = {
      id: `JPG-${Date.now().toString(36).toUpperCase()}`,
      customer,
      items,
      createdAt: new Date().toISOString()
    };
    order.contractText = buildContract(order);
    order.contractFileName = `contrato-${order.id}.txt`;
    saveOrder(order);
    return order;
  }

  window.JPGContracts = {
    createOrder,
    createTextDownload,
    buildContract,
    readOrders
  };
})();
