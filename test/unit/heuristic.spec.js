import {
  checkCanonical,
  searchForPrivacyAndTermsLinks,
} from "../../src/utils/heuristAnalisys";

describe("Testes para checkCanonical", () => {
  it('deve retornar true se um elemento "canonical" estiver presente e apontar para o mesmo hostname', () => {
    const mockCanonicalElement = document.createElement("link");
    mockCanonicalElement.setAttribute("rel", "canonical");
    mockCanonicalElement.setAttribute("href", "https://example.com");
    document.querySelector = jest.fn(() => mockCanonicalElement);

    const result = checkCanonical();
    expect(result).toBe(true);
  });

  it('deve retornar false se um elemento "canonical" estiver presente e apontar para um hostname diferente', () => {
    const mockCanonicalElement = document.createElement("link");
    mockCanonicalElement.setAttribute("rel", "canonical");
    mockCanonicalElement.setAttribute("href", "https://example.com");
    document.querySelector = jest.fn(() => mockCanonicalElement);

    global.window = Object.create(window);
    Object.defineProperty(window, "location", {
      value: { hostname: "differenthostname.com" },
    });

    const result = checkCanonical();
    expect(result).toBe(false);
  });

  it('deve retornar null se nenhum elemento "canonical" estiver presente', () => {
    document.querySelector = jest.fn(() => null);

    const result = checkCanonical();
    expect(result).toBe(null);
  });
});

describe("Testes para searchForPrivacyAndTermsLinks", () => {
  it("deve retornar true se encontrar links para política de privacidade e termos de uso", () => {
    document.body.innerHTML = `
      <a href="/privacypolicy">Política de Privacidade</a>
      <a href="/termsofservice">Termos de Serviço</a>
    `;

    const result = searchForPrivacyAndTermsLinks();
    expect(result).toEqual({
      foundPrivacyPolicy: true,
      foundTermsOfService: true,
    });
  });

  it("deve retornar false se não encontrar links para política de privacidade e termos de uso", () => {
    document.body.innerHTML = `
      <a href="/aboutus">Sobre Nós</a>
      <a href="/contact">Contato</a>
    `;

    const result = searchForPrivacyAndTermsLinks();
    expect(result).toEqual({
      foundPrivacyPolicy: false,
      foundTermsOfService: false,
    });
  });
});
