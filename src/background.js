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
    const { type } = isUrlExistInLocalStorage.result[tabHref].urlStats;

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
              setIcon(tabId, "warningIcon");
              type = "malicious";
              urlData.maliciousData = maliciousData;
            } else {
              setIcon(tabId, "safeIcon");
              type = "safe";
            }

            urlData.type = type;

            await storeDataInLocalStorage(tabHref, urlData);

            await addUrlToAnalysedLinks(tabHref, urlData);
          });
        } catch (error) {
          console.error(error);
        }

        return true;
      }
    } else {
      const { type } = resutl.data.urlStats;
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

chrome.action.onClicked.addListener(() => {
  setTimeout(() => {
    sendMessageToOpenModal();
  }, 500);
});

chrome.runtime.onMessage.removeListener(runtimeHandler);

chrome.runtime.onMessage.addListener(runtimeHandler);
