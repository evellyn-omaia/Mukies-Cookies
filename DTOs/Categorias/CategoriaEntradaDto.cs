using System.ComponentModel.DataAnnotations;

namespace Mukies_Cookies.DTOs.Categorias;

public class CategoriaEntradaDto
{
    [Required(ErrorMessage = "O nome da categoria é obrigatório.")]
    [StringLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
    public string Nome { get; set; } = string.Empty;

    [StringLength(300, ErrorMessage = "A descrição deve ter no máximo 300 caracteres.")]
    public string? Descricao { get; set; }
}