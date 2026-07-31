namespace Mukies_Cookies.Models;

public class ItemPedido
{
    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    public int ProdutoId { get; set; }

    public Produto Produto { get; set; } = null!;

    public int Quantidade { get; set; }

    public decimal PrecoUnitario { get; set; }
}