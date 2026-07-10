// =====================================================================
// Dashboard — J&S Creative & Marketing ERP
// =====================================================================
(function () {
  const session = jcGetSession();

  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  const ROLE_LABELS = {
    administrador: 'Administrador',
    gerente: 'Gerente',
    financeiro: 'Financeiro',
    comercial: 'Comercial',
    producao: 'Produção',
    designer: 'Designer',
    instalador: 'Instalador',
    cliente: 'Cliente',
  };

  const currency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  function initials(name) {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  function renderUser() {
    document.getElementById('userAvatar').textContent = initials(session.fullName) || '--';
    document.getElementById('userName').textContent = session.fullName || 'Usuário';
    document.getElementById('userRole').textContent = ROLE_LABELS[session.role] || session.role;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = (session.fullName || '').split(' ')[0];
    document.getElementById('greeting').textContent = `${greeting}${firstName ? ', ' + firstName : ''}`;
    document.getElementById('todayLabel').textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  function kpiCard({ label, value, iconSvg, pct, isCurrency = true, delay = 0 }) {
    return `
      <div class="jc-glass kpi-card" style="animation-delay:${delay}ms">
        <div class="kpi-top">
          <span class="kpi-label">${label}</span>
          <div class="kpi-gauge" style="--pct:${pct}">${iconSvg}</div>
        </div>
        <div class="kpi-value">${isCurrency ? currency(value) : value}</div>
      </div>`;
  }

  const ICONS = {
    revenue: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    profit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>',
    receivable: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 12V8H6a2 2 0 010-4h12v4"/><path d="M4 6v12a2 2 0 002 2h14v-4"/><path d="M18 12a2 2 0 000 4h4v-4z"/></svg>',
    clients: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
  };

  async function loadKpis() {
    const grid = document.getElementById('kpiGrid');
    try {
      const { kpis, ordersByStatus, lowStockAlerts } = await jcApiFetch('/dashboard/summary');

      grid.innerHTML = [
        kpiCard({ label: 'Receita do mês', value: kpis.revenueThisMonth, iconSvg: ICONS.revenue, pct: 70, delay: 0 }),
        kpiCard({ label: 'Lucro do mês', value: kpis.profitThisMonth, iconSvg: ICONS.profit, pct: 55, delay: 60 }),
        kpiCard({ label: 'A receber (em aberto)', value: kpis.receivablesOpen, iconSvg: ICONS.receivable, pct: 40, delay: 120 }),
        kpiCard({ label: 'Clientes ativos', value: kpis.activeClients, iconSvg: ICONS.clients, pct: 80, isCurrency: false, delay: 180 }),
      ].join('');

      renderPipeline(ordersByStatus);
      renderStockAlerts(lowStockAlerts);
    } catch (err) {
      grid.innerHTML = `<div class="jc-glass panel" style="grid-column: 1 / -1;">
        <p class="empty-state">Não foi possível carregar os indicadores agora (${err.message}). Verifique se o backend está em execução em <span class="jc-mono">${window.JC_CONFIG.API_BASE_URL}</span>.</p>
      </div>`;
    }
  }

  const STATUS_LABELS = {
    aguardando_producao: 'Aguardando produção',
    em_producao: 'Em produção',
    em_instalacao: 'Em instalação',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  function renderPipeline(ordersByStatus) {
    const el = document.getElementById('statusPipeline');
    const entries = Object.entries(ordersByStatus || {});

    if (entries.length === 0) {
      el.innerHTML = '<p class="empty-state">Nenhum pedido cadastrado ainda.</p>';
      return;
    }

    const max = Math.max(...entries.map(([, count]) => count), 1);
    el.innerHTML = entries
      .map(
        ([status, count]) => `
        <div class="status-row">
          <span class="dot"></span>
          <span class="label">${STATUS_LABELS[status] || status}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${(count / max) * 100}%"></span></span>
          <span class="count jc-mono">${count}</span>
        </div>`
      )
      .join('');
  }

  function renderStockAlerts(items) {
    const el = document.getElementById('stockAlerts');
    if (!items || items.length === 0) {
      el.innerHTML = '<p class="empty-state">Nenhum item abaixo do estoque mínimo. Tudo sob controle.</p>';
      return;
    }
    el.innerHTML = items
      .map(
        (item) => `
        <div class="stock-alert-item">
          <span class="name">${item.name}</span>
          <span class="qty jc-mono">${item.stock_quantity} / mín. ${item.stock_min}</span>
        </div>`
      )
      .join('');
  }

  // --- Painel motivacional ---
  let quotes = [];
  let quoteIndex = 0;

  async function loadQuotes() {
    try {
      const { quotes: data } = await jcApiFetch('/motivational');
      quotes = data || [];
      if (quotes.length) rotateQuote();
    } catch (err) {
      document.getElementById('quoteText').textContent =
        'A excelência é feita de pequenos detalhes, mas a excelência em si não é um detalhe.';
      document.getElementById('quoteAuthor').textContent = '— Aristóteles';
    }
  }

  function rotateQuote() {
    const textEl = document.getElementById('quoteText');
    const authorEl = document.getElementById('quoteAuthor');
    const q = quotes[quoteIndex % quotes.length];

    textEl.style.opacity = 0;
    setTimeout(() => {
      textEl.textContent = `“${q.quote_text}”`;
      authorEl.textContent = `— ${q.author}`;
      textEl.style.opacity = 1;
    }, 300);

    quoteIndex += 1;
  }

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await jcApiFetch('/auth/logout', { method: 'POST' }); } catch (e) { /* ignora falha de rede no logout */ }
    jcClearSession();
    window.location.href = 'index.html';
  });

  renderUser();
  loadKpis();
  loadQuotes();
  setInterval(rotateQuote, 9000);
})();
