using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mukies_Cookies.Context;
using Mukies_Cookies.DTOs.Pedidos;
using Mukies_Cookies.Enumeradores;
using Mukies_Cookies.Models;

namespace Mukies_Cookies.Controller;

[ApiController]
[Route("api/pedidos")]
public class PedidosController : ControllerBase
{
    private readonly ContextBancoDados _contexto;

    public PedidosController(ContextBancoDados contexto)
    {
        _contexto = contexto;
    }

    [HttpGet]
    public async Task<ActionResult> Listar()
    {
        var pedidos = await _contexto.Pedidos
            .AsNoTracking()
            .OrderByDescending(pedido => pedido.DataPedido)
            .Select(pedido => new PedidoRespostaDto
            {
                Id = pedido.Id,
                NomeCliente = pedido.NomeCliente,
                TelefoneCliente = pedido.TelefoneCliente,
                DataPedido = pedido.DataPedido,
                DataEntrega = pedido.DataEntrega,
                Status = pedido.Status,
                Observacao = pedido.Observacao,
                ValorTotal = pedido.ValorTotal,
                QuantidadeTotalItens = pedido.ItensPedido
                    .Sum(item => item.Quantidade)
            })
            .ToListAsync();

        return Ok(pedidos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> BuscarPorId(int id)
    {
        var pedido = await _contexto.Pedidos
            .AsNoTracking()
            .Where(pedido => pedido.Id == id)
            .Select(pedido => new PedidoRespostaDto
            {
                Id = pedido.Id,
                NomeCliente = pedido.NomeCliente,
                TelefoneCliente = pedido.TelefoneCliente,
                DataPedido = pedido.DataPedido,
                DataEntrega = pedido.DataEntrega,
                Status = pedido.Status,
                Observacao = pedido.Observacao,
                ValorTotal = pedido.ValorTotal,
                QuantidadeTotalItens = pedido.ItensPedido
                    .Sum(item => item.Quantidade)
            })
            .FirstOrDefaultAsync();

        if (pedido == null)
        {
            return NotFound("Pedido não encontrado.");
        }

        return Ok(pedido);
    }

    [HttpPost]
    public async Task<ActionResult> Cadastrar(
        PedidoEntradaDto dados)
    {
        var produtosRepetidos = dados.Itens
            .GroupBy(item => item.ProdutoId)
            .Any(grupo => grupo.Count() > 1);

        if (produtosRepetidos)
        {
            return BadRequest(
                "O mesmo produto não pode aparecer duas vezes no pedido."
            );
        }

        var produtosIds = dados.Itens
            .Select(item => item.ProdutoId)
            .ToList();

        var produtos = await _contexto.Produtos
            .Where(produto =>
                produtosIds.Contains(produto.Id) &&
                produto.Disponivel)
            .ToListAsync();

        if (produtos.Count != produtosIds.Count)
        {
            return BadRequest(
                "Um ou mais produtos não existem ou estão indisponíveis."
            );
        }

        var pedido = new Pedido
        {
            NomeCliente = dados.NomeCliente,
            TelefoneCliente = dados.TelefoneCliente,
            DataPedido = DateTime.Now,
            DataEntrega = dados.DataEntrega,
            Observacao = dados.Observacao,
            Status = StatusPedido.Pendente
        };

        foreach (var itemRecebido in dados.Itens)
        {
            var produto = produtos.First(produto =>
                produto.Id == itemRecebido.ProdutoId);

            pedido.ItensPedido.Add(new ItemPedido
            {
                ProdutoId = produto.Id,
                Quantidade = itemRecebido.Quantidade,
                PrecoUnitario = produto.Preco
            });
        }

        pedido.ValorTotal = pedido.ItensPedido.Sum(item =>
            item.Quantidade * item.PrecoUnitario);

        _contexto.Pedidos.Add(pedido);
        await _contexto.SaveChangesAsync();

        var resposta = new PedidoRespostaDto
        {
            Id = pedido.Id,
            NomeCliente = pedido.NomeCliente,
            TelefoneCliente = pedido.TelefoneCliente,
            DataPedido = pedido.DataPedido,
            DataEntrega = pedido.DataEntrega,
            Status = pedido.Status,
            Observacao = pedido.Observacao,
            ValorTotal = pedido.ValorTotal,
            QuantidadeTotalItens = pedido.ItensPedido
                .Sum(item => item.Quantidade)
        };

        return CreatedAtAction(
            nameof(BuscarPorId),
            new { id = pedido.Id },
            resposta
        );
    }
}