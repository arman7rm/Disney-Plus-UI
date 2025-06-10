export function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) {
    if (Array.isArray(className)) {
      el.classList.add(...className);
    } else {
      el.className = className;
    }
  }
  if (text) el.textContent = text;
  return el;
}

/**
 * Safely fetches JSON data from a URL.
 * @param {string} url - URL to fetch.
 * @returns {Promise<Object | null>} - A promise that resolves with the JSON data or null.
 */
export async function safeFetch(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch data from ${url}:`, error);
    return null;
  }
}

/**
 * Safely accesses a nested property in an object.
 * @param {Object} obj - The object to traverse.
 * @param {string} path - The path to the property (e.g., "data.StandardCollection.containers").
 * @param {*} defaultValue - The value to return if the path is not found.
 * @returns {*} - The value of the nested property or the defaultValue.
 */
export function getNestedProperty(obj, path, defaultValue = undefined) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (
      current === null ||
      typeof current !== "object" ||
      !current.hasOwnProperty(part)
    ) {
      return defaultValue;
    }
    current = current[part];
  }
  return current;
}

export class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    return this.items.shift();
  }

  get length() {
    return this.items.length;
  }
}
