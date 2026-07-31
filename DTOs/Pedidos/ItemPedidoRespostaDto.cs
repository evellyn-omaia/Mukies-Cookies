namespace Mukies_Cookies.DTOs.Pedidos;

public class ItemPedidoRespostaDto
{
    public int ProdutoId { get; set; }

    public string NomeProduto { get; set; } = string.Empty;

    public int Quantidade { get; set; }

    public decimal PrecoUnitario { get; set; }

    public decimal Subtotal { get; set; }
}