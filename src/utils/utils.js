import defaultExcludedHosts from "../excludeUrls/defaultUrls.json";
import excludedDomains from "../excludeUrls/excludeUrls.json";
import base64 from "base-64";

export const injectContentJsInActiveTab = async (tabId) => {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
};

export const checkIfUrlIsInExcludeList = (url) => {
  const urlObj = new URL(url);
  let hostname = urlObj.hostname;

  if (defaultExcludedHosts.includes(hostname)) return true;

  const splitedHostName = hostname.split(".");

  const splitedHostNameLength = splitedHostName.length;

  const finalDomain = `${splitedHostName[splitedHostNameLength - 2]}`;

  const isInExcludeList = excludeGlobs.some((excludeGlob) =>
    excludeGlob.includes(finalDomain)
  );

  return isInExcludeList;
};

export const isHostnameInList = (domain) => {
  return excludedDomains.some((pattern) =>
    new RegExp(pattern).test("https://" + domain)
  );
};

export const sendMessageToOpenModal = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  await chrome.tabs.sendMessage(tab.id, { action: "open_modal" });
};

export const sendMessageToContentScript = (tabId, message) => {
  chrome.tabs.sendMessage(tabId, message);
};

export const setIcon = (tabId, type) => {
  chrome.action.setIcon({
    tabId,
    path: {
      16: `./assets/images/${type}/16.png`,
      32: `./assets/images/${type}/32.png`,
      48: `./assets/images/${type}/48.png`,
      128: `./assets/images/${type}/128.png`,
    },
  });
};

export const convertUrlToBase64 = (url) => {
  return base64.encode(url);
};

export const revertUrlFromBase64 = (url) => {
  return btoa(url).replace(/-/g, "/");
};

export const storeDataInLocalStorage = async (key, data) => {
  await chrome.storage.sync.set({ [key]: data }, () => {
    if (chrome.runtime.lastError) {
      console.log("Erro ao salvar na storage:", chrome.runtime.lastError);
    }
  });
};

export const checkIfDataExistsInLocalStorage = async (key) => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      if (chrome.runtime.lastError) {
        console.log("Erro ao buscar na storage:", chrome.runtime.lastError);
        resolve(false);
      } else {
        const data = result[key];
        resolve(data);
      }
    });
  });
};

export const sendNotification = async (title, message, iconType) => {
  await chrome.notifications.create({
    type: "basic",
    iconUrl: `./assets/images/${iconType}/128.png`,
    title,
    message,
  });
};

export const getMaliciousCompanies = (domainData) => {
  const maliciousCompanies = [];
  const analysisResults = domainData.attributes.last_analysis_results;

  for (const companyName in analysisResults) {
    if (
      analysisResults[companyName].category === "malicious" ||
      analysisResults[companyName].category === "suspicious" ||
      analysisResults[companyName].category === "phishing"
    ) {
      maliciousCompanies.push(companyName);
    }
  }

  return maliciousCompanies;
};
