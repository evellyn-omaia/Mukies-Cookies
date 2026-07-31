const enderecoApi = "/api";

async function requisicaoApi(caminho, opcoes = {}) {
    const resposta = await fetch(`${enderecoApi}${caminho}`, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json",
            ...opcoes.headers
        }
    });

    if (resposta.status === 204) {
        return null;
    }

    const conteudo = await resposta
        .json()
        .catch(() => null);

    if (!resposta.ok) {
        let mensagem =
            "Não foi possível concluir a operação.";

        if (typeof conteudo === "string") {
            mensagem = conteudo;
        } else if (conteudo?.title) {
            mensagem = conteudo.title;
        } else if (conteudo?.mensagem) {
            mensagem = conteudo.mensagem;
        } else if (conteudo?.errors) {
            const erros = Object.values(conteudo.errors)
                .flat();

            mensagem = erros.join(" ");
        }

        throw new Error(mensagem);
    }

    return conteudo;
}