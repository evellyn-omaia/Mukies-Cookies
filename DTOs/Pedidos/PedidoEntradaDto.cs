using System.ComponentModel.DataAnnotations;

namespace Mukies_Cookies.DTOs.Pedidos;

public class PedidoEntradaDto
{
    [Required(ErrorMessage = "O nome do cliente é obrigatório.")]
    [StringLength(
        100,
        MinimumLength = 2,
        ErrorMessage = "O nome deve ter entre 2 e 100 caracteres."
    )]
    public string NomeCliente { get; set; } = string.Empty;

    [StringLength(
        20,
        ErrorMessage = "O telefone deve ter no máximo 20 caracteres."
    )]
    public string? TelefoneCliente { get; set; }

    public DateTime? DataPedido { get; set; }

    [StringLength(
        500,
        ErrorMessage = "A observação deve ter no máximo 500 caracteres."
    )]
    public string? Observacao { get; set; }

    [Required(ErrorMessage = "Adicione pelo menos um produto ao pedido.")]
    [MinLength(
        1,
        ErrorMessage = "Adicione pelo menos um produto ao pedido."
    )]
    public List<ItemPedidoEntradaDto> Itens { get; set; } = [];
}
