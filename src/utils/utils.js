import excludeGlobs from "../excludeUrls/excludeUrls.json";

export const sendMessageToOpenModal = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0]?.id, { action: "open_modal" });
  });
};

export const checkIfUrlIsInExcludeList = (url) => {
  const urlObj = new URL(url);
  if (urlObj.hostname.includes("localhost")) return true;

  if (urlObj.hostname.includes("chrome-extension")) return true;

  if (!urlObj.hostname.includes("www")) {
    urlObj.hostname = "www." + urlObj.hostname;
  }

  const hostname = urlObj.hostname.split(".")[1];

  const isInExcludeList = excludeGlobs.some((excludeGlob) =>
    excludeGlob.includes(hostname)
  );

  console.log("isInExcludeList", isInExcludeList);

  return isInExcludeList;
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
  return btoa(url).replace(/^\=+|\=+$/g, "");
};

export const revertUrlFromBase64 = (url) => {
  return btoa(url).replace(/-/g, "/");
};

export const checkIfUrlExistInLocalStorage = (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const exists = result[key] !== undefined;
      resolve(exists);
    });
  });
};

export const storeDataInLocalStorage = async (key, data) => {
  return new Promise((resolve, reject) => {
    const exist = checkIfUrlExistInLocalStorage(key);

    if (!exist) {
      chrome.storage.local.set({ [key]: data }, () => {
        resolve();
      });
    }
  });
};
