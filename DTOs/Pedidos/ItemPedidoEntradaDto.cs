using System.ComponentModel.DataAnnotations;

namespace Mukies_Cookies.DTOs.Pedidos;

public class ItemPedidoEntradaDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Informe um produto válido.")]
    public int ProdutoId { get; set; }

    [Range(1, 100, ErrorMessage = "A quantidade deve ser entre 1 e 100.")]
    public int Quantidade { get; set; }
}