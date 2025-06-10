// dataService.js
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
    this.baseUrl = API_BASE_URL;
  }
  /**
   * Fetches and parses the initial home screen data.
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

  getImageUrl(title, data, size) {
    const images = data?.image?.tile?.[size];
    if (!images) {
      console.warn(`${title} No Image found for size`, size);
      return null;
    }
    return (
      Object.values(images).find((img) => img?.default?.url)?.default?.url ??
      null
    );
  }
  getItemData(item) {
    const data = {};

    data.full = item?.text?.title?.full;
    if (data.full) {
      for (let key in data.full) {
        data.title = data.full[key]?.default?.content;
      }
    }
    data.imageUrl = this.getImageUrl(data.title, item, IMAGE_RATIO_1_78);
    data.contentId = item.contentId;
    data.videoArt = item.videoArt?.[0]?.mediaMetadata?.urls?.[0]?.url;

    return data;
  }
  createRow(set) {
    const title = set?.text?.title?.full?.set?.default?.content;
    const row = new RowModel(title);

    set.items.forEach((item) => {
      row.children.push(this.getItemData(item));
    });
    return row;
  }

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
    } else {
      console.warn(`Row not found: \nrefId: ${refId}`);
    }
  }
}

export const dataService = new DataService();
