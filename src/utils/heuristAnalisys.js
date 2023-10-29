export const checkDomainCreationDateIsMoreThanAYear = (domainDate) => {
  if (!domainDate) {
    return null;
  }

  const newDate = Date.now();
  const dateDiffMS = newDate - domainDate;
  const dateDiffYear = dateDiffMS / (1000 * 60 * 60 * 24);

  return dateDiffYear < 365;
};

export const checkSSLCertificade = () => {
  if (window.location.protocol === "https:") {
    return true;
  }
  return false;
};

export const analyzeLastAnalisys = async (analisys) => {
  console.log(analisys);
};

export const checkCanonical = () => {
  const canonicalElement = document.querySelector('link[rel="canonical"]');

  if (canonicalElement) {
    const canonicalURL = canonicalElement.getAttribute("href");
    const canonicalHostname = new URL(canonicalURL).hostname;
    const currentHostname = window.location.hostname;

    return canonicalHostname === currentHostname;
  }

  return null;
};

export const searchForPrivacyAndTermsLinks = () => {
  const foundPrivacyPolicy = Array.from(
    document.querySelectorAll("a, ul, ol")
  ).some((element) => {
    const text = element.innerText.toLowerCase();
    const href = element.getAttribute("href");
    return (
      text.includes("privacy policy") ||
      text.includes("privacy notice") ||
      href.includes("privacypolicy")
    );
  });

  const foundTermsOfService = Array.from(
    document.querySelectorAll("a, ul, ol")
  ).some((element) => {
    const text = element.innerText.toLowerCase();
    const href = element.getAttribute("href");
    return (
      text.includes("terms of service") ||
      text.includes("terms and conditions") ||
      href.includes("termsofservice")
    );
  });

  return { foundPrivacyPolicy, foundTermsOfService };
};
