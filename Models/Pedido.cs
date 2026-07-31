using Mukies_Cookies.Enumeradores;

namespace Mukies_Cookies.Models;

public class Pedido
{
    public int Id { get; set; }

    public string NomeCliente { get; set; } = string.Empty;

    public string? TelefoneCliente { get; set; }

    public DateTime DataPedido { get; set; }

    public StatusPedido Status { get; set; }
        = StatusPedido.AguardandoPagamento;

    public string? Observacao { get; set; }

    public decimal ValorTotal { get; set; }

    public ICollection<ItemPedido> ItensPedido { get; set; } = [];
}