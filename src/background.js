import {
  sendMessageToOpenModal,
  setIcon,
  storeDataInLocalStorage,
  checkIfDataExistsInLocalStorage,
  injectContentJsInActiveTab,
  isHostnameInList,
  getMaliciousCompanies,
} from "./utils/utils.js";
import {
  addUrlToAnalysedDomains,
  checkIfDomainIsAnalysed,
} from "./utils/firebaseFunctions.js";
import {
  getDomainStats,
  searchForDomainInGoogle,
} from "./utils/virustotalAnalisys.js";
import { checkDomainCreationDateIsMoreThanAYear } from "./utils/heuristAnalisys.js";

chrome.storage.local.clear();
chrome.storage.sync.clear();

const runtimeHandler = async (message, sender, sendResponse) => {
  const tabId = sender.tab.id;
  await chrome.tabs.connect(tabId);

  let domainData = null;

  if (message.type === "runtime") {
    if (isHostnameInList(message.domain)) {
      setIcon(tabId, "safeIcon");

      return;
    }

    let existInlocal = false;

    await checkIfDataExistsInLocalStorage(message.domain).then(
      async (exists) => {
        if (exists) {
          console.log("aqui");
          if (exists.domainStats.type === "phishing") {
            setIcon(tabId, "dangerIcon");
            sendMessageToOpenModal();
          } else if (exists.domainStats.type === "safe") {
            console.log("safe");
            setIcon(tabId, "safeIcon");
          }

          existInlocal = true;
          return;
        }
      }
    );

    if (existInlocal) return;

    const isVerified = await checkIfDomainIsAnalysed(message.domain).then(
      async (data) => {
        if (data.exists) domainData = data.data;

        return data.exists;
      }
    );

    if (!isVerified) {
      let tabDomain = message.domain
        ? message.domain.includes("www.")
          ? message.domain
          : `www.${message.domain}`
        : "";

      const existInGoogleSearch = await searchForDomainInGoogle(message.domain);

      let domainData = await getDomainStats(tabDomain);

      if (domainData) {
        const { attributes } = domainData;

        const domainDate = checkDomainCreationDateIsMoreThanAYear(
          attributes?.creation_date
        );

        const suspiciousTotal = attributes?.last_analysis_stats?.suspicious;
        const maliciousTotal = attributes?.last_analysis_stats?.malicious;
        let maliciousCompanies = null;
        const totalStats = attributes?.last_analysis_stats;

        if (suspiciousTotal > 0 || maliciousTotal > 0) {
          maliciousCompanies = getMaliciousCompanies(domainData);
        }

        let type = "";
        if (!domainDate) type = "phishing";
        if (!existInGoogleSearch) type = "phishing";
        else type = "safe";

        if (existInGoogleSearch && domainDate) type = "safe";

        const pageData = {
          domainDate,
          ...(totalStats && { totalStats: attributes?.last_analysis_stats }),
          existInSearch: existInGoogleSearch,
          ...(maliciousCompanies && maliciousCompanies),
          ...(message.canonical && { hasCanonical: message.canonical }),
          ...(message.ssl && { hasSSL: message.ssl }),
          type,
        };

        await checkIfDataExistsInLocalStorage(message.domain).then(
          async (exists) => {
            if (!exists) {
              if (type === "safe")
                domainData = { domainStats: { type: "safe" } };

              await storeDataInLocalStorage(message.domain, domainData);
            }
          }
        );

        if (type === "phishing") {
          setIcon(tabId, "dangerIcon");
          sendMessageToOpenModal();
        } else if (type === "safe") {
          setIcon(tabId, "safeIcon");
        }

        await addUrlToAnalysedDomains(message.domain, pageData);
      }
    } else {
      await checkIfDataExistsInLocalStorage(message.domain).then(
        async (exists) => {
          if (!exists) {
            await storeDataInLocalStorage(message.domain, domainData);
          }
        }
      );
    }
  }
};

chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
  const tab = tabs[0];
  const tabId = tabs[0].id;

  const domain = new URL(tab?.url).hostname;

  let existInlocal = false;

  await checkIfDataExistsInLocalStorage(domain).then(async (exists) => {
    if (exists) {
      if (exists.domainStats.type === "phishing") setIcon(tabId, "dangerIcon");
      else if (exists.domainStats.type === "safe") setIcon(tabId, "safeIcon");

      sendMessageToOpenModal();
      existInlocal = true;
      return;
    }
  });

  if (existInlocal) return;

  if (isHostnameInList(domain)) {
    setIcon(tabId, "safeIcon");

    await storeDataInLocalStorage(domain, {
      domainStats: {
        type: "safe",
      },
    });

    await sendMessageToOpenModal();

    return;
  } else {
    injectContentJsInActiveTab(tabId);
    await chrome.tabs.sendMessage(tabId, { action: "recheck" });
  }
});

chrome.runtime.onMessage.addListener(runtimeHandler);
