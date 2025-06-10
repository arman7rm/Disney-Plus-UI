/**
 * API endpoints and related constants.
 */
export const API_BASE_URL = "https://cd-static.bamgrid.com/dp-117731241344";
export const HOME_API_PATH = "/home.json";
export const SETS_API_PATH = "/sets/";
export const IMAGE_RATIO_1_78 = "1.78";
export const PREVIEW_VIDEO_DELAY_MS = 3000;
export const ROW_FETCH_LIMIT = 2; // How many next rows to fetch when needed
export const SCROLL_THRESHOLD_ROWS = 3; // How many rows from end to trigger fetch

/**
 * CSS class name mappings used throughout the UI.
 */
export const CSS_CLASSES = {
  ROW: "row",
  ROW_HEADING: "row-heading",
  ROW_TITLE: "row-title",
  ITEM_TITLE: "item-title",
  ROW_CHILDREN: "row-children",
  TILE: "tile",
  TILE_SELECTED: "selected",
  TILE_WRAPPER: "tile-wrapper",
  PREVIEW_VIDEO: "preview-video",
  GRID_CONTAINER: "grid-container",
};

/**
 * Common data paths used for safe object traversal.
 */
export const DATA_PATHS = {
  CONTAINERS: "data.StandardCollection.containers",
  SET_TITLE_FULL: "text.title.full.set.default.content"
};