// ============
// ELEMENTS
// ============

/**
 * @type {HTMLSelectElement}
 */
const websiteFromInputElement = document.getElementById("from");

/**
 * @type {HTMLElement}
 */
const websiteFromErrorElement =
  websiteFromInputElement.parentElement.querySelector(".error");

/**
 * @type {HTMLSelectElement}
 */
const websiteToInputElement = document.getElementById("to");

/**
 * @type {HTMLElement}
 */
const websiteToErrorElement =
  websiteToInputElement.parentElement.querySelector(".error");

/**
 * @type {HTMLButtonElement}
 */
const transferButton = document.getElementById("transfer");

// ===========
// INIT
// ===========

(async () => {
  await injectAvailableTabs();
  injectInitialTabValues();
})();

async function injectAvailableTabs() {
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    const url = truncateUrl(tab.url);
    if (!url) continue;

    const node = document.createElement("option");
    node.value = url;
    node.textContent = tab.title;

    websiteFromInputElement.appendChild(node.cloneNode(true));
    websiteToInputElement.appendChild(node.cloneNode(true));
  }
}

function injectInitialTabValues() {
  chrome.storage.sync.get(["lstFromWebsite"], (res) => {
    websiteFromInputElement.value = res.lstFromWebsite;
  });
  chrome.storage.sync.get(["lstToWebsite"], (res) => {
    websiteToInputElement.value = res.lstToWebsite;
  });
}

// ==============
// METHODS
// ==============

/**
 * Handle transfer for click listener.
 *
 * This will let the background process know about our action
 * and do the job on that side.
 */
async function handleTransfer() {
  const valid = handleValidation();
  if (!valid) return;

  // Tell background process that we're gonna do an action,
  // and it will do that job for us.
  await chrome.runtime.sendMessage({
    action: "transfer",
    field: {
      fromWebsite: websiteFromInputElement.value,
      toWebsite: websiteToInputElement.value,
    },
  });
}

/**
 * Handle data validation and error.
 * @returns {boolean} Whether data is valid.
 */
function handleValidation() {
  // Validate error on all fields.
  const errors = validateFields(websiteFromInputElement, websiteToInputElement);

  const hasError = !!errors.length;
  if (!hasError) return true;

  // Displaying the error on the related fields.
  for (let index = 0; index < errors.length; index++) {
    const error = errors[index];
    const element = errorFieldsMapping.findByName(error);
    showErrorOnElement(element);
  }

  return false;
}

/**
 * @param {HTMLElement} element
 */
function clearError(element) {
  return () => {
    hideErrorOnElement(element);
  };
}

// ===================
// EVENT LISTENERS
// ===================

transferButton.addEventListener("click", handleTransfer);
websiteFromInputElement.addEventListener(
  "change",
  clearError(websiteFromErrorElement)
);
websiteToInputElement.addEventListener(
  "change",
  clearError(websiteToErrorElement)
);

// ===================
// HELPERS
// ===================

/**
 * Truncate website URL to be just a domain name with protocol.
 *
 * Example:
 *   - https://google.com/search?q=google -> https://google.com
 *   - http://localhost:4200/auth/login -> http://localhost:4200
 *
 * @param {string} url Website URL
 * @returns {string | undefined} Truncated URL
 */
function truncateUrl(url) {
  const regex = new RegExp("^((https?)://)([-.:A-Za-z0-9])+");
  const res = url.match(regex);
  if (!res?.length) return;
  return res[0];
}

const errorFieldsMapping = mappingElementsByName({
  from: websiteFromErrorElement,
  to: websiteToErrorElement,
});
