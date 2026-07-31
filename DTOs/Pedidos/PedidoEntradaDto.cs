using System.ComponentModel.DataAnnotations;

namespace Mukies_Cookies.DTOs.Pedidos;

public class PedidoEntradaDto
{
    [Required(ErrorMessage = "O nome do cliente é obrigatório.")]
    [StringLength(100)]
    public string NomeCliente { get; set; } = string.Empty;

    [StringLength(20)]
    public string? TelefoneCliente { get; set; }

    public DateTime? DataEntrega { get; set; }

    [StringLength(500)]
    public string? Observacao { get; set; }

    [Required(ErrorMessage = "Adicione pelo menos um produto ao pedido.")]
    [MinLength(1, ErrorMessage = "Adicione pelo menos um produto ao pedido.")]
    public List<ItemPedidoEntradaDto> Itens { get; set; } = [];
}