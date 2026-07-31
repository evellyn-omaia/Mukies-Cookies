const listaProdutos =
    document.getElementById("listaProdutos");

const mensagemCarregamento =
    document.getElementById("mensagemCarregamento");

const mensagemErro =
    document.getElementById("mensagemErro");

const quantidadeProdutos =
    document.getElementById("quantidadeProdutos");

const buscaNome =
    document.getElementById("buscaNome");

const filtroCategoria =
    document.getElementById("filtroCategoria");

const filtroDisponibilidade =
    document.getElementById("filtroDisponibilidade");

const botaoNovoProduto =
    document.getElementById("botaoNovoProduto");

const modalProduto =
    document.getElementById("modalProduto");

const botaoFecharModal =
    document.getElementById("botaoFecharModal");

const botaoCancelar =
    document.getElementById("botaoCancelar");

const formularioProduto =
    document.getElementById("formularioProduto");

const tituloModal =
    document.getElementById("tituloModal");

const produtoId =
    document.getElementById("produtoId");

const nomeProduto =
    document.getElementById("nomeProduto");

const descricaoProduto =
    document.getElementById("descricaoProduto");

const precoProduto =
    document.getElementById("precoProduto");

const categoriaProduto =
    document.getElementById("categoriaProduto");

const disponivelProduto =
    document.getElementById("disponivelProduto");

const erroFormulario =
    document.getElementById("erroFormulario");

const botaoSalvar =
    document.getElementById("botaoSalvar");

let tempoBusca;

document.addEventListener("DOMContentLoaded", async () => {
    await carregarCategorias();
    await carregarProdutos();
});

async function carregarCategorias() {
    try {
        const categorias =
            await requisicaoApi("/categorias");

        filtroCategoria.innerHTML = `
            <option value="">
                Todas as categorias
            </option>
        `;

        categoriaProduto.innerHTML = `
            <option value="">
                Selecione
            </option>
        `;

        categorias.forEach(categoria => {
            const opcaoFiltro =
                document.createElement("option");

            opcaoFiltro.value = categoria.id;
            opcaoFiltro.textContent = categoria.nome;

            filtroCategoria.appendChild(opcaoFiltro);

            const opcaoFormulario =
                document.createElement("option");

            opcaoFormulario.value = categoria.id;
            opcaoFormulario.textContent = categoria.nome;

            categoriaProduto.appendChild(
                opcaoFormulario
            );
        });
    } catch (erro) {
        mostrarErro(
            "Não foi possível carregar as categorias."
        );
    }
}

async function carregarProdutos() {
    mostrarCarregamento();

    try {
        const parametros = new URLSearchParams();

        const nome = buscaNome.value.trim();
        const categoriaId = filtroCategoria.value;
        const disponivel =
            filtroDisponibilidade.value;

        if (nome) {
            parametros.append("nome", nome);
        }

        if (categoriaId) {
            parametros.append(
                "categoriaId",
                categoriaId
            );
        }

        if (disponivel) {
            parametros.append(
                "disponivel",
                disponivel
            );
        }

        const consulta = parametros.toString();

        const caminho = consulta
            ? `/produtos?${consulta}`
            : "/produtos";

        const produtos =
            await requisicaoApi(caminho);

        exibirProdutos(produtos);
    } catch (erro) {
        mostrarErro(erro.message);
    }
}

function exibirProdutos(produtos) {
    mensagemCarregamento.classList.add("escondido");
    mensagemErro.classList.add("escondido");

    listaProdutos.innerHTML = "";

    quantidadeProdutos.textContent =
        `${produtos.length} ${
            produtos.length === 1
                ? "produto"
                : "produtos"
        }`;

    if (produtos.length === 0) {
        listaProdutos.innerHTML = `
            <div class="mensagem">
                Nenhum produto encontrado.
            </div>
        `;

        return;
    }

    produtos.forEach(produto => {
        const cartao = document.createElement("article");

        cartao.className = "cartao-produto";

        const classeDisponibilidade =
            produto.disponivel
                ? "disponivel"
                : "indisponivel";

        const textoDisponibilidade =
            produto.disponivel
                ? "Disponível"
                : "Indisponível";

        cartao.innerHTML = `
            <div class="cartao-topo">
                <h4>${escaparTexto(produto.nome)}</h4>

                <span
                    class="selo ${classeDisponibilidade}"
                >
                    ${textoDisponibilidade}
                </span>
            </div>

            <span class="categoria-produto">
                ${escaparTexto(produto.nomeCategoria)}
            </span>

            <p class="descricao-produto">
                ${
                    produto.descricao
                        ? escaparTexto(produto.descricao)
                        : "Sem descrição cadastrada."
                }
            </p>

            <div class="rodape-produto">
                <strong class="preco-produto">
                    ${formatarMoeda(produto.preco)}
                </strong>

                <div class="acoes-produto">
                    <button
                        class="botao-acao"
                        type="button"
                        data-acao="editar"
                        data-id="${produto.id}"
                    >
                        Editar
                    </button>

                    <button
                        class="botao-acao excluir"
                        type="button"
                        data-acao="excluir"
                        data-id="${produto.id}"
                        data-nome="${escaparAtributo(
                            produto.nome
                        )}"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        `;

        listaProdutos.appendChild(cartao);
    });
}

function mostrarCarregamento() {
    listaProdutos.innerHTML = "";
    mensagemErro.classList.add("escondido");
    mensagemCarregamento.classList.remove("escondido");
}

function mostrarErro(mensagem) {
    listaProdutos.innerHTML = "";
    mensagemCarregamento.classList.add("escondido");

    mensagemErro.textContent = mensagem;
    mensagemErro.classList.remove("escondido");
}

function abrirModalNovoProduto() {
    formularioProduto.reset();

    produtoId.value = "";
    disponivelProduto.checked = true;

    tituloModal.textContent = "Novo produto";

    erroFormulario.classList.add("escondido");

    modalProduto.classList.remove("escondido");
}

async function abrirModalEdicao(id) {
    erroFormulario.classList.add("escondido");

    try {
        const produto =
            await requisicaoApi(`/produtos/${id}`);

        produtoId.value = produto.id;
        nomeProduto.value = produto.nome;
        descricaoProduto.value =
            produto.descricao ?? "";
        precoProduto.value = produto.preco;
        categoriaProduto.value =
            produto.categoriaId;
        disponivelProduto.checked =
            produto.disponivel;

        tituloModal.textContent = "Editar produto";

        modalProduto.classList.remove("escondido");
    } catch (erro) {
        alert(erro.message);
    }
}

function fecharModal() {
    modalProduto.classList.add("escondido");
    formularioProduto.reset();
    produtoId.value = "";
}

async function salvarProduto(evento) {
    evento.preventDefault();

    erroFormulario.classList.add("escondido");

    const id = produtoId.value;

    const dados = {
        nome: nomeProduto.value.trim(),
        descricao:
            descricaoProduto.value.trim() || null,
        preco: Number(precoProduto.value),
        disponivel: disponivelProduto.checked,
        categoriaId: Number(
            categoriaProduto.value
        )
    };

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    try {
        if (id) {
            await requisicaoApi(`/produtos/${id}`, {
                method: "PUT",
                body: JSON.stringify(dados)
            });
        } else {
            await requisicaoApi("/produtos", {
                method: "POST",
                body: JSON.stringify(dados)
            });
        }

        fecharModal();
        await carregarProdutos();
    } catch (erro) {
        erroFormulario.textContent = erro.message;
        erroFormulario.classList.remove("escondido");
    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Salvar produto";
    }
}

async function excluirProduto(id, nome) {
    const confirmou = confirm(
        `Deseja realmente excluir o produto "${nome}"?`
    );

    if (!confirmou) {
        return;
    }

    try {
        await requisicaoApi(`/produtos/${id}`, {
            method: "DELETE"
        });

        await carregarProdutos();
    } catch (erro) {
        alert(erro.message);
    }
}

buscaNome.addEventListener("input", () => {
    clearTimeout(tempoBusca);

    tempoBusca = setTimeout(() => {
        carregarProdutos();
    }, 400);
});

filtroCategoria.addEventListener(
    "change",
    carregarProdutos
);

filtroDisponibilidade.addEventListener(
    "change",
    carregarProdutos
);

botaoNovoProduto.addEventListener(
    "click",
    abrirModalNovoProduto
);

botaoFecharModal.addEventListener(
    "click",
    fecharModal
);

botaoCancelar.addEventListener(
    "click",
    fecharModal
);

formularioProduto.addEventListener(
    "submit",
    salvarProduto
);

listaProdutos.addEventListener("click", evento => {
    const botao = evento.target.closest(
        "[data-acao]"
    );

    if (!botao) {
        return;
    }

    const id = botao.dataset.id;
    const acao = botao.dataset.acao;

    if (acao === "editar") {
        abrirModalEdicao(id);
    }

    if (acao === "excluir") {
        excluirProduto(
            id,
            botao.dataset.nome
        );
    }
});

modalProduto.addEventListener("click", evento => {
    if (evento.target === modalProduto) {
        fecharModal();
    }
});

document.addEventListener("keydown", evento => {
    if (
        evento.key === "Escape" &&
        !modalProduto.classList.contains("escondido")
    ) {
        fecharModal();
    }
});

function formatarMoeda(valor) {
    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

function escaparTexto(texto) {
    const elemento = document.createElement("div");
    elemento.textContent = texto ?? "";

    return elemento.innerHTML;
}

function escaparAtributo(texto) {
    return escaparTexto(texto)
        .replaceAll('"', "&quot;");
}