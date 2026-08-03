using Microsoft.EntityFrameworkCore;
using Mukies_Cookies.Models;
using Mukies_Cookies.Data;

namespace Mukies_Cookies.Context;

public class ContextBancoDados : DbContext
{
    public ContextBancoDados(
        DbContextOptions<ContextBancoDados> opcoes)
        : base(opcoes)
    {
    }

    public DbSet<Categoria> Categorias
        => Set<Categoria>();

    public DbSet<Produto> Produtos
        => Set<Produto>();

    public DbSet<Pedido> Pedidos
        => Set<Pedido>();

    public DbSet<ItemPedido> ItensPedido
        => Set<ItemPedido>();

    protected override void OnModelCreating(
        ModelBuilder construtor)
    {
        base.OnModelCreating(construtor);

        construtor.Entity<ItemPedido>()
            .HasKey(item => new
            {
                item.PedidoId,
                item.ProdutoId
            });

        construtor.Entity<Produto>()
            .Property(produto => produto.Preco)
            .HasPrecision(10, 2);

        construtor.Entity<Pedido>()
            .Property(pedido => pedido.ValorTotal)
            .HasPrecision(10, 2);

        construtor.Entity<ItemPedido>()
            .Property(item => item.PrecoUnitario)
            .HasPrecision(10, 2);

        CargaInicial.Adicionar(construtor);
    }
}