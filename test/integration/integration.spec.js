import {
  getDomainStats,
  searchForDomainInGoogle,
} from "../../src/utils/virustotalAnalisys";

describe("Testes de Integração para a Extensão de Navegador", () => {
  it("getDomainStats deve fazer uma solicitação à API do VirusTotal e retornar dados válidos", async () => {
    const domain = "exemplo.com";
    const result = await getDomainStats(domain);

    expect(result).toBeDefined();
    expect(result).toHaveProperty("detecoes", expect.any(Number));
    expect(result).toHaveProperty("nomeDominio", domain);
  });

  it("searchForDomainInGoogle deve procurar o domínio no Google e retornar um resultado válido", async () => {
    const domain = "exemplo.com";
    const result = await searchForDomainInGoogle(domain);

    expect(result).toBeDefined();
    expect(typeof result).toBe("boolean");
  });
});
