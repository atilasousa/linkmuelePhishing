import {
  sendMessageToOpenModal,
  setIcon,
  storeDataInLocalStorage,
  checkIfUrlIsInExcludeList,
  checkIfUrlExistInLocalStorage,
  injectContentJsInActiveTab,
} from "./utils/utils.js";
import {
  addUrlToAnalysedLinks,
  checkIfUrlIsAnalysed,
} from "./utils/firebaseFunctions.js";
import { getUrlStats, getUrlLinkId } from "./utils/virustotalAnalisys.js";

chrome.storage.local.clear();
chrome.storage.sync.clear();

const runtimeHandler = async (message, sender, sendResponse) => {
  const tabId = sender.tab.id;
  await chrome.tabs.connect(tabId);

  const tabHref = new URL(message?.url).href;
  const isInExcludeList = checkIfUrlIsInExcludeList(tabHref);

  if (isInExcludeList) {
    storeDataInLocalStorage(tabHref, { urlStats: { type: "safe" } });

    setIcon(tabId, "safeIcon");

    return true;
  }

  const isUrlExistInLocalStorage = await checkIfUrlExistInLocalStorage(tabHref);

  if (isUrlExistInLocalStorage.exist) {
    const { type } = isUrlExistInLocalStorage?.result[tabHref];

    const iconType =
      type === "safe"
        ? "safeIcon"
        : type === "phishing"
        ? "dangerIcon"
        : "warningIcon";
    setIcon(tabId, iconType);

    if (type != "safe") sendMessageToOpenModal();

    return true;
  } else {
    const resutl = await checkIfUrlIsAnalysed(tabHref);

    if (!resutl.exists) {
      if (message.type === "runtime") {
        try {
          const urlLinkId = await getUrlLinkId(tabHref);

          if (!urlLinkId) return;

          const { urlStats, filterData } = (await getUrlStats(urlLinkId)) || {};

          if (!urlStats) return;

          const urlData = {
            id: tabHref,
            stats: urlStats,
            created_at: Date.now(),
          };

          const phishingData = filterData("phishing");
          const malwareData = filterData("malware");
          const maliciousData = filterData("malicious");

          const phishingDataLength = Object.keys(phishingData).length;
          const maliciousDataLength = Object.keys(maliciousData).length;
          const malwareDataLength = Object.keys(malwareData).length;

          if (phishingDataLength) {
            setIcon(tabId, "dangerIcon");

            urlData.type = "phishing";
            urlData.phishingData = phishingData;
          } else if (malwareDataLength) {
            setIcon(tabId, "warningIcon");

            urlData.type = "malware";
            urlData.malwareData = malwareData;
          } else if (maliciousDataLength) {
            setIcon(tabId, "warningIcon");

            urlData.type = "malicious";
            urlData.maliciousData = maliciousData;
          } else if (
            !phishingDataLength &&
            !maliciousDataLength &&
            !malwareDataLength
          ) {
            setIcon(tabId, "safeIcon");
            urlData.type = "safe";
          }

          await storeDataInLocalStorage(tabHref, urlData);

          await addUrlToAnalysedLinks(tabHref, urlData);

          if (urlData.type != "safe") sendMessageToOpenModal();
        } catch (error) {
          console.error(error);
        }

        return true;
      }
    } else {
      const { type } = resutl.data?.urlStats;
      let icon = "";

      if (type === "malicious") {
        icon = "warningIcon";
      } else if (type === "phishing") {
        icon = "dangerIcon";
      } else if (type === "safe") {
        icon = "safeIcon";
      }

      setIcon(tabId, icon);

      if (isUrlExistInLocalStorage.exist) {
        sendMessageToOpenModal();
        return;
      }

      await storeDataInLocalStorage(tabHref, resutl.data);
      if (type != "safe") sendMessageToOpenModal();

      return true;
    }
  }
};

chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
  const tab = tabs[0];

  injectContentJsInActiveTab(tab.id);

  const isUrlExistInLocalStorage = await checkIfUrlExistInLocalStorage(tab.url);

  if (isUrlExistInLocalStorage.exist) {
    const type =
      isUrlExistInLocalStorage.result[tab.url]?.urlStats?.type ??
      isUrlExistInLocalStorage.result[tab.url]?.type;

    let iconType = "";
    if (type === "safe") iconType = "safeIcon";
    else if (type === "phishing") iconType = "dangerIcon";
    else if (type === "malicious") iconType = "warningIcon";

    setIcon(tab.id, iconType);

    setTimeout(() => {
      sendMessageToOpenModal();
    }, 500);

    return;
  } else
    runtimeHandler({ type: "runtime", url: tab.url }, { tab: { id: tab.id } });
});

chrome.runtime.onMessage.addListener(runtimeHandler);
