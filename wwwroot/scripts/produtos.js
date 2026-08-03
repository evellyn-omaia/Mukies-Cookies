"use strict";

const elementos = {
  corpo: document.getElementById("corpoTabela"),
  tabela: document.getElementById("regiaoTabela"),
  carregamento: document.getElementById("mensagemCarregamento"),
  erro: document.getElementById("mensagemErro"),
  busca: document.getElementById("buscaNome"),
  buscaGlobal: document.getElementById("buscaGlobalProdutos"),
  categoria: document.getElementById("filtroCategoria"),
  disponibilidade: document.getElementById("filtroDisponibilidade"),
  cards: document.querySelectorAll(".resumo[data-filtro]"),
  total: document.getElementById("totalProdutos"),
  disponiveis: document.getElementById("produtosDisponiveis"),
  indisponiveis: document.getElementById("produtosIndisponiveis"),
  textoPaginacao: document.getElementById("textoPaginacao"),
  paginacao: document.getElementById("paginacao"),
  modalProduto: document.getElementById("modalProduto"),
  formulario: document.getElementById("formularioProduto"),
  id: document.getElementById("produtoId"),
  nome: document.getElementById("nomeProduto"),
  descricao: document.getElementById("descricaoProduto"),
  contador: document.getElementById("contadorDescricao"),
  preco: document.getElementById("precoProduto"),
  categoriaProduto: document.getElementById("categoriaProduto"),
  disponivelProduto: document.getElementById("disponivelProduto"),
  tituloModal: document.getElementById("tituloModal"),
  erroFormulario: document.getElementById("erroFormulario"),
  salvar: document.getElementById("botaoSalvar"),
  modalConfirmacao: document.getElementById("modalConfirmacao"),
  textoConfirmacao: document.getElementById("textoConfirmacao"),
  confirmarExclusao: document.getElementById("botaoConfirmarExclusao"),
  toast: document.getElementById("toast"),
};

const imagens = [
  "cookie-classico.png",
  "cookie-nutella.png",
  "cookie-red-velvet.png",
  "cookie-chocolate.png",
  "cookie-kinder-bueno.png",
];

let produtos = [];
let produtosFiltrados = [];
let paginaAtual = 1;
let filtroDisponibilidade = null;
let produtoParaExcluir = null;
let tempoBusca;
let tempoToast;

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {
  criarIcones();
  registrarEventos();
  mostrarCarregamento();
  await carregarCategorias();
  await carregarProdutos();
}

function registrarEventos() {
  elementos.busca.addEventListener("input", alterarBusca);
  elementos.buscaGlobal.addEventListener("input", alterarBusca);
  elementos.categoria.addEventListener("change", filtrarDaPrimeiraPagina);
  elementos.disponibilidade.addEventListener("change", alterarDisponibilidade);
  elementos.formulario.addEventListener("submit", salvarProduto);
  elementos.confirmarExclusao.addEventListener("click", excluirProduto);
  elementos.descricao.addEventListener("input", atualizarContador);

  elementos.cards.forEach(function (card) {
    card.addEventListener("click", function () {
      filtroDisponibilidade =
        card.dataset.filtro === "todos"
          ? null
          : card.dataset.filtro === "true";
      elementos.disponibilidade.checked = filtroDisponibilidade === true;
      filtrarDaPrimeiraPagina();
    });
  });

  document.getElementById("botaoNovoProduto").addEventListener("click", abrirNovo);
  document.getElementById("botaoFecharModal").addEventListener("click", fecharProduto);
  document.getElementById("botaoCancelar").addEventListener("click", fecharProduto);
  document.getElementById("botaoCancelarExclusao").addEventListener("click", fecharConfirmacao);
  elementos.modalProduto.addEventListener("click", fecharAoClicarFora);
  elementos.modalConfirmacao.addEventListener("click", fecharAoClicarFora);
  document.addEventListener("keydown", fecharComEscape);
}

async function carregarCategorias() {
  try {
    const categorias = await requisicaoApi("/categorias");
    verificarLista(categorias);
    categorias.sort(function (a, b) {
      return String(a.nome).localeCompare(String(b.nome), "pt-BR");
    });
    categorias.forEach(function (categoria) {
      elementos.categoria.add(new Option(categoria.nome, categoria.id));
      elementos.categoriaProduto.add(new Option(categoria.nome, categoria.id));
    });
  } catch (erro) {
    elementos.categoria.disabled = true;
    elementos.categoriaProduto.disabled = true;
    console.error(erro.message);
  }
}

async function carregarProdutos() {
  mostrarCarregamento();
  try {
    const resposta = await requisicaoApi("/produtos");
    verificarLista(resposta);
    produtos = resposta;
    atualizarResumo();
    aplicarFiltros();
  } catch (erro) {
    console.error(erro.message);
    produtos = [];
    atualizarResumo();
    aplicarFiltros();
  }
}

function alterarBusca(evento) {
  const outroCampo =
    evento.target === elementos.busca ? elementos.buscaGlobal : elementos.busca;
  outroCampo.value = evento.target.value;
  clearTimeout(tempoBusca);
  tempoBusca = setTimeout(filtrarDaPrimeiraPagina, 300);
}

function alterarDisponibilidade() {
  filtroDisponibilidade = elementos.disponibilidade.checked ? true : null;
  filtrarDaPrimeiraPagina();
}

function filtrarDaPrimeiraPagina() {
  paginaAtual = 1;
  aplicarFiltros();
}

function aplicarFiltros() {
  const busca = semAcentos(elementos.busca.value.trim());
  const categoriaId = elementos.categoria.value;

  produtosFiltrados = produtos.filter(function (produto) {
    const textoProduto = semAcentos(
      produto.nome + " " + (produto.descricao || ""),
    );
    const nomeOk = textoProduto.includes(busca);
    const categoriaOk =
      !categoriaId || String(produto.categoriaId) === categoriaId;
    const disponibilidadeOk =
      filtroDisponibilidade === null ||
      Boolean(produto.disponivel) === filtroDisponibilidade;
    return nomeOk && categoriaOk && disponibilidadeOk;
  });

  marcarCardSelecionado();
  renderizar();
}

function atualizarResumo() {
  const disponiveis = produtos.filter(function (produto) {
    return produto.disponivel;
  }).length;
  elementos.total.textContent = produtos.length;
  elementos.disponiveis.textContent = disponiveis;
  elementos.indisponiveis.textContent = produtos.length - disponiveis;
}

function marcarCardSelecionado() {
  let filtro = "todos";
  if (filtroDisponibilidade === true) filtro = "true";
  if (filtroDisponibilidade === false) filtro = "false";
  elementos.cards.forEach(function (card) {
    const selecionado = card.dataset.filtro === filtro;
    card.classList.toggle("ativo", selecionado);
    card.setAttribute("aria-pressed", String(selecionado));
  });
}

function renderizar() {
  elementos.carregamento.classList.add("escondido");
  elementos.erro.classList.add("escondido");
  elementos.tabela.classList.remove("escondido");
  elementos.tabela.setAttribute("aria-busy", "false");

  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / 5));
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  const inicio = (paginaAtual - 1) * 5;
  const fim = Math.min(inicio + 5, produtosFiltrados.length);
  const pagina = produtosFiltrados.slice(inicio, fim);

  elementos.corpo.innerHTML = "";
  if (pagina.length === 0) {
    elementos.corpo.innerHTML = `
      <tr class="sem-produtos"><td colspan="5"><div class="vazio-conteudo">
        <span class="icone-vazio" aria-hidden="true"><i data-lucide="cookie"></i></span>
        <strong>Nenhum produto encontrado</strong>
        <span>Tente alterar a busca ou os filtros selecionados.</span>
      </div></td></tr>`;
  } else {
    pagina.forEach(function (produto) {
      elementos.corpo.appendChild(criarLinha(produto));
    });
  }

  elementos.textoPaginacao.textContent = produtosFiltrados.length
    ? `Mostrando ${inicio + 1} a ${fim} de ${produtosFiltrados.length} produtos`
    : "Mostrando 0 produtos";
  criarPaginacao(totalPaginas);
  criarIcones();
}

function criarLinha(produto) {
  const linha = document.createElement("tr");
  const disponivel = Boolean(produto.disponivel);
  linha.innerHTML = `
    <td><div class="produto-celula">
      <img class="produto-imagem" src="../imagens/${escolherImagem(produto)}?v=2" alt="" loading="lazy">
      <div class="produto-texto">
        <strong>${escapar(produto.nome || "Produto sem nome")}</strong>
        <small>${escapar(produto.descricao || "Sem descrição cadastrada.")}</small>
      </div>
    </div></td>
    <td><span class="etiqueta-categoria ${classeCategoria(produto.nomeCategoria)}">${escapar(produto.nomeCategoria || "Sem categoria")}</span></td>
    <td>${moeda(produto.preco)}</td>
    <td><span class="status ${disponivel ? "disponivel" : "indisponivel"}">${disponivel ? "Disponível" : "Indisponível"}</span></td>
    <td><div class="acoes">
      <button class="acao editar" type="button" title="Editar" aria-label="Editar"><i data-lucide="pencil" aria-hidden="true"></i></button>
      <button class="acao excluir" type="button" title="Excluir" aria-label="Excluir"><i data-lucide="trash-2" aria-hidden="true"></i></button>
    </div></td>`;

  linha.querySelector("img").alt = "Imagem de " + (produto.nome || "produto");
  linha.querySelector(".editar").addEventListener("click", function () {
    abrirEdicao(produto.id);
  });
  linha.querySelector(".excluir").addEventListener("click", function () {
    abrirConfirmacao(produto);
  });
  return linha;
}

function criarPaginacao(totalPaginas) {
  elementos.paginacao.innerHTML = "";
  adicionarPagina("anterior", paginaAtual - 1, paginaAtual === 1);

  paginasVisiveis(totalPaginas).forEach(function (pagina) {
    if (pagina === "...") {
      const reticencias = document.createElement("span");
      reticencias.className = "reticencias-paginacao";
      reticencias.textContent = "…";
      elementos.paginacao.appendChild(reticencias);
    } else {
      adicionarPagina(String(pagina), pagina, false, pagina === paginaAtual);
    }
  });
  adicionarPagina("próxima", paginaAtual + 1, paginaAtual === totalPaginas);
}

function adicionarPagina(rotulo, pagina, desabilitado, ativo) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "pagina-btn" + (ativo ? " ativa" : "");
  botao.disabled = desabilitado;
  botao.setAttribute("aria-label", "Página " + rotulo);

  if (rotulo === "anterior" || rotulo === "próxima") {
    const lado = rotulo === "anterior" ? "left" : "right";
    botao.innerHTML = `<i data-lucide="chevron-${lado}" aria-hidden="true"></i>`;
  } else {
    botao.textContent = rotulo;
    if (ativo) botao.setAttribute("aria-current", "page");
  }
  botao.addEventListener("click", function () {
    paginaAtual = pagina;
    renderizar();
  });
  elementos.paginacao.appendChild(botao);
}

function paginasVisiveis(total) {
  if (total <= 5) {
    const paginas = [];
    for (let pagina = 1; pagina <= total; pagina++) paginas.push(pagina);
    return paginas;
  }
  if (paginaAtual <= 3) return [1, 2, 3, "...", total];
  if (paginaAtual >= total - 2) {
    return [1, "...", total - 2, total - 1, total];
  }
  return [1, "...", paginaAtual, "...", total];
}

function abrirNovo() {
  elementos.formulario.reset();
  elementos.id.value = "";
  elementos.disponivelProduto.checked = true;
  elementos.tituloModal.textContent = "Novo produto";
  elementos.erroFormulario.classList.add("escondido");
  atualizarContador();
  abrirModal(elementos.modalProduto);
}

async function abrirEdicao(id) {
  try {
    const produto = await requisicaoApi("/produtos/" + id);
    elementos.id.value = produto.id;
    elementos.nome.value = produto.nome;
    elementos.descricao.value = produto.descricao || "";
    elementos.preco.value = produto.preco;
    elementos.categoriaProduto.value = produto.categoriaId;
    elementos.disponivelProduto.checked = Boolean(produto.disponivel);
    elementos.tituloModal.textContent = "Editar produto";
    elementos.erroFormulario.classList.add("escondido");
    atualizarContador();
    abrirModal(elementos.modalProduto);
  } catch (erro) {
    mostrarToast(erro.message, true);
  }
}

async function salvarProduto(evento) {
  evento.preventDefault();
  elementos.erroFormulario.classList.add("escondido");
  const id = elementos.id.value;
  const dados = {
    nome: elementos.nome.value.trim(),
    descricao: elementos.descricao.value.trim() || null,
    preco: Number(elementos.preco.value),
    disponivel: elementos.disponivelProduto.checked,
    categoriaId: Number(elementos.categoriaProduto.value),
  };

  mudarBotao(elementos.salvar, true, "Salvando...");
  try {
    await requisicaoApi(id ? "/produtos/" + id : "/produtos", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(dados),
    });
    fecharModal(elementos.modalProduto);
    mostrarToast(id ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
    paginaAtual = 1;
    await carregarProdutos();
  } catch (erro) {
    elementos.erroFormulario.textContent = erro.message;
    elementos.erroFormulario.classList.remove("escondido");
  } finally {
    mudarBotao(elementos.salvar, false, "Salvar produto");
  }
}

function abrirConfirmacao(produto) {
  produtoParaExcluir = produto;
  elementos.textoConfirmacao.textContent =
    `O produto “${produto.nome}” será removido permanentemente.`;
  abrirModal(elementos.modalConfirmacao);
}

async function excluirProduto() {
  if (!produtoParaExcluir) return;
  mudarBotao(elementos.confirmarExclusao, true, "Excluindo...");
  try {
    await requisicaoApi("/produtos/" + produtoParaExcluir.id, {
      method: "DELETE",
    });
    fecharModal(elementos.modalConfirmacao);
    produtoParaExcluir = null;
    mostrarToast("Produto excluído com sucesso!");
    await carregarProdutos();
  } catch (erro) {
    mostrarToast(erro.message, true);
  } finally {
    mudarBotao(elementos.confirmarExclusao, false, "Excluir produto");
  }
}

function abrirModal(modal) {
  modal.classList.remove("escondido");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("com-modal-aberto");
  criarIcones();
}

function fecharModal(modal) {
  modal.classList.add("escondido");
  modal.setAttribute("aria-hidden", "true");
  if (
    elementos.modalProduto.classList.contains("escondido") &&
    elementos.modalConfirmacao.classList.contains("escondido")
  ) {
    document.body.classList.remove("com-modal-aberto");
  }
}

function fecharProduto() {
  if (!elementos.salvar.disabled) fecharModal(elementos.modalProduto);
}

function fecharConfirmacao() {
  if (elementos.confirmarExclusao.disabled) return;
  produtoParaExcluir = null;
  fecharModal(elementos.modalConfirmacao);
}

function fecharAoClicarFora(evento) {
  if (evento.target === elementos.modalProduto) fecharProduto();
  if (evento.target === elementos.modalConfirmacao) fecharConfirmacao();
}

function fecharComEscape(evento) {
  if (evento.key !== "Escape") return;
  if (!elementos.modalConfirmacao.classList.contains("escondido")) {
    fecharConfirmacao();
  } else if (!elementos.modalProduto.classList.contains("escondido")) {
    fecharProduto();
  }
}

function mudarBotao(botao, carregando, texto) {
  botao.disabled = carregando;
  botao.querySelector("span").textContent = texto;
}

function atualizarContador() {
  elementos.contador.textContent = elementos.descricao.value.length;
}

function mostrarCarregamento() {
  elementos.carregamento.classList.remove("escondido");
  elementos.erro.classList.add("escondido");
  elementos.tabela.classList.add("escondido");
  elementos.tabela.setAttribute("aria-busy", "true");
  elementos.textoPaginacao.textContent = "Carregando produtos...";
  elementos.paginacao.innerHTML = "";
}

function mostrarToast(mensagem, erro) {
  clearTimeout(tempoToast);
  elementos.toast.querySelector("span").textContent = mensagem;
  elementos.toast.classList.toggle("erro-toast", Boolean(erro));
  elementos.toast.classList.remove("escondido");
  tempoToast = setTimeout(function () {
    elementos.toast.classList.add("escondido");
  }, 4200);
}

function escolherImagem(produto) {
  const texto = semAcentos(
    (produto.nome || "") + " " + (produto.nomeCategoria || ""),
  );
  if (texto.includes("kinder")) return "cookie-kinder-bueno.png";
  if (texto.includes("nutella")) return "cookie-nutella.png";
  if (texto.includes("red velvet")) return "cookie-red-velvet.png";
  if (texto.includes("chocolate") || texto.includes("belga")) {
    return "cookie-chocolate.png";
  }
  const id = Number(produto.id);
  return Number.isInteger(id) && id > 0
    ? imagens[(id - 1) % imagens.length]
    : "cookie-classico.png";
}

function classeCategoria(nome) {
  const categoria = semAcentos(nome || "");
  if (categoria.includes("reche")) return "recheado";
  if (categoria.includes("especial")) return "especial";
  if (categoria.includes("tradicional")) return "";
  return "outros";
}

function semAcentos(texto) {
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function escapar(texto) {
  return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function verificarLista(valor) {
  if (!Array.isArray(valor)) throw new Error("A API retornou uma resposta inesperada.");
}

function criarIcones() {
  if (window.lucide) window.lucide.createIcons();
}
