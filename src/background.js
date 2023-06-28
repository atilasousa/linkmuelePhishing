import {
  sendMessageToOpenModal,
  setIcon,
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
          await getUrlStats(tabHref).then(async (data) => {
            if (!data) {
              return;
            }

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
            const maliciousDataLength = Object.keys(maliciousData).length;
            const malwareDataLength = Object.keys(malwareData).length;

            if (phishingDataLength) {
              console.log("phishing aqui");
              setIcon(tabId, "dangerIcon");

              urlData.type = "phishing";
              urlData.phishingData = phishingData;
            } else if (malwareDataLength) {
              console.log("malware aqui");
              setIcon(tabId, "warningIcon");

              urlData.type = "malware";
              urlData.malwareData = malwareData;
            } else if (maliciousDataLength) {
              setIcon(tabId, "warningIcon");
              console.log("malicious aqui");

              urlData.type = "malicious";
              urlData.maliciousData = maliciousData;
            } else {
              setIcon(tabId, "safeIcon");
              urlData.type = "safe";
              return;
            }

            await storeDataInLocalStorage(tabHref, urlData);

            await addUrlToAnalysedLinks(tabHref, urlData);

            sendMessageToOpenModal();

            console.log("cheguei aqui");
          });
        } catch (error) {
          console.error(error);
        }

        return true;
      }
    } else {
      console.log("exists");
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
      if (icon != "safeIcon") sendMessageToOpenModal();

      return true;
    }
  }
};

chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
  const tab = tabs[0];

  const isUrlExistInLocalStorage = await checkIfUrlExistInLocalStorage(tab.url);

  if (isUrlExistInLocalStorage.exist) {
    const type = isUrlExistInLocalStorage.result[tab.url]?.urlStats?.type;
    console.log("aqui o type", type);

    const iconType =
      type === "safe"
        ? "safeIcon"
        : type === "phishing"
        ? "dangerIcon"
        : "warningIcon";

    setIcon(tab.id, iconType);
    sendMessageToOpenModal();
    return;
  }

  console.log("Button does not exist");
  runtimeHandler(
    { type: "runtime", url: location.href },
    { tab: { id: tab.id } }
  );
});

chrome.runtime.onMessage.removeListener(runtimeHandler);

chrome.runtime.onMessage.addListener(runtimeHandler);
