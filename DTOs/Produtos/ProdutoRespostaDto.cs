namespace Mukies_Cookies.DTOs.Produtos;

public class ProdutoRespostaDto
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    public decimal Preco { get; set; }

    public bool Disponivel { get; set; }

    public int CategoriaId { get; set; }

    public string NomeCategoria { get; set; } = string.Empty;
}