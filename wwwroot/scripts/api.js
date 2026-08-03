const enderecoApi = "/api";

async function requisicaoApi(caminho, opcoes = {}) {
  let resposta;

  try {
    resposta = await fetch(enderecoApi + caminho, {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",
        ...(opcoes.headers || {}),
      },
    });
  } catch (erro) {
    console.error("Erro de conexão:", erro);

    throw new Error(
      "Não foi possível conectar com a API. Verifique se o projeto está executando.",
    );
  }

  if (resposta.status === 204) {
    return null;
  }

  const texto = await resposta.text();
  const tipoConteudo = resposta.headers.get("content-type") || "";

  let conteudo = null;

  if (texto && tipoConteudo.includes("application/json")) {
    try {
      conteudo = JSON.parse(texto);
    } catch {
      conteudo = null;
    }
  }

  if (!resposta.ok) {
    console.error("Erro retornado pela API:", {
      status: resposta.status,
      caminho: enderecoApi + caminho,
      resposta: texto,
    });

    let mensagem = `Erro ${resposta.status} ao realizar a operação.`;

    if (typeof conteudo === "string" && conteudo.trim()) {
      mensagem = conteudo;
    } else if (conteudo?.title) {
      mensagem = conteudo.title;
    } else if (conteudo?.mensagem) {
      mensagem = conteudo.mensagem;
    } else if (conteudo?.errors) {
      mensagem = Object.values(conteudo.errors).flat().join(" ");
    } else if (texto.trim()) {
      mensagem = texto;
    }

    throw new Error(mensagem);
  }

  if (conteudo !== null) {
    return conteudo;
  }

  return texto || null;
}