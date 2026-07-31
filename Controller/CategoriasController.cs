using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mukies_Cookies.Context;
using Mukies_Cookies.DTOs.Categorias;
using Mukies_Cookies.Models;

namespace Mukies_Cookies.Controller;

[ApiController]
[Route("api/categorias")]
public class CategoriasController : ControllerBase
{
    private readonly ContextBancoDados _contexto;

    public CategoriasController(ContextBancoDados contexto)
    {
        _contexto = contexto;
    }

    [HttpGet]
    public async Task<ActionResult> Listar()
    {
        var categorias = await _contexto.Categorias
            .AsNoTracking()
            .Select(categoria => new CategoriaRespostaDto
            {
                Id = categoria.Id,
                Nome = categoria.Nome,
                Descricao = categoria.Descricao
            })
            .ToListAsync();

        return Ok(categorias);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> BuscarPorId(int id)
    {
        var categoria = await _contexto.Categorias
            .AsNoTracking()
            .Where(categoria => categoria.Id == id)
            .Select(categoria => new CategoriaRespostaDto
            {
                Id = categoria.Id,
                Nome = categoria.Nome,
                Descricao = categoria.Descricao
            })
            .FirstOrDefaultAsync();

        if (categoria == null)
        {
            return NotFound("Categoria não encontrada.");
        }

        return Ok(categoria);
    }

    [HttpPost]
    public async Task<ActionResult> Cadastrar(
        CategoriaEntradaDto dados)
    {
        var nomeJaExiste = await _contexto.Categorias
            .AnyAsync(categoria => categoria.Nome == dados.Nome);

        if (nomeJaExiste)
        {
            return BadRequest("Já existe uma categoria com esse nome.");
        }

        var categoria = new Categoria
        {
            Nome = dados.Nome,
            Descricao = dados.Descricao
        };

        _contexto.Categorias.Add(categoria);
        await _contexto.SaveChangesAsync();

        var resposta = new CategoriaRespostaDto
        {
            Id = categoria.Id,
            Nome = categoria.Nome,
            Descricao = categoria.Descricao
        };

        return CreatedAtAction(
            nameof(BuscarPorId),
            new { id = categoria.Id },
            resposta
        );
    }
}