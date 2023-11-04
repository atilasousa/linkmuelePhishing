const summarysContentIds = ["phishing", "malicious", "malware"];
let data = null;
let webSiteCategories = [];

function printAlert(data, alertType) {
  let alertLogoClass = "";
  let iconSrc = "";
  let reportButtonClass = "";

  alertLogoClass = "phishing";
  iconSrc = "./assets/images/dangerIcon/128.png";
  const alertText = "ALERTA DE SEGURANÇA";
  reportButtonClass = "phishing";

  const alertLogoElement = document.getElementById("alert_logo");
  const iconElement = document.getElementById("icon");
  const alertTextElement = document.getElementById("alert_text");
  const reportButtonElement = document.getElementById("reportButton");
  const detailsHolder = document.getElementsByClassName("details")[0];

  alertLogoElement.classList.add(alertLogoClass);
  iconElement.src = iconSrc;
  alertTextElement.innerHTML = alertText;
  reportButtonElement.classList.add(reportButtonClass);
  detailsHolder.style.display = "block";
}

function printSafeData() {
  const iconElement = document.getElementById("icon");
  const alertLogoElement = document.getElementById("alert_logo");
  const alertTextElement = document.getElementById("alert_text");
  const infoElement = document.getElementsByClassName("info")[0];

  iconElement.src = "./assets/images/safeIcon/128.png";
  alertLogoElement.classList.add("safe");
  alertTextElement.textContent = "NÃO FORAM DETECTADAS AMEAÇAS";

  const descriptionElement = document.getElementById("description");
  const reportButtonHolderElement = document.getElementById(
    "reportButton_holder"
  );

  if (descriptionElement) {
    descriptionElement.remove();
  }
  if (reportButtonHolderElement) {
    reportButtonHolderElement.remove();
  }

  infoElement.style.display = "flex";
  infoElement.style.justifyContent = "center";
  infoElement.style.alignItems = "center";
}

function hideInitComponent() {
  const alertTextElement = document.getElementById("alert_text");
  const descriptionElement = document.getElementById("description");
  const reportButtonHolderElement = document.getElementById(
    "reportButton_holder"
  );

  alertTextElement.remove();

  if (descriptionElement) {
    descriptionElement.remove();
  }
  if (reportButtonHolderElement) {
    reportButtonHolderElement.remove();
  }
}

document.getElementById("close_button").addEventListener("click", async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  const port = chrome.tabs.connect(tab.id);

  port.postMessage({ action: "open_modal" });
});

chrome.tabs.query({ currentWindow: true, active: true }, async function (tabs) {
  const domain = new URL(tabs[0].url).hostname;

  try {
    data = await getUrlData(domain);

    const type = data.domainStats?.type ?? data.type;

    if (type === "safe") {
      printSafeData();
    } else {
      printAlert(data);
    }
  } catch (error) {
    console.error(error);
  }
});

function getUrlData(urlKey) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([urlKey], function (result) {
      const urlData = result[urlKey];
      console.log("urlDat", urlData);

      if (urlData) {
        resolve(urlData);
      } else {
        reject(
          new Error(
            "Não foi possível encontrar os dados da URL no armazenamento."
          )
        );
      }
    });
  });
}

function showFullReport() {
  const ssl = document.getElementById("ssl");
  const domainDate = document.getElementById("domainDate");
  const googleSearch = document.getElementById("googleSearch");
  const domainDateData = data.domainStats?.domainDate;

  if (!domainDateData) {
    domainDate.textContent =
      domainDateData === false
        ? "O domínio deste site foi criado há menos de 1 ano. Isso pode ser um indicador de phishing."
        : domainDateData === undefined
        ? "Não foi encontrado uma data de criação deste domínio. Isso pode ser um indicador de phishing"
        : "";

    domainDate.style.display = "block";
  }

  if (!data.domainStats.hasSSL) {
    ssl.textContent = "Não possui certificado HTTPS";
    ssl.style.display = "block";
  }

  googleSearch.textContent = !data.domainStats.existInSearch
    ? "O domínio deste site não foi encontrado pelo motor de busca Google. Isso pode ser um indicador de phishing."
    : "Encontrado pelo motor de busca Google";

  googleSearch.style.display = "block";
}

document.getElementById("reportButton").addEventListener("click", () => {
  hideInitComponent();
  showFullReport();
});
