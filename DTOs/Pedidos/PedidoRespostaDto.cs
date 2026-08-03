using Mukies_Cookies.Enumeradores;

namespace Mukies_Cookies.DTOs.Pedidos;

public class PedidoRespostaDto
{
    public int Id { get; set; }

    public string NomeCliente { get; set; } = string.Empty;

    public string? TelefoneCliente { get; set; }

    public DateTime DataPedido { get; set; }

    public StatusPedido Status { get; set; }

    public string? Observacao { get; set; }

    public decimal ValorTotal { get; set; }

    public int QuantidadeTotalItens { get; set; }

    public List<ItemPedidoRespostaDto> ItensPedido { get; set; } = [];
}