import { safeFetch, getNestedProperty } from "./utils.js";
import {
  API_BASE_URL,
  HOME_API_PATH,
  SETS_API_PATH,
  IMAGE_RATIO_1_78,
  DATA_PATHS,
} from "./constants.js";
import { RowModel, Tile } from "./models.js";

/**
 * @class DataService
 * @description Handles all data retrieval, parsing, and transformation into application-specific models.
 */
class DataService {
  constructor() {
    /**
     * Base URL for API requests.
     * @type {string}
     */
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Fetches and processes the initial home screen rows.
   * @returns {Promise<{initialRows: Array<RowModel>, nextRowRefIds: Array<string>}>}
   */
  async fetchInitialRows() {
    const url = `${this.baseUrl}${HOME_API_PATH}`;
    const response = await safeFetch(url);

    if (!response) {
      console.error("DataService: Failed to fetch initial home data.");
      return { initialRows: [], nextRowRefIds: [] };
    }

    const containers = getNestedProperty(response, DATA_PATHS.CONTAINERS);

    if (!containers || !Array.isArray(containers)) {
      console.error(
        "DataService: Invalid initial response structure. 'containers' not found or not an array."
      );
      return { initialRows: [], nextRowRefIds: [] };
    }

    const initialRows = [];
    const nextRowRefIds = [];

    containers.forEach((container) => {
      if (container.set?.items) {
        const row = this.createRow(container.set);
        if (row && row.children.length > 0) {
          initialRows.push(row);
        } else {
          console.warn("DataService: Container missing items", container);
        }
      } else {
        const refId = container.set.refId;
        if (refId) {
          nextRowRefIds.push(refId);
        } else {
          console.warn(
            "DataService: Container missing items or refId:",
            container
          );
        }
      }
    });

    return { initialRows, nextRowRefIds };
  }

  /**
   * Retrieves the appropriate image URL for an item based on its size.
   * @param {string} title
   * @param {Object} data
   * @param {string} size
   * @returns {string|null}
   */
  getImageUrl(title, data, size) {
    const images = data?.image?.tile?.[size];
    if (!images) {
      console.warn(`${title} - No image found for size: ${size}`);
      return null;
    }

    return (
      Object.values(images).find((img) => img?.default?.url)?.default?.url ??
      null
    );
  }

  /**
   * Extracts relevant information from a content item to be displayed as a tile.
   * @param {Object} item - The content item.
   * @returns {Tile}
   */
  getItemData(item) {
    const data = {};

    data.full = item?.text?.title?.full;
    if (data.full) {
      for (let key in data.full) {
        data.title = data.full[key]?.default?.content;
        break;
      }
    }

    data.imageUrl = this.getImageUrl(data.title, item, IMAGE_RATIO_1_78);
    data.contentId = item.contentId;
    data.videoArt = item.videoArt?.[0]?.mediaMetadata?.urls?.[0]?.url;
    if (!data.videoArt) {
      console.warn(`Preview Video missing for ${data.title}`);
    }

    return data;
  }

  /**
   * Creates a RowModel instance and populates it with tile data.
   * @param {Object} set - The data set containing title and items.
   * @returns {RowModel} - The constructed RowModel with its children.
   */
  createRow(set) {
    const title = getNestedProperty(set, DATA_PATHS.SET_TITLE_FULL);
    const row = new RowModel(title);

    set.items.forEach((item) => {
      row.children.push(this.getItemData(item));
    });

    return row;
  }

  /**
   * Fetches and constructs a row based on a reference ID.
   * @param {string} refId - The reference ID to fetch data from.
   * @returns {Promise<RowModel | undefined>} - The row if found, otherwise undefined.
   */
  async fetchRowbyRefId(refId) {
    const baseUrl = `${API_BASE_URL}${SETS_API_PATH}${refId}.json`;
    const response = await safeFetch(baseUrl);
    const data = response?.data;

    let row;
    if (data.CuratedSet) {
      row = this.createRow(data.CuratedSet);
    } else if (data.TrendingSet) {
      row = this.createRow(data.TrendingSet);
    } else if (data.PersonalizedCuratedSet) {
      row = this.createRow(data.PersonalizedCuratedSet);
    }

    if (row) {
      return row;
    }
    console.warn(`Row not found: \nrefId: ${refId}`);
    return undefined;
  }
}

/**
 * Singleton instance of DataService for shared use across the app.
 * @type {DataService}
 */
export const dataService = new DataService();
