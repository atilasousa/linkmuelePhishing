import {
  optionsVirusTotalPost,
  optionsVirusTotalGet,
} from "../plugins/virustotal";

export const getUrlLinkId = async (url) => {
  const response = await fetch(
    "https://www.virustotal.com/api/v3/urls",
    optionsVirusTotalPost(url)
  );

  const { data, error } = await response.json();

  if (error) {
    return;
  }

  return data.links.self;
};

export const getUrlStats = async (linkId) => {
  const response = await fetch(linkId, optionsVirusTotalGet);

  const { data, error } = await response.json();

  if (error) {
    console.log("error", error);
    return;
  }

  if (!data?.attributes?.results) {
    console.log("nao tem results");
    return;
  }

  const dataList = Object.entries(data?.attributes?.results);
  const urlStats = data?.attributes?.stats;

  const harmless = urlStats.harmless;
  const malicious = urlStats.malicious;
  const suspicious = urlStats.suspicious;
  const timeout = urlStats.timeout;

  if (!harmless && !malicious && !suspicious && !timeout) {
    console.log("nao tem stats");
    return;
  }

  const filterData = (category) =>
    Object.fromEntries(
      dataList.filter(([_, { result }]) =>
        result.toLowerCase().includes(category)
      )
    );

  return {
    urlStats,
    filterData,
  };
};
