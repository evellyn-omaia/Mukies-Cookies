using System.ComponentModel.DataAnnotations;
using Mukies_Cookies.Enumeradores;

namespace Mukies_Cookies.DTOs.Pedidos;

public class StatusPedidoEntradaDto
{
    [EnumDataType(typeof(StatusPedido), ErrorMessage = "Status inválido.")]
    public StatusPedido Status { get; set; }
}