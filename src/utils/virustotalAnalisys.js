import { optionsVirusTotal } from "../plugins/virustotal";
import { convertUrlToBase64 } from "./utils";

export const getUrlStats = async (url) => {
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
    console.log(error);
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
