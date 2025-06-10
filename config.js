export const API_BASE_URL = "https://cd-static.bamgrid.com/dp-117731241344";
export const HOME_API_PATH = "/home.json";
export const SETS_API_PATH = "/sets/"; // Remember to append refId and .json
export const IMAGE_RATIO_1_78 = "1.78";
export const PREVIEW_VIDEO_DELAY_MS = 3000;
export const ROW_FETCH_LIMIT = 2; // How many next rows to fetch when needed
export const SCROLL_THRESHOLD_ROWS = 3; // How many rows from end to trigger fetch

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

export const DATA_PATHS = {
  CONTAINERS: "data.StandardCollection.containers",
  SET_ITEMS: "set.items",
  SET_REF_ID: "set.refId",
  ITEM_TITLE_FULL: "text.title.full",
  ITEM_IMAGE_TILE: "image.tile",
  ITEM_VIDEO_ART: "videoArt[0].mediaMetadata.urls[0].url",
  ITEM_CONTENT_ID: "contentId",
  SET_TITLE_FULL: "text.title.full.set.default.content",
  CURATED_SET: "data.CuratedSet",
  TRENDING_SET: "data.TrendingSet",
  PERSONALIZED_CURATED_SET: "data.PersonalizedCuratedSet",
};