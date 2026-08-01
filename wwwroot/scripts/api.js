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
  } catch {
    throw new Error(
      "Não foi possível conectar com a API. Execute o projeto com dotnet run.",
    );
  }

  if (resposta.status === 204) return null;

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
    let mensagem =
      "Não foi possível acessar a API. Execute o projeto com dotnet run.";

    if (typeof conteudo === "string" && conteudo.trim()) {
      mensagem = conteudo;
    } else if (conteudo && conteudo.title) {
      mensagem = conteudo.title;
    } else if (conteudo && conteudo.mensagem) {
      mensagem = conteudo.mensagem;
    } else if (conteudo && conteudo.errors) {
      mensagem = Object.values(conteudo.errors).flat().join(" ");
    }

    throw new Error(mensagem);
  }

  if (conteudo !== null) return conteudo;
  return texto || null;
}
