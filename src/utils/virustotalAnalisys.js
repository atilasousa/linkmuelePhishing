import { virustotalOptions } from "../plugins/virustotal";
import { googleOptions } from "../plugins/googleSearchApi";

export const getDomainStats = async (domain) => {
  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${domain}`,
      virustotalOptions
    );

    const responseData = await response.json();

    if (responseData.data) {
      console.log(responseData.data);
      return responseData.data;
    } else {
      return {};
    }
  } catch (err) {
    console.error(err);
    return {};
  }
};

export const searchForDomainInGoogle = async (domain) => {
  const url = `https://www.googleapis.com/customsearch/v1?q=${domain}&key=${googleOptions.key}&cx=${googleOptions.cx}`;
  let existInGoogleSearch = null;

  await fetch(url)
    .then((response) => response.json())
    .then((data) => {
      existInGoogleSearch =
        data.items?.find((el) => el.displayLink === domain) || undefined;
    })
    .catch((error) => {
      console.error("Erro na pesquisa:", error);
    });

  return existInGoogleSearch !== undefined;
};
