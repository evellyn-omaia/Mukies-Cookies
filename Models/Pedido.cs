using Mukies_Cookies.Enums;

namespace Mukies_Cookies.Models;

public class Pedido
{
    public int Id { get; set; }

    public string NomeCliente { get; set; } = string.Empty;

    public string? TelefoneCliente { get; set; }

    public DateTime DataPedido { get; set; } = DateTime.Now;

    public DateTime? DataEntrega { get; set; }

    public StatusPedido Status { get; set; }
        = StatusPedido.Pendente;

    public string? Observacao { get; set; }

    public decimal ValorTotal { get; set; }

    public ICollection<ItemPedido> ItensPedido { get; set; }
        = new List<ItemPedido>();
}