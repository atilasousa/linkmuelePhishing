import {
  getDomainStats,
  searchForDomainInGoogle,
} from "../../src/utils/virustotalAnalisys";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: "resultado fake" }),
  })
);

describe("Testes para getDomainStats", () => {
  it("deve retornar os dados do domínio se a resposta for bem-sucedida", async () => {
    const domain = "example.com";
    const result = await getDomainStats(domain);
    expect(result).toEqual("resultado fake");
  });

  it("deve retornar um objeto vazio se a resposta não contiver dados", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      })
    );

    const domain = "example.com";
    const result = await getDomainStats(domain);
    expect(result).toEqual({});
  });

  it("deve retornar um objeto vazio em caso de erro na solicitação", async () => {
    global.fetch = jest.fn(() => Promise.reject("Erro simulado"));

    const domain = "example.com";
    const result = await getDomainStats(domain);
    expect(result).toEqual({});
  });
});

describe("Testes para searchForDomainInGoogle", () => {
  it("deve retornar true se o domínio for encontrado nos resultados da pesquisa do Google", async () => {
    const domain = "example.com";

    const googleSearchResult = {
      items: [
        { displayLink: "example.com" },
        { displayLink: "outro-site.com" },
      ],
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(googleSearchResult),
      })
    );

    const result = await searchForDomainInGoogle(domain);
    expect(result).toBe(true);
  });

  it("deve retornar false se o domínio não for encontrado nos resultados da pesquisa do Google", async () => {
    const domain = "example.com";

    const googleSearchResult = {
      items: [{ displayLink: "outro-site.com" }],
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(googleSearchResult),
      })
    );

    const result = await searchForDomainInGoogle(domain);
    expect(result).toBe(false);
  });

  it("deve retornar false em caso de erro na solicitação", async () => {
    global.fetch = jest.fn(() => Promise.reject("Erro simulado"));

    const domain = "example.com";
    const result = await searchForDomainInGoogle(domain);
    expect(result).toBe(false);
  });
});
