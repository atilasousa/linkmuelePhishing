import {
  sendMessageToOpenModal,
  setIcon,
  revertUrlFromBase64,
  storeDataInLocalStorage,
  checkIfUrlIsInExcludeList,
  checkIfUrlExistInLocalStorage,
} from "./utils/utils.js";
import {
  addUrlToAnalysedLinks,
  checkIfUrlIsAnalysed,
} from "./utils/firebaseFunctions.js";
import { getUrlStats } from "./utils/virustotalAnalisys.js";

chrome.storage.local.clear();

chrome.storage.sync.clear();

const runtimeHandler = async (message, sender, sendResponse) => {
  const tabId = sender.tab.id;
  const tabHref = new URL(message?.url).href;

  if (checkIfUrlIsInExcludeList(tabHref)) {
    console.log("is in exclude list");
    storeDataInLocalStorage(tabHref, { urlStats: { type: "safe" } });

    setIcon(tabId, "safeIcon");

    return true;
  } else if (checkIfUrlExistInLocalStorage(tabHref)) {
    setIcon(tabId, "safeIcon");

    return true;
  } else {
    const resutl = await checkIfUrlIsAnalysed(tabHref);

    if (!resutl.exists) {
      console.log("not exists");
      if (message.type === "runtime") {
        console.log("runtime");
        try {
          await getUrlStats(tabHref).then(async (data) => {
            const { urlStats, filterData } = data;

            const urlData = {
              id: tabHref,
              stats: urlStats,
              created_at: Date.now(),
            };

            const phishingData = filterData("phishing");
            const malwareData = filterData("malware");
            const maliciousData = filterData("malicious");

            const phishingDataLength = Object.keys(phishingData).length;
            const malwareDataLength = Object.keys(malwareData).length;
            const maliciousDataLength = Object.keys(maliciousData).length;

            let type = "";

            if (phishingDataLength) {
              setIcon(tabId, "dangerIcon");
              type = "phishing";
              urlData.phishingData = phishingData;
            } else if (malwareDataLength) {
              setIcon(tabId, "warningIcon");
              type = "malware";
              urlData.malwareData = malwareData;
            } else if (maliciousDataLength) {
              console.log("aqui malicious");
              setIcon(tabId, "warningIcon");
              type = "malicious";
              urlData.maliciousData = maliciousData;
            } else {
              setIcon(tabId, "safeIcon");
              type = "safe";
            }

            urlData.type = type;

            storeDataInLocalStorage(tabHref, urlData);

            await addUrlToAnalysedLinks(tabHref, urlData);
          });
        } catch (error) {
          console.error(error);
        }

        return true;
      }
    } else {
      console.log("exists");
      if (resutl.data.urlStats.type === "malicious") {
        setIcon(tabId, "warningIcon");
      } else if (resutl.data.urlStats.type === "phishing") {
        setIcon(tabId, "dangerIcon");
      } else if (resutl.data.urlStats.type === "safe") {
        setIcon(tabId, "safeIcon");
      }

      const revertedUrl = revertUrlFromBase64(resutl.data.id);

      await storeDataInLocalStorage(revertedUrl, resutl.data).then(() => {
        if (resutl.data.urlStats.type !== "safe") {
          sendMessageToOpenModal();
        }
      });
    }
  }
};

const removeTabHandler = (tabId, removed) => {
  const index = accessedTabs.findIndex((tab) => tab.id === tabId);

  if (index !== -1) {
    const removedTab = accessedTabs[index];
    if (!removedTab.analysed) removedTab.abort();
    accessedTabs.splice(index, 1);
  }
};

chrome.action.onClicked.addListener(() => {
  sendMessageToOpenModal();
});

chrome.runtime.onMessage.removeListener(runtimeHandler);

chrome.runtime.onMessage.addListener(runtimeHandler);

chrome.tabs.onRemoved.removeListener(removeTabHandler);

chrome.tabs.onRemoved.addListener(removeTabHandler);
