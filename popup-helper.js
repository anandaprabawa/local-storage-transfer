/**
 * Validate all fields by url.
 *
 * @param  {...HTMLInputElement} elements Input element that want to validate.
 * @returns {string[]}
 * Return errors as array of field name.
 * Empty array indicate that fields are valid.
 */
function validateFields(...elements) {
  const errors = [];

  // Iterate the elements.
  for (let idx = 0; idx < elements.length; idx++) {
    const element = elements[idx];
    const value = element.value;

    // Validate value whether it is valid url.
    const validValue = value && value !== "";
    if (!validValue) errors.push(element.name);
  }

  return errors;
}

/**
 * Show error message on element by adding class `show` to the element.
 *
 * @param {HTMLElement} element
 */
function showErrorOnElement(element) {
  if (!element) return;
  element.classList.add("show");
}

/**
 * Hide error message on the element by removing class `show` from the element.
 *
 * @param {HTMLElement} element
 */
function hideErrorOnElement(element) {
  if (!element) return;
  element.classList.remove("show");
}

/**
 * Mapping elements by name in an object.
 * @param {Object.<string, HTMLElement>} props
 */
function mappingElementsByName(props) {
  const elementsByName = { ...props };

  /**
   * Find element by name.
   * @param {string} name Element name
   */
  const findByName = (name) => elementsByName[name];

  const elements = Object.values(elementsByName);

  return {
    findByName,
    elements,
  };
}
