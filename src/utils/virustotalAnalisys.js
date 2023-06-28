import { optionsVirusTotal } from "../plugins/virustotal";
import { convertUrlToBase64 } from "./utils";

export const getUrlStats = async (url) => {
  let attempts = 0;

  const urlBase64 = convertUrlToBase64(url);
  const { signal, abort } = new AbortController();

  const response = await fetch(
    `https://www.virustotal.com/api/v3/urls/${urlBase64}`,
    {
      ...optionsVirusTotal,
      signal,
    }
  );

  const { data, error } = await response.json();

  if (error) {
    if (attempts < 3) {
      attempts++;
      return getUrlStats(url);
    }
    return;
  }

  const dataList = Object.entries(data?.attributes?.last_analysis_results);
  const urlStats = data?.attributes?.last_analysis_stats;

  const filterData = (category) =>
    Object.fromEntries(
      dataList.filter(([_, { result }]) =>
        result.toLowerCase().includes(category)
      )
    );

  return {
    abort,
    urlStats,
    filterData,
  };
};
