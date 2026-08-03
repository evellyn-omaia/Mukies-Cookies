using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mukies_Cookies.Context;
using Mukies_Cookies.DTOs.Produtos;
using Mukies_Cookies.Models;

namespace Mukies_Cookies.Controladores;

[ApiController]
[Route("api/produtos")]
public class ProdutosController : ControllerBase
{
    private readonly ContextBancoDados _contexto;

    public ProdutosController(ContextBancoDados contexto)
    {
        _contexto = contexto;
    }

    // GET: api/produtos
    // Também permite filtros por Query String
    [HttpGet]
    public async Task<ActionResult> Listar(
        [FromQuery] string? nome,
        [FromQuery] int? categoriaId,
        [FromQuery] bool? disponivel)
    {
        var consulta = _contexto.Produtos
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(nome))
        {
            consulta = consulta.Where(produto =>
                produto.Nome.Contains(nome));
        }

        if (categoriaId.HasValue)
        {
            consulta = consulta.Where(produto =>
                produto.CategoriaId == categoriaId);
        }

        if (disponivel.HasValue)
        {
            consulta = consulta.Where(produto =>
                produto.Disponivel == disponivel);
        }

        var produtos = await consulta
            .Select(produto => new ProdutoRespostaDto
            {
                Id = produto.Id,
                Nome = produto.Nome,
                Descricao = produto.Descricao,
                Preco = produto.Preco,
                Disponivel = produto.Disponivel,
                CategoriaId = produto.CategoriaId,
                NomeCategoria = produto.Categoria.Nome
            })
            .ToListAsync();

        return Ok(produtos);
    }

    // GET: api/produtos/1
    [HttpGet("{id}")]
    public async Task<ActionResult> BuscarPorId(int id)
    {
        var produto = await _contexto.Produtos
            .AsNoTracking()
            .Where(produto => produto.Id == id)
            .Select(produto => new ProdutoRespostaDto
            {
                Id = produto.Id,
                Nome = produto.Nome,
                Descricao = produto.Descricao,
                Preco = produto.Preco,
                Disponivel = produto.Disponivel,
                CategoriaId = produto.CategoriaId,
                NomeCategoria = produto.Categoria.Nome
            })
            .FirstOrDefaultAsync();

        if (produto == null)
        {
            return NotFound("Produto não encontrado.");
        }

        return Ok(produto);
    }

    // POST: api/produtos
    [HttpPost]
    public async Task<ActionResult> Cadastrar(
        ProdutoEntradaDto dados)
    {
        var categoria = await _contexto.Categorias
            .AsNoTracking()
            .FirstOrDefaultAsync(categoria =>
                categoria.Id == dados.CategoriaId);

        if (categoria == null)
        {
            return BadRequest("A categoria informada não existe.");
        }

        var produto = new Produto
        {
            Nome = dados.Nome,
            Descricao = dados.Descricao,
            Preco = dados.Preco,
            Disponivel = dados.Disponivel,
            CategoriaId = dados.CategoriaId
        };

        _contexto.Produtos.Add(produto);
        await _contexto.SaveChangesAsync();

        var resposta = new ProdutoRespostaDto
        {
            Id = produto.Id,
            Nome = produto.Nome,
            Descricao = produto.Descricao,
            Preco = produto.Preco,
            Disponivel = produto.Disponivel,
            CategoriaId = produto.CategoriaId,
            NomeCategoria = categoria.Nome
        };

        return CreatedAtAction(
            nameof(BuscarPorId),
            new { id = produto.Id },
            resposta
        );
    }

    // PUT: api/produtos/1
    [HttpPut("{id}")]
    public async Task<ActionResult> Atualizar(
        int id,
        ProdutoEntradaDto dados)
    {
        var produto = await _contexto.Produtos
            .FirstOrDefaultAsync(produto => produto.Id == id);

        if (produto == null)
        {
            return NotFound("Produto não encontrado.");
        }

        var categoria = await _contexto.Categorias
            .AsNoTracking()
            .FirstOrDefaultAsync(categoria =>
                categoria.Id == dados.CategoriaId);

        if (categoria == null)
        {
            return BadRequest("A categoria informada não existe.");
        }

        produto.Nome = dados.Nome;
        produto.Descricao = dados.Descricao;
        produto.Preco = dados.Preco;
        produto.Disponivel = dados.Disponivel;
        produto.CategoriaId = dados.CategoriaId;

        await _contexto.SaveChangesAsync();

        var resposta = new ProdutoRespostaDto
        {
            Id = produto.Id,
            Nome = produto.Nome,
            Descricao = produto.Descricao,
            Preco = produto.Preco,
            Disponivel = produto.Disponivel,
            CategoriaId = produto.CategoriaId,
            NomeCategoria = categoria.Nome
        };

        return Ok(resposta);
    }

    // DELETE: api/produtos/1
    [HttpDelete("{id}")]
    public async Task<ActionResult> Excluir(int id)
    {
        var produto = await _contexto.Produtos
            .FirstOrDefaultAsync(produto => produto.Id == id);

        if (produto == null)
        {
            return NotFound("Produto não encontrado.");
        }

        _contexto.Produtos.Remove(produto);
        await _contexto.SaveChangesAsync();

        return NoContent();
    }
}