using Microsoft.EntityFrameworkCore;
using Mukies_Cookies.Context;

var construtor = WebApplication.CreateBuilder(args);

construtor.Services.AddControllers();

var conexao = construtor.Configuration
    .GetConnectionString("ConexaoPadrao");

construtor.Services.AddDbContext<ContextBancoDados>(
    opcoes => opcoes.UseSqlServer(conexao)
);

construtor.Services.AddEndpointsApiExplorer();
construtor.Services.AddSwaggerGen();

var aplicacao = construtor.Build();

if (aplicacao.Environment.IsDevelopment())
{
    aplicacao.UseSwagger();
    aplicacao.UseSwaggerUI();
}

aplicacao.UseHttpsRedirection();

aplicacao.UseAuthorization();

aplicacao.UseDefaultFiles();
aplicacao.UseStaticFiles();

aplicacao.MapControllers();

aplicacao.Run();