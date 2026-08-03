namespace Mukies_Cookies.Models;

public class Produto
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    public decimal Preco { get; set; }

    public bool Disponivel { get; set; } = true;

    public int CategoriaId { get; set; }

    public Categoria Categoria { get; set; } = null!;

    public List<ItemPedido> ItensPedido { get; set; }
        = new List<ItemPedido>();
}