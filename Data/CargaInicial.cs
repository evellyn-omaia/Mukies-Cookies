using Microsoft.EntityFrameworkCore;
using Mukies_Cookies.Models;

namespace Mukies_Cookies.Data;

public static class CargaInicial
{
    public static void Adicionar(ModelBuilder construtor)
    {
        construtor.Entity<Categoria>().HasData(
            new Categoria
            {
                Id = 1,
                Nome = "Tradicional",
                Descricao = "Cookies tradicionais."
            },
            new Categoria
            {
                Id = 2,
                Nome = "Recheado",
                Descricao = "Cookies com recheio."
            },
            new Categoria
            {
                Id = 3,
                Nome = "Especial",
                Descricao = "Cookies com sabores especiais."
            }
        );

        construtor.Entity<Produto>().HasData(
            new Produto
            {
                Id = 1,
                Nome = "Cookie Clássico",
                Descricao = "Cookie com gotas de chocolate.",
                Preco = 8.50m,
                Disponivel = true,
                CategoriaId = 1
            },
            new Produto
            {
                Id = 2,
                Nome = "Cookie de Nutella",
                Descricao = "Cookie recheado com Nutella.",
                Preco = 10.90m,
                Disponivel = true,
                CategoriaId = 2
            },
            new Produto
            {
                Id = 3,
                Nome = "Cookie Red Velvet",
                Descricao = "Cookie com chocolate branco.",
                Preco = 10.50m,
                Disponivel = true,
                CategoriaId = 3
            }
        );
    }
}