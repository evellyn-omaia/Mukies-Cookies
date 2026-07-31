using System.ComponentModel.DataAnnotations;

namespace Mukies_Cookies.DTOs.Produtos;

public class ProdutoEntradaDto
{
    [Required(ErrorMessage = "O nome do produto é obrigatório.")]
    [StringLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
    public string Nome { get; set; } = string.Empty;

    [StringLength(300, ErrorMessage = "A descrição deve ter no máximo 300 caracteres.")]
    public string? Descricao { get; set; }

    [Range(0.01, 9999, ErrorMessage = "O preço deve ser maior que zero.")]
    public decimal Preco { get; set; }

    public bool Disponivel { get; set; } = true;

    [Range(1, int.MaxValue, ErrorMessage = "Informe uma categoria válida.")]
    public int CategoriaId { get; set; }
}