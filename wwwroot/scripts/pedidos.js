const STATUS_PEDIDO = {
  1: { nome: "Aguardando pagamento", classe: "aguardando-pagamento" },
  2: { nome: "Pago", classe: "pago" },
  3: { nome: "Em produção", classe: "em-producao" },
  4: { nome: "Pronto", classe: "pronto" },
  5: { nome: "Entregue", classe: "entregue" },
  6: { nome: "Cancelado", classe: "cancelado" },
};

const PEDIDOS_POR_PAGINA = 8;

const elementosPedidos = {
  botaoNovo: document.getElementById("botaoNovoPedido"),
  modal: document.getElementById("modalPedido"),
  fecharModal: document.getElementById("fecharPedido"),
  cancelar: document.getElementById("cancelarPedido"),
  formulario: document.getElementById("formPedido"),
  nomeCliente: document.getElementById("nomeCliente"),
  telefoneCliente: document.getElementById("telefoneCliente"),
  dataPedido: document.getElementById("dataPedido"),
  observacao: document.getElementById("observacaoPedido"),
  adicionarItem: document.getElementById("adicionarItem"),
  itens: document.getElementById("itensPedido"),
  totalNovo: document.getElementById("totalNovoPedido"),
  erroFormulario: document.getElementById("erroFormPedido"),
  salvar: document.getElementById("salvarPedido"),
  tituloModal: document.getElementById("tituloModalPedido"),
  menuAcoes: document.getElementById("menuAcoesPedido"),
  editarAcao: document.getElementById("editarPedidoAcao"),
  filtroStatus: document.getElementById("filtroStatus"),
  filtroPeriodo: document.getElementById("filtroPeriodo"),
  busca: document.getElementById("buscaPedido"),
  buscaGlobal: document.getElementById("buscaGlobal"),
  corpoTabela: document.getElementById("corpoPedidos"),
  carregando: document.getElementById("carregandoPedidos"),
  erroLista: document.getElementById("erroPedidos"),
  textoPaginacao: document.getElementById("textoPaginacao"),
  paginacao: document.getElementById("paginacaoPedidos"),
  detalhes: document.getElementById("detalhesPedido"),
  totalPendentes: document.getElementById("totalPendentes"),
  totalProducao: document.getElementById("totalProducao"),
  totalProntos: document.getElementById("totalProntos"),
  totalEntregues: document.getElementById("totalEntregues"),
  totalFaturamento: document.getElementById("totalFaturamento"),
};

const estadoPedidos = {
  pedidos: [],
  filtrados: [],
  produtos: [],
  pagina: 1,
  pedidoSelecionado: null,
  statusCard: 0,
  erroProdutos: "",
  numeroItem: 0,
  pedidoEmEdicao: null,
};

document.addEventListener("DOMContentLoaded", iniciarPaginaPedidos);

async function iniciarPaginaPedidos() {
  configurarEventosPedidos();
  atualizarIconesPedidos();

  await Promise.all([carregarPedidos(), carregarProdutosDisponiveis()]);
}

function configurarEventosPedidos() {
  elementosPedidos.busca.addEventListener("input", function () {
    elementosPedidos.buscaGlobal.value = elementosPedidos.busca.value;
    estadoPedidos.pagina = 1;
    filtrarPedidos();
  });

  elementosPedidos.buscaGlobal.addEventListener("input", function () {
    elementosPedidos.busca.value = elementosPedidos.buscaGlobal.value;
    estadoPedidos.pagina = 1;
    filtrarPedidos();
  });

  elementosPedidos.filtroStatus.addEventListener("change", function () {
    estadoPedidos.statusCard = 0;
    estadoPedidos.pagina = 1;
    marcarCardSelecionado();
    filtrarPedidos();
  });

  elementosPedidos.filtroPeriodo.addEventListener("change", function () {
    estadoPedidos.pagina = 1;
    filtrarPedidos();
  });

  document
    .querySelectorAll(".resumo-pedido[data-status]")
    .forEach(function (card) {
      card.addEventListener("click", function () {
        const status = Number(card.dataset.status);
        estadoPedidos.statusCard =
          estadoPedidos.statusCard === status ? 0 : status;
        elementosPedidos.filtroStatus.value = estadoPedidos.statusCard || "";
        estadoPedidos.pagina = 1;
        marcarCardSelecionado();
        filtrarPedidos();
      });
    });

  elementosPedidos.botaoNovo.addEventListener("click", abrirNovoPedido);
  elementosPedidos.fecharModal.addEventListener("click", fecharModalPedido);
  elementosPedidos.cancelar.addEventListener("click", fecharModalPedido);
  elementosPedidos.adicionarItem.addEventListener("click", function () {
    adicionarLinhaItem();
  });
  elementosPedidos.formulario.addEventListener("submit", salvarNovoPedido);

  elementosPedidos.editarAcao.addEventListener("click", function (evento) {
    evento.stopPropagation();
    abrirEdicaoPedido(Number(elementosPedidos.menuAcoes.dataset.pedidoId));
  });

  document.addEventListener("click", function () {
    fecharMenusAcoes();
  });
  document.addEventListener("scroll", fecharMenusAcoes, true);
  window.addEventListener("resize", fecharMenusAcoes);

  elementosPedidos.modal.addEventListener("click", function (evento) {
    if (evento.target === elementosPedidos.modal) fecharModalPedido();
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && !elementosPedidos.modal.hidden) {
      fecharModalPedido();
    }
  });
}

async function carregarPedidos() {
  elementosPedidos.carregando.classList.remove("escondido");
  elementosPedidos.erroLista.classList.add("escondido");
  elementosPedidos.corpoTabela.innerHTML = "";

  try {
    const pedidos = await requisicaoApi("/pedidos");

    if (!Array.isArray(pedidos)) {
      throw new Error("A API não retornou uma lista de pedidos.");
    }

    estadoPedidos.pedidos = pedidos;
    atualizarResumos();
    filtrarPedidos();
  } catch (erro) {
    console.error(erro.message);
    estadoPedidos.pedidos = [];
    estadoPedidos.filtrados = [];
    atualizarResumos();
    filtrarPedidos();
  } finally {
    elementosPedidos.carregando.classList.add("escondido");
  }
}

async function carregarProdutosDisponiveis() {
  try {
    const produtos = await requisicaoApi("/produtos");

    if (!Array.isArray(produtos)) {
      throw new Error("A API não retornou uma lista de produtos.");
    }

    estadoPedidos.produtos = produtos;
    estadoPedidos.erroProdutos = "";
  } catch (erro) {
    estadoPedidos.produtos = [];
    estadoPedidos.erroProdutos = erro.message;
  }
}

function filtrarPedidos() {
  const busca = textoParaBusca(elementosPedidos.busca.value);
  const status =
    estadoPedidos.statusCard || Number(elementosPedidos.filtroStatus.value);
  const periodo = elementosPedidos.filtroPeriodo.value;

  estadoPedidos.filtrados = estadoPedidos.pedidos.filter(function (pedido) {
    if (status && pedido.status !== status) return false;
    if (!pedidoDentroDoPeriodo(pedido.dataPedido, periodo)) return false;
    if (!busca) return true;

    const nomesProdutos = pedido.itensPedido.map(function (item) {
      return item.nomeProduto;
    });

    const conteudo = [
      pedido.id,
      pedido.nomeCliente,
      pedido.telefoneCliente,
      pedido.observacao,
      STATUS_PEDIDO[pedido.status].nome,
      ...nomesProdutos,
    ].join(" ");

    return textoParaBusca(conteudo).includes(busca);
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(estadoPedidos.filtrados.length / PEDIDOS_POR_PAGINA)
  );
  if (estadoPedidos.pagina > totalPaginas) estadoPedidos.pagina = totalPaginas;

  const pedidoVisivel = estadoPedidos.filtrados.find(function (pedido) {
    return pedido.id === estadoPedidos.pedidoSelecionado;
  });

  if (!pedidoVisivel) {
    const inicio = (estadoPedidos.pagina - 1) * PEDIDOS_POR_PAGINA;
    const primeiroPedido = estadoPedidos.filtrados[inicio];
    estadoPedidos.pedidoSelecionado = primeiroPedido ? primeiroPedido.id : null;
  }

  renderizarTabela();
  renderizarPaginacao();
  renderizarDetalhes(obterPedidoSelecionado());
}

function renderizarTabela() {
  const inicio = (estadoPedidos.pagina - 1) * PEDIDOS_POR_PAGINA;
  const pedidosDaPagina = estadoPedidos.filtrados.slice(
    inicio,
    inicio + PEDIDOS_POR_PAGINA
  );

  if (pedidosDaPagina.length === 0) {
    elementosPedidos.corpoTabela.innerHTML = `
      <tr class="sem-pedidos estado-vazio-pedidos">
        <td colspan="6">
          <div class="estado-vazio-conteudo">
            <i data-lucide="cookie"></i>
            <strong>Nenhum pedido encontrado</strong>
            <span>Tente alterar os filtros ou cadastre um novo pedido.</span>
          </div>
        </td>
      </tr>`;
    atualizarIconesPedidos();
    return;
  }

  elementosPedidos.corpoTabela.innerHTML = pedidosDaPagina
    .map(function (pedido) {
      const status = STATUS_PEDIDO[pedido.status];
      const selecionado = pedido.id === estadoPedidos.pedidoSelecionado;

      return `
        <tr class="linha-pedido${selecionado ? " selecionado" : ""}"
            data-pedido-id="${
              pedido.id
            }" tabindex="0" aria-selected="${selecionado}">
          <td><strong class="numero-pedido">#${pedido.id}</strong></td>
          <td><span class="cliente-pedido" title="${escaparHtml(
            pedido.nomeCliente
          )}">${escaparHtml(pedido.nomeCliente)}</span></td>
          <td>${formatarDataPedido(pedido.dataPedido)}</td>
          <td><span class="status-pedido ${
            status.classe
          }">${status.nome}</span></td>
          <td><strong>${formatarMoeda(pedido.valorTotal)}</strong></td>
          <td>
            <div class="acoes-pedido">
              <button type="button" class="acao-pedido" data-pedido-id="${pedido.id}" aria-label="Abrir ações do pedido #${
                pedido.id
              }" aria-expanded="false">
                <i data-lucide="more-horizontal"></i>
              </button>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  elementosPedidos.corpoTabela
    .querySelectorAll(".linha-pedido")
    .forEach(function (linha) {
      const selecionar = function () {
        selecionarPedido(Number(linha.dataset.pedidoId));
      };

      linha.addEventListener("click", selecionar);
      linha.addEventListener("keydown", function (evento) {
        if (evento.key === "Enter") selecionar();
      });
    });

  elementosPedidos.corpoTabela
    .querySelectorAll(".acao-pedido")
    .forEach(function (botao) {
      botao.addEventListener("click", function (evento) {
        evento.stopPropagation();
        const abrir =
          elementosPedidos.menuAcoes.hidden ||
          elementosPedidos.menuAcoes.dataset.pedidoId !== botao.dataset.pedidoId;
        fecharMenusAcoes();
        if (abrir) abrirMenuAcoes(botao);
      });
    });

  atualizarIconesPedidos();
}

function fecharMenusAcoes() {
  elementosPedidos.menuAcoes.hidden = true;
  elementosPedidos.corpoTabela
    .querySelectorAll('.acao-pedido[aria-expanded="true"]')
    .forEach(function (botao) {
      botao.setAttribute("aria-expanded", "false");
    });
}

function abrirMenuAcoes(botao) {
  const menu = elementosPedidos.menuAcoes;
  const posicao = botao.getBoundingClientRect();
  menu.dataset.pedidoId = botao.dataset.pedidoId;
  menu.hidden = false;

  const espaco = 8;
  const topoAbaixo = posicao.bottom + 5;
  const topo =
    topoAbaixo + menu.offsetHeight <= window.innerHeight - espaco
      ? topoAbaixo
      : posicao.top - menu.offsetHeight - 5;
  const esquerda = Math.min(
    window.innerWidth - menu.offsetWidth - espaco,
    Math.max(espaco, posicao.right - menu.offsetWidth)
  );

  menu.style.top = `${Math.max(espaco, topo)}px`;
  menu.style.left = `${esquerda}px`;
  botao.setAttribute("aria-expanded", "true");
}

function selecionarPedido(id) {
  estadoPedidos.pedidoSelecionado = id;
  renderizarTabela();
  renderizarDetalhes(obterPedidoSelecionado());
}

function obterPedidoSelecionado() {
  return estadoPedidos.pedidos.find(function (pedido) {
    return pedido.id === estadoPedidos.pedidoSelecionado;
  });
}

function renderizarPaginacao() {
  const quantidade = estadoPedidos.filtrados.length;
  const totalPaginas = Math.max(1, Math.ceil(quantidade / PEDIDOS_POR_PAGINA));
  const inicio = quantidade
    ? (estadoPedidos.pagina - 1) * PEDIDOS_POR_PAGINA + 1
    : 0;
  const fim = Math.min(estadoPedidos.pagina * PEDIDOS_POR_PAGINA, quantidade);

  elementosPedidos.textoPaginacao.textContent = quantidade
    ? `Mostrando ${inicio} a ${fim} de ${quantidade} pedidos`
    : "Mostrando 0 pedidos";

  const paginas = paginasParaMostrar(estadoPedidos.pagina, totalPaginas);
  let html = criarBotaoPagina(
    "‹",
    estadoPedidos.pagina - 1,
    estadoPedidos.pagina === 1
  );

  paginas.forEach(function (pagina) {
    if (pagina === "...") {
      html += '<span class="paginacao-reticencias">…</span>';
    } else {
      html += criarBotaoPagina(
        String(pagina),
        pagina,
        false,
        pagina === estadoPedidos.pagina
      );
    }
  });

  html += criarBotaoPagina(
    "›",
    estadoPedidos.pagina + 1,
    estadoPedidos.pagina === totalPaginas
  );
  elementosPedidos.paginacao.innerHTML = html;

  elementosPedidos.paginacao
    .querySelectorAll("button[data-pagina]")
    .forEach(function (botao) {
      botao.addEventListener("click", function () {
        mudarPagina(Number(botao.dataset.pagina));
      });
    });
}

function paginasParaMostrar(atual, total) {
  if (total <= 7) {
    return Array.from({ length: total }, function (_, indice) {
      return indice + 1;
    });
  }
  if (atual <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (atual >= total - 3)
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", atual - 1, atual, atual + 1, "...", total];
}

function criarBotaoPagina(texto, pagina, desabilitado, ativo) {
  return `<button type="button" class="pagina-btn${ativo ? " ativa" : ""}"
    data-pagina="${pagina}" ${
    desabilitado ? "disabled" : ""
  }>${texto}</button>`;
}

function mudarPagina(pagina) {
  estadoPedidos.pagina = pagina;
  const primeiro = estadoPedidos.filtrados[(pagina - 1) * PEDIDOS_POR_PAGINA];
  estadoPedidos.pedidoSelecionado = primeiro ? primeiro.id : null;
  renderizarTabela();
  renderizarPaginacao();
  renderizarDetalhes(obterPedidoSelecionado());
}

function renderizarDetalhes(pedido) {
  if (!pedido) {
    elementosPedidos.detalhes.innerHTML = `
      <div class="cabecalho-detalhes"><h2>Detalhes do pedido</h2><span>♡</span></div>
      <div class="detalhes-vazio">
        <div class="icone-detalhes-vazio"><i data-lucide="receipt-text"></i></div>
        <strong>Selecione um pedido</strong>
        <p>Os detalhes da encomenda aparecerão aqui.</p>
      </div>`;
    atualizarIconesPedidos();
    return;
  }

  const status = STATUS_PEDIDO[pedido.status];
  const observacao = pedido.observacao
    ? escaparHtml(pedido.observacao)
    : "Nenhuma observação cadastrada.";

  const itens = pedido.itensPedido.length
    ? pedido.itensPedido.map(criarItemDetalhe).join("")
    : '<p class="sem-itens-pedido">Este pedido não possui itens.</p>';

  elementosPedidos.detalhes.innerHTML = `
    <div class="cabecalho-detalhes"><h2>Detalhes do pedido</h2><span>♡</span></div>
    <div class="detalhe-cabecalho">
      <h3>Pedido #${pedido.id}</h3>
      <span class="badge-status ${status.classe}">${status.nome}</span>
    </div>
    <div class="dados-pedido">
      <div class="dado-pedido"><i data-lucide="user"></i><span>${escaparHtml(
        pedido.nomeCliente
      )}</span></div>
      ${
        pedido.telefoneCliente
          ? `<div class="dado-pedido"><i data-lucide="phone"></i><a href="tel:${escaparHtml(
              pedido.telefoneCliente
            )}">${escaparHtml(pedido.telefoneCliente)}</a></div>`
          : ""
      }
      <div class="dado-pedido"><i data-lucide="calendar-days"></i><span>${formatarDataPedido(
        pedido.dataPedido,
        true
      )}</span></div>
      <div class="dado-pedido"><i data-lucide="message-square-text"></i><span>${observacao}</span></div>
    </div>
    <h4 class="titulo-itens-detalhe">Itens do pedido (${
      pedido.quantidadeTotalItens
    })</h4>
    <div class="itens-detalhes">${itens}</div>
    <div class="detalhes-total">
      <span>Total do pedido</span>
      <strong>${formatarMoeda(pedido.valorTotal)}</strong>
    </div>
    <div class="detalhe-acoes">
      <label for="statusDetalhesPedido">Atualizar status</label>
      <select id="statusDetalhesPedido">${criarOpcoesStatus(
        pedido.status
      )}</select>
      <button type="button" class="botao-detalhe" id="excluirPedidoSelecionado">
        <i data-lucide="trash-2"></i> Excluir pedido
      </button>
    </div>`;

  document
    .getElementById("statusDetalhesPedido")
    .addEventListener("change", function (evento) {
      alterarStatusPedido(
        pedido.id,
        Number(evento.target.value),
        evento.target
      );
    });

  document
    .getElementById("excluirPedidoSelecionado")
    .addEventListener("click", function () {
      excluirPedido(pedido.id);
    });

  atualizarIconesPedidos();
}

function criarItemDetalhe(item) {
  const imagem = escolherImagemProduto(item.nomeProduto, item.produtoId);
  return `
    <article class="item-detalhe">
      <img class="item-detalhe-imagem" src="../imagens/${imagem}" alt="" loading="lazy">
      <div class="item-detalhe-info">
        <strong>${item.quantidade}× ${escaparHtml(item.nomeProduto)}</strong>
        <small>${formatarMoeda(item.precoUnitario)} cada</small>
        <em>${formatarMoeda(item.subtotal)}</em>
      </div>
    </article>`;
}

function criarOpcoesStatus(statusAtual) {
  return Object.keys(STATUS_PEDIDO)
    .map(function (valor) {
      const status = STATUS_PEDIDO[valor];
      const selecionado = Number(valor) === statusAtual ? "selected" : "";
      return `<option value="${valor}" ${selecionado}>${status.nome}</option>`;
    })
    .join("");
}

async function alterarStatusPedido(id, novoStatus, seletor) {
  const pedido = estadoPedidos.pedidos.find(function (item) {
    return item.id === id;
  });
  const statusAnterior = pedido.status;

  if (novoStatus === statusAnterior) return;
  seletor.disabled = true;

  try {
    await requisicaoApi(`/pedidos/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: novoStatus }),
    });

    pedido.status = novoStatus;
    atualizarResumos();
    filtrarPedidos();
  } catch (erro) {
    seletor.value = statusAnterior;
    seletor.disabled = false;
    alert(erro.message);
  }
}

async function excluirPedido(id) {
  const pedido = estadoPedidos.pedidos.find(function (item) {
    return item.id === id;
  });

  const confirmou = confirm(
    `Deseja realmente excluir o pedido #${pedido.id} de ${pedido.nomeCliente}?`
  );
  if (!confirmou) return;

  try {
    await requisicaoApi(`/pedidos/${id}`, { method: "DELETE" });
    estadoPedidos.pedidos = estadoPedidos.pedidos.filter(function (item) {
      return item.id !== id;
    });
    estadoPedidos.pedidoSelecionado = null;
    atualizarResumos();
    filtrarPedidos();
  } catch (erro) {
    alert(erro.message);
  }
}

function atualizarResumos() {
  elementosPedidos.totalPendentes.textContent = contarPedidosComStatus(1);
  elementosPedidos.totalProducao.textContent = contarPedidosComStatus(3);
  elementosPedidos.totalProntos.textContent = contarPedidosComStatus(4);
  elementosPedidos.totalEntregues.textContent = contarPedidosComStatus(5);

  const totalHoje = estadoPedidos.pedidos
    .filter(function (pedido) {
      return (
        pedido.status !== 6 && pedidoDentroDoPeriodo(pedido.dataPedido, "hoje")
      );
    })
    .reduce(function (total, pedido) {
      return total + pedido.valorTotal;
    }, 0);

  elementosPedidos.totalFaturamento.textContent = formatarMoeda(totalHoje);
}

function contarPedidosComStatus(status) {
  return estadoPedidos.pedidos.filter(function (pedido) {
    return pedido.status === status;
  }).length;
}

function marcarCardSelecionado() {
  document
    .querySelectorAll(".resumo-pedido[data-status]")
    .forEach(function (card) {
      card.classList.toggle(
        "ativo",
        Number(card.dataset.status) === estadoPedidos.statusCard
      );
    });
}

async function abrirNovoPedido() {
  estadoPedidos.pedidoEmEdicao = null;
  elementosPedidos.tituloModal.textContent = "Novo pedido";
  elementosPedidos.formulario.reset();
  elementosPedidos.itens.innerHTML = "";
  elementosPedidos.erroFormulario.classList.add("escondido");
  elementosPedidos.totalNovo.textContent = formatarMoeda(0);
  elementosPedidos.dataPedido.value = formatarDataParaInput(new Date());
  elementosPedidos.dataPedido.max = formatarDataParaInput(new Date());
  estadoPedidos.numeroItem = 0;
  abrirModalPedido();

  if (estadoPedidos.produtos.length === 0) {
    await carregarProdutosDisponiveis();
  }

  if (estadoPedidos.erroProdutos) {
    mostrarErroFormulario(estadoPedidos.erroProdutos);
    elementosPedidos.adicionarItem.disabled = true;
    return;
  }

  if (!estadoPedidos.produtos.some(function (produto) { return produto.disponivel; })) {
    mostrarErroFormulario("Não há produtos disponíveis para criar um pedido.");
    elementosPedidos.adicionarItem.disabled = true;
    return;
  }

  elementosPedidos.adicionarItem.disabled = false;
  adicionarLinhaItem();
  elementosPedidos.nomeCliente.focus();
}

function adicionarLinhaItem(produtoIdSelecionado, quantidadeSelecionada) {
  estadoPedidos.numeroItem += 1;
  const numero = estadoPedidos.numeroItem;
  const linha = document.createElement("div");
  linha.className = "linha-item-pedido item-pedido-linha";

  const opcoes = estadoPedidos.produtos
    .filter(function (produto) {
      return produto.disponivel || produto.id === Number(produtoIdSelecionado);
    })
    .map(function (produto) {
      return `<option value="${
        produto.id
      }">${escaparHtml(produto.nome)} — ${formatarMoeda(produto.preco)}</option>`;
    })
    .join("");

  linha.innerHTML = `
    <label for="produtoItem${numero}">Produto
      <select id="produtoItem${numero}" class="produto-item-pedido" required>
        <option value="">Selecione um produto</option>
        ${opcoes}
      </select>
    </label>
    <label for="quantidadeItem${numero}">Quantidade
      <input id="quantidadeItem${numero}" class="quantidade-item-pedido" type="number"
             min="1" max="100" value="1" required>
    </label>
    <button type="button" class="remover-item remover-item-pedido" aria-label="Remover item">
      <i data-lucide="trash-2"></i>
    </button>`;

  elementosPedidos.itens.appendChild(linha);

  linha.querySelector("select").value = produtoIdSelecionado || "";
  linha.querySelector("input").value = quantidadeSelecionada || 1;

  linha
    .querySelector("select")
    .addEventListener("change", atualizarFormularioItens);
  linha
    .querySelector("input")
    .addEventListener("input", atualizarTotalNovoPedido);
  linha.querySelector("button").addEventListener("click", function () {
    linha.remove();
    atualizarFormularioItens();
  });

  atualizarFormularioItens();
  atualizarIconesPedidos();
}

function atualizarFormularioItens() {
  const seletores = elementosPedidos.itens.querySelectorAll(
    ".produto-item-pedido"
  );
  const produtosEscolhidos = Array.from(seletores)
    .map(function (seletor) {
      return seletor.value;
    })
    .filter(Boolean);

  seletores.forEach(function (seletor) {
    Array.from(seletor.options).forEach(function (opcao) {
      if (opcao.value) {
        opcao.disabled =
          opcao.value !== seletor.value &&
          produtosEscolhidos.includes(opcao.value);
      }
    });
  });

  const idsDisponiveis = estadoPedidos.produtos
    .filter(function (produto) {
      return produto.disponivel;
    })
    .map(function (produto) {
      return String(produto.id);
    });
  elementosPedidos.adicionarItem.disabled = idsDisponiveis.every(function (id) {
    return produtosEscolhidos.includes(id);
  });
  atualizarTotalNovoPedido();
}

function atualizarTotalNovoPedido() {
  let total = 0;

  elementosPedidos.itens
    .querySelectorAll(".item-pedido-linha")
    .forEach(function (linha) {
      const produtoId = Number(linha.querySelector("select").value);
      const quantidade = Number(linha.querySelector("input").value);
      const produto = estadoPedidos.produtos.find(function (item) {
        return item.id === produtoId;
      });

      if (produto && quantidade > 0) total += produto.preco * quantidade;
    });

  elementosPedidos.totalNovo.textContent = formatarMoeda(total);
}

async function salvarNovoPedido(evento) {
  evento.preventDefault();
  elementosPedidos.erroFormulario.classList.add("escondido");

  try {
    const dados = obterDadosNovoPedido();
    elementosPedidos.salvar.disabled = true;
    elementosPedidos.salvar.textContent = "Salvando...";

    const idEdicao = estadoPedidos.pedidoEmEdicao;
    const pedidoSalvo = await requisicaoApi(
      idEdicao ? `/pedidos/${idEdicao}` : "/pedidos",
      {
        method: idEdicao ? "PUT" : "POST",
        body: JSON.stringify(dados),
      }
    );

    fecharModalPedido();
    limparFiltros();
    estadoPedidos.pedidoSelecionado = idEdicao || pedidoSalvo.id;
    await carregarPedidos();
  } catch (erro) {
    mostrarErroFormulario(erro.message);
  } finally {
    elementosPedidos.salvar.disabled = false;
    elementosPedidos.salvar.innerHTML =
      '<i data-lucide="check"></i>Salvar pedido';
    atualizarIconesPedidos();
  }
}

async function abrirEdicaoPedido(id) {
  const pedido = estadoPedidos.pedidos.find(function (item) {
    return item.id === id;
  });
  if (!pedido) return;

  estadoPedidos.pedidoEmEdicao = id;
  elementosPedidos.formulario.reset();
  elementosPedidos.itens.innerHTML = "";
  elementosPedidos.erroFormulario.classList.add("escondido");
  elementosPedidos.tituloModal.textContent = `Editar pedido #${id}`;
  estadoPedidos.numeroItem = 0;
  fecharMenusAcoes();
  abrirModalPedido();

  if (estadoPedidos.produtos.length === 0) await carregarProdutosDisponiveis();
  if (estadoPedidos.erroProdutos) {
    mostrarErroFormulario(estadoPedidos.erroProdutos);
    return;
  }

  elementosPedidos.nomeCliente.value = pedido.nomeCliente || "";
  elementosPedidos.telefoneCliente.value = pedido.telefoneCliente || "";
  elementosPedidos.dataPedido.value = formatarDataParaInput(pedido.dataPedido);
  elementosPedidos.dataPedido.max = formatarDataParaInput(new Date());
  elementosPedidos.observacao.value = pedido.observacao || "";
  pedido.itensPedido.forEach(function (item) {
    adicionarLinhaItem(item.produtoId, item.quantidade);
  });
  atualizarFormularioItens();
  elementosPedidos.nomeCliente.focus();
}

function obterDadosNovoPedido() {
  const nomeCliente = elementosPedidos.nomeCliente.value.trim();
  const telefoneCliente = elementosPedidos.telefoneCliente.value.trim();
  const dataPedido = elementosPedidos.dataPedido.value;
  const observacao = elementosPedidos.observacao.value.trim();
  const linhas = elementosPedidos.itens.querySelectorAll(".item-pedido-linha");

  if (nomeCliente.length < 2) throw new Error("Informe o nome do cliente.");
  if (!dataPedido || Number.isNaN(new Date(dataPedido).getTime())) {
    throw new Error("Informe uma data válida para o pedido.");
  }
  if (new Date(dataPedido) > new Date()) {
    throw new Error("A data do pedido não pode estar no futuro.");
  }
  if (linhas.length === 0) throw new Error("Adicione pelo menos um produto.");

  const itens = Array.from(linhas).map(function (linha) {
    const produtoId = Number(linha.querySelector("select").value);
    const quantidade = Number(linha.querySelector("input").value);

    if (!produtoId) throw new Error("Selecione um produto em todos os itens.");
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 100) {
      throw new Error("A quantidade deve ser entre 1 e 100.");
    }

    return { produtoId: produtoId, quantidade: quantidade };
  });

  const ids = itens.map(function (item) {
    return item.produtoId;
  });
  if (new Set(ids).size !== ids.length) {
    throw new Error("O mesmo produto não pode aparecer duas vezes.");
  }

  return {
    nomeCliente: nomeCliente,
    telefoneCliente: telefoneCliente || null,
    dataPedido: dataPedido,
    observacao: observacao || null,
    itens: itens,
  };
}

function abrirModalPedido() {
  elementosPedidos.modal.hidden = false;
  elementosPedidos.modal.classList.remove("escondido");
  elementosPedidos.modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-aberto");
}

function fecharModalPedido() {
  elementosPedidos.modal.hidden = true;
  elementosPedidos.modal.classList.add("escondido");
  elementosPedidos.modal.setAttribute("aria-hidden", "true");
  elementosPedidos.erroFormulario.classList.add("escondido");
  document.body.classList.remove("modal-aberto");
}

function mostrarErroFormulario(mensagem) {
  elementosPedidos.erroFormulario.textContent = mensagem;
  elementosPedidos.erroFormulario.classList.remove("escondido");
}

function limparFiltros() {
  estadoPedidos.statusCard = 0;
  estadoPedidos.pagina = 1;
  elementosPedidos.busca.value = "";
  elementosPedidos.buscaGlobal.value = "";
  elementosPedidos.filtroStatus.value = "";
  elementosPedidos.filtroPeriodo.value = "";
  marcarCardSelecionado();
}

function pedidoDentroDoPeriodo(dataPedido, periodo) {
  if (!periodo) return true;

  const data = new Date(dataPedido);
  const agora = new Date();
  const inicio = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  );

  if (periodo === "hoje") return data >= inicio && data <= agora;

  const dias = periodo === "7dias" ? 7 : 30;
  inicio.setDate(inicio.getDate() - (dias - 1));
  return data >= inicio && data <= agora;
}

function textoParaBusca(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataPedido(valor, completa) {
  const data = new Date(valor);
  const opcoes = completa
    ? { dateStyle: "short", timeStyle: "short" }
    : {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
  return data.toLocaleString("pt-BR", opcoes);
}

function formatarDataParaInput(valor) {
  const data = new Date(valor);
  const ajusteFuso = data.getTimezoneOffset() * 60000;
  return new Date(data.getTime() - ajusteFuso).toISOString().slice(0, 16);
}

function escolherImagemProduto(nome, id) {
  const texto = textoParaBusca(nome);
  if (texto.includes("nutella")) return "cookie-nutella.png";
  if (texto.includes("red velvet")) return "cookie-red-velvet.png";
  if (texto.includes("doce de leite")) return "cookie-doce-leite.png";
  if (texto.includes("chocolate")) return "cookie-chocolate.png";

  const imagens = [
    "cookie-classico.png",
    "cookie-nutella.png",
    "cookie-red-velvet.png",
    "cookie-chocolate.png",
    "cookie-doce-leite.png",
  ];
  return imagens[(id - 1) % imagens.length];
}

function escaparHtml(valor) {
  const caracteres = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(valor || "").replace(/[&<>"']/g, function (caractere) {
    return caracteres[caractere];
  });
}

function atualizarIconesPedidos() {
  if (window.lucide) window.lucide.createIcons();
}
