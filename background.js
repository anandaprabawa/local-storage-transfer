chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // Set initial data for storage
    chrome.storage.sync.set({
      lstFromWebsite: "",
      lstToWebsite: "",
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "transfer") {
    chrome.storage.sync.set(
      {
        lstFromWebsite: request.field.fromWebsite,
        lstToWebsite: request.field.toWebsite,
      },
      async () => {
        await transferLocalStorage();
        sendResponse({ success: true });
      }
    );
    return true;
  }
});

/**
 * Transfer local storage items from the source to the destination.
 */
async function transferLocalStorage() {
  const data = await getAllStorageSyncData();

  const localStorageItems = await getSourceLocalStorage(data.lstFromWebsite);
  await setLocalStorageOnDestination(data.lstToWebsite, localStorageItems);

  await sendConsoleMessageToTab(
    data.lstToWebsite,
    `[LST] Local storage has been updated from "${data.lstFromWebsite}".`
  );
}

/**
 * Get source of the local storage.
 *
 * @param {string} url Just provide the domain name
 */
async function getSourceLocalStorage(url) {
  const [tab] = await chrome.tabs.query({ url: normalizeUrl(url) });

  const localStorageItems = await executeScript({
    target: { tabId: tab.id, allFrames: true },
    function: execScriptGetLocalStorage,
  });

  return localStorageItems;
}

/**
 * Content script that will be executed on the site to get the local storage items.
 */
function execScriptGetLocalStorage() {
  const items = Array.from(Array(localStorage.length).keys()).map((idx) => {
    const key = localStorage.key(idx);
    const value = localStorage.getItem(key);
    return { key, value };
  });
  return items;
}

/**
 * Put local storage key/value on the destination tab.
 *
 * @param {string} url
 * @param {Object.<string, string>} items
 */
async function setLocalStorageOnDestination(url, items) {
  const [tab] = await chrome.tabs.query({ url: normalizeUrl(url) });

  await executeScript({
    target: { tabId: tab.id, allFrames: true },
    function: execScriptPutLocalStorage,
    args: [items],
  });
}

/**
 * Content script that will be executed on the site to set the local storage items.
 *
 * @param {Object.<string, string>} items
 */
function execScriptPutLocalStorage(items) {
  for (const item of items) {
    localStorage.setItem(item.key, item.value);
  }
}

/**
 * Send console message to the website in the tab based on the url.
 * @param {string} url Website url
 * @param {string} message Message that want to sent.
 */
async function sendConsoleMessageToTab(url, message) {
  const [tab] = await chrome.tabs.query({ url: normalizeUrl(url) });

  await executeScript({
    target: { tabId: tab.id },
    function: execConsoleMessage,
    args: [message],
  });
}

/**
 * Content script that will be executed on the site to show a message in the console.
 * @param {string} message
 */
function execConsoleMessage(message) {
  console.log(message);
}

// ===========
// HELPERS
// ===========

/**
 * Normalize URL by adding a pattern.
 *
 * We got a URL without the pattern from the field.
 * It wouldn't work because the tabs API need to use URL pattern.
 *
 * @param {string} url
 */
function normalizeUrl(url) {
  return url + "/*";
}

/**
 * Reads all data out of storage.sync and exposes it via a promise.
 *
 * Note: Once the Storage API gains promise support, this function
 * can be greatly simplified.
 */
function getAllStorageSyncData() {
  // Immediately return a promise and start asynchronous work
  return new Promise((resolve, reject) => {
    // Asynchronously fetch all data from storage.sync.
    chrome.storage.sync.get(null, (items) => {
      // Pass any observed errors down the promise chain.
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      // Pass the data retrieved from storage down the promise chain.
      resolve(items);
    });
  });
}

/**
 * Make a promise based of the chrome scripting API.
 *
 * @param {*} options The options are based on the `chrome.scripting.executeScript` API.
 * @returns Promise based `chrome.scripting.executeScript`
 */
function executeScript(options) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(options, (injectionResults) => {
      const firstFrame = injectionResults.at(0);
      const result = firstFrame?.result;
      resolve(result);
    });
  });
}
