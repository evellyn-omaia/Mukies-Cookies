const STATUS_DASHBOARD = {
  1: { nome: "Pendente", classe: "status-pendente" },
  2: { nome: "Pago", classe: "status-pendente" },
  3: { nome: "Em produção", classe: "status-producao" },
  4: { nome: "Pronto", classe: "status-pronto" },
  5: { nome: "Entregue", classe: "status-pronto" },
  6: { nome: "Cancelado", classe: "status-outro" },
};

document.addEventListener("DOMContentLoaded", iniciarDashboard);

async function iniciarDashboard() {
  atualizarIconesDashboard();
  configurarBuscaDashboard();
  try {
    const [produtos, pedidos] = await Promise.all([
      requisicaoApi("/produtos"),
      requisicaoApi("/pedidos"),
    ]);
    renderizarDashboard(Array.isArray(produtos) ? produtos : [], Array.isArray(pedidos) ? pedidos : []);
  } catch (erro) {
    console.error(erro.message);
    document.getElementById("erroDashboard").textContent = "Não foi possível carregar os dados do painel. Tente novamente em instantes.";
    document.getElementById("erroDashboard").classList.remove("escondido");
    renderizarDashboard([], []);
  }
}

function renderizarDashboard(produtos, pedidos) {
  const pedidosValidos = pedidos.filter((pedido) => pedido.status !== 6);
  document.getElementById("totalProdutos").textContent = produtos.length;
  document.getElementById("pedidosPendentes").textContent = pedidos.filter((pedido) => [1, 2, 3].includes(pedido.status)).length;
  document.getElementById("pedidosProntos").textContent = pedidos.filter((pedido) => pedido.status === 4).length;
  document.getElementById("totalVendido").textContent = formatarMoedaDashboard(somar(pedidosValidos, "valorTotal"));
  renderizarUltimosPedidos(pedidos);
  renderizarGrafico(pedidosValidos);
  renderizarProdutosVendidos(produtos, pedidosValidos);
  atualizarIconesDashboard();
}

function renderizarUltimosPedidos(pedidos) {
  const corpo = document.getElementById("ultimosPedidos");
  const recentes = [...pedidos].sort((a, b) => new Date(b.dataPedido) - new Date(a.dataPedido)).slice(0, 5);
  if (!recentes.length) {
    corpo.innerHTML = '<tr><td colspan="5" class="estado-dashboard">Nenhum pedido cadastrado.</td></tr>';
    return;
  }
  corpo.innerHTML = recentes.map((pedido) => {
    const status = STATUS_DASHBOARD[pedido.status] || STATUS_DASHBOARD[6];
    return `<tr><td>#${pedido.id}</td><td>${escaparDashboard(pedido.nomeCliente)}</td><td>${formatarDataDashboard(pedido.dataPedido)}</td><td><span class="etiqueta-status ${status.classe}">${status.nome}</span></td><td>${formatarMoedaDashboard(pedido.valorTotal)}</td></tr>`;
  }).join("");
}

function renderizarGrafico(pedidos) {
  const dias = obterUltimosSeteDias();
  const valores = dias.map((dia) => pedidos.filter((pedido) => mesmaData(new Date(pedido.dataPedido), dia)).reduce((total, pedido) => total + Number(pedido.valorTotal || 0), 0));
  const total = valores.reduce((soma, valor) => soma + valor, 0);
  document.getElementById("totalSeteDias").textContent = formatarMoedaDashboard(total);
  const maiorVenda = Math.max(...valores, 0);
  const maximo = maiorVenda || 3000;
  const largura = 560, altura = 220, esquerda = 48, topo = 16, base = 175, areaLargura = 492;
  const pontos = valores.map((valor, indice) => ({ x: esquerda + (areaLargura / 6) * indice, y: base - (valor / maximo) * (base - topo) }));
  const linha = pontos.map((ponto) => `${ponto.x},${ponto.y}`).join(" ");
  const area = `${esquerda},${base} ${linha} ${esquerda + areaLargura},${base}`;
  const grades = [0, .5, 1].map((proporcao) => { const y = base - proporcao * (base - topo); return `<line class="linha-grade" x1="${esquerda}" y1="${y}" x2="${esquerda + areaLargura}" y2="${y}"/><text class="rotulo-grafico" x="0" y="${y + 4}">${formatarEixo(maximo * proporcao)}</text>`; }).join("");
  const rotulos = pontos.map((ponto, indice) => `<circle class="ponto-grafico" cx="${ponto.x}" cy="${ponto.y}" r="5"/><text class="rotulo-grafico" x="${ponto.x}" y="205" text-anchor="middle">${dias[indice].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</text>`).join("");
  document.getElementById("graficoVendas").innerHTML = `<svg viewBox="0 0 ${largura} ${altura}" role="img"><defs><linearGradient id="gradienteVendas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f58a94" stop-opacity=".28"/><stop offset="1" stop-color="#f58a94" stop-opacity=".03"/></linearGradient></defs>${grades}<polygon class="area-grafico" points="${area}"/><polyline class="linha-grafico" points="${linha}"/>${rotulos}</svg>`;
}

function renderizarProdutosVendidos(produtos, pedidos) {
  const vendidos = new Map();
  pedidos.forEach((pedido) => (pedido.itensPedido || []).forEach((item) => vendidos.set(item.produtoId, (vendidos.get(item.produtoId) || 0) + Number(item.quantidade || 0))));
  const ranking = produtos.map((produto) => ({ ...produto, vendidos: vendidos.get(produto.id) || 0 })).sort((a, b) => b.vendidos - a.vendidos || a.nome.localeCompare(b.nome)).slice(0, 3);
  const grade = document.getElementById("produtosMaisVendidos");
  if (!ranking.length) { grade.innerHTML = '<div class="estado-dashboard">Nenhum produto cadastrado.</div>'; return; }
  grade.innerHTML = ranking.map((produto) => `<article class="produto-ranking"><img src="./imagens/${escolherImagemDashboard(produto.nome, produto.id)}" alt="${escaparDashboard(produto.nome)}"><div><h3>${escaparDashboard(produto.nome)}</h3><p>${escaparDashboard(produto.descricao || produto.nomeCategoria || "Cookie artesanal feito com carinho.")}</p><strong>${formatarMoedaDashboard(produto.preco)}</strong><small>♡ ${produto.vendidos} vendidos</small></div></article>`).join("");
}

function configurarBuscaDashboard() {
  document.getElementById("buscaDashboard").addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter") return;
    const termo = evento.currentTarget.value.trim();
    if (termo) window.location.href = `./paginas/pedidos.html?busca=${encodeURIComponent(termo)}`;
  });
}

function obterUltimosSeteDias() { const dias = []; const hoje = new Date(); hoje.setHours(0, 0, 0, 0); for (let i = 6; i >= 0; i--) { const dia = new Date(hoje); dia.setDate(hoje.getDate() - i); dias.push(dia); } return dias; }
function mesmaData(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function somar(lista, chave) { return lista.reduce((total, item) => total + Number(item[chave] || 0), 0); }
function formatarMoedaDashboard(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatarDataDashboard(valor) { return new Date(valor).toLocaleDateString("pt-BR"); }
function formatarEixo(valor) { if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(valor >= 10000 ? 0 : 1).replace(".", ",")}k`; return `R$ ${Math.round(valor)}`; }
function escolherImagemDashboard(nome, id) { const texto = String(nome || "").toLowerCase(); if (texto.includes("nutella")) return "cookie-nutella.png"; if (texto.includes("red velvet")) return "cookie-red-velvet.png"; if (texto.includes("doce de leite")) return "cookie-doce-leite.png"; if (texto.includes("chocolate")) return "cookie-chocolate.png"; const imagens = ["cookie-classico.png", "cookie-nutella.png", "cookie-red-velvet.png", "cookie-chocolate.png", "cookie-doce-leite.png"]; return imagens[(Number(id || 1) - 1) % imagens.length]; }
function escaparDashboard(valor) { const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }; return String(valor || "").replace(/[&<>"']/g, (caractere) => mapa[caractere]); }
function atualizarIconesDashboard() { if (window.lucide) window.lucide.createIcons(); }
