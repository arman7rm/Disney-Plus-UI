import { createEl, safeFetch, getNestedProperty, Queue } from "./utils.js";
import {
  API_BASE_URL,
  HOME_API_PATH,
  SETS_API_PATH,
  IMAGE_RATIO_1_78,
  PREVIEW_VIDEO_DELAY_MS,
  ROW_FETCH_LIMIT,
  SCROLL_THRESHOLD_ROWS,
  CSS_CLASSES,
  DATA_PATHS,
} from "./constants.js";
import { dataService } from "./dataservice.js";

class App {
  static previewTimeout = null;
  static currentVideo = null;
  constructor() {
    // State variables
    this.nextRowQueue = new Queue(); // Stores refIds for rows to be fetched later
    this.renderQueue = new Queue(); // Stores rowIds that will be rendered when renderRows is invoked
    this.rowMap = new Map(); // Stores processed row data
    this.renderedTitles = new Set(); // Stores titles of already rendered rows to prevent duplicates
    this.currentRowId = 0; // Currently selected row index

    // DOM Elements (cached for performance)
    this.gridContainer = document.querySelector(
      `.${CSS_CLASSES.GRID_CONTAINER}`
    );
    this.body = document.body;

    // Bind event handler
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  async init() {
    this.addEventListeners();
    await this.initializeRowData();
    this.renderQueuedRows();
    this.updateSelection(0); // Initialize selection to the first item of the first row
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
    const row = {};
    row.id = this.rowMap.size;
    row.title = set?.text?.title?.full?.set?.default?.content;
    row.tileIndex = 0;
    row.children = [];

    set.items.forEach((item) => {
      row.children.push(this.getItemData(item));
    });
    return row;
  }

  async initializeRowData() {
    const { initialRows, nextRowRefIds } = await dataService.fetchInitialRows();
    initialRows.forEach((row) => {
      this.rowMap.set(row.id, row);
      this.renderQueue.enqueue(row.id);
    });
    nextRowRefIds.forEach((refId) => {
      this.nextRowQueue.enqueue(refId);
    });
    // return safeFetch(API_BASE_URL + HOME_API_PATH).then((response) => {
    //   const containers = response?.data?.StandardCollection?.containers;

    //   if (!containers) {
    //     console.error(
    //       "Error: Data could not be parsed. Invalid response structure."
    //     );

    //     return;
    //   }

    //   containers.forEach((container) => {
    //     if (container.set?.items) {
    //       const row = this.createRow(container.set);
    //       console.log(row.id);
    //       this.rowMap.set(row.id, row);
    //       this.renderQueue.enqueue(row.id);
    //     } else {
    //       this.nextRowQueue.enqueue(container?.set?.refId);
    //     }
    //   });
    // });
  }

  updateSelection(newRowIndex) {
    const rowObject = this.rowMap.get(newRowIndex);
    const oldSelected = document.querySelector(".tile.selected");

    // Remove old video if exists
    if (oldSelected) {
      oldSelected.classList.remove("selected");
      const oldWrapper = oldSelected.closest(".tile-wrapper");
      const existingVideo = oldWrapper.querySelector(".preview-video");
      if (existingVideo) {
        existingVideo.remove();
      }
      clearTimeout(App.previewTimeout);
    }

    const rowElements = document.querySelectorAll(".row");
    const row = rowElements[newRowIndex];

    if (!row) return;

    const rowChildren = row.querySelector(".row-children");
    const tiles = rowChildren.querySelectorAll(".tile");
    const newTile = tiles[rowObject.tileIndex];

    if (newTile) {
      newTile.classList.add("selected");
      newTile.scrollIntoView({ behavior: "smooth", inline: "center" });
      const rowTitle = row.querySelector(".row-title");
      if (rowTitle) rowTitle.scrollIntoView({ behavior: "smooth" });
      if (newRowIndex === 0) {
        document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
      }
      this.currentRowId = newRowIndex;
      const selectedTile = document.querySelector(".tile.selected");
      const title = selectedTile ? selectedTile.alt : null;
      row.querySelector(".item-title").textContent = ": " + title;

      App.previewTimeout = setTimeout(() => {
        const wrapper = newTile.closest(".tile-wrapper");
        const video = createEl("video");
        video.src = selectedTile.videoUrl;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.classList.add("preview-video");
        wrapper.appendChild(video);
        App.currentVideo = video;
      }, PREVIEW_VIDEO_DELAY_MS);
    }
  }

  renderQueuedRows() {
    while (this.renderQueue.length > 0) {
      const row = this.rowMap.get(this.renderQueue.dequeue());
      const rowElement = createEl("div", "row");
      const rowHeading = createEl("div", "row-heading");
      const rowTitle = createEl("h2", ["row-title"], row.title);
      const itemTitle = createEl("h2", ["item-title"]);

      rowHeading.appendChild(rowTitle);
      rowHeading.appendChild(itemTitle);

      const rowChildren = createEl("div", "row-children");

      row.children.forEach((item) => {
        const img = createEl("img");
        img.src = item.imageUrl;
        img.classList.add("tile");
        img.alt = item.title;
        img.videoUrl = item.videoArt;

        const tileWrapper = createEl("div", "tile-wrapper");
        tileWrapper.appendChild(img);
        rowChildren.appendChild(tileWrapper);
        img.onerror = () => {
          console.warn(`Image failed to load for ${item.title}:`, img.src);
          rowChildren.removeChild(tileWrapper);
        };
      });

      rowElement.appendChild(rowHeading);
      rowElement.appendChild(rowChildren);
      this.gridContainer.appendChild(rowElement);
      this.renderedTitles.add(row.title);
    }
  }

  /**
   * Adds all necessary event listeners.
   */
  addEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown(event) {
    const rows = document.querySelectorAll(".row-children");
    const currentRowElement = rows[this.currentRowId];
    const currentRow = this.rowMap.get(this.currentRowId);
    if (!currentRowElement) return;

    const tiles = currentRowElement.querySelectorAll(".tile");

    if (event.key === "ArrowRight") {
      if (currentRow.tileIndex < tiles.length - 1) {
        currentRow.tileIndex++;

        this.updateSelection(this.currentRowId);
      }
    } else if (event.key === "ArrowLeft") {
      if (currentRow.tileIndex > 0) {
        currentRow.tileIndex--;

        this.updateSelection(this.currentRowId);
      }
    } else if (event.key === "ArrowDown") {
      if (this.currentRowId < rows.length - 1) {
        if (
          Math.abs(rows.length - 1 - this.currentRowId) < SCROLL_THRESHOLD_ROWS
        ) {
          this.retrieveMoreRows();
        }
        document
          .querySelectorAll(".row")
          [this.currentRowId].querySelector(".item-title").textContent = "";
        this.updateSelection(this.currentRowId + 1);
      }
    } else if (event.key === "ArrowUp") {
      if (this.currentRowId > 0) {
        document
          .querySelectorAll(".row")
          [this.currentRowId].querySelector(".item-title").textContent = "";
        this.updateSelection(this.currentRowId - 1);
      }
    }
  }

  retrieveMoreRows() {
    let i = 0;
    while (this.nextRowQueue.length > 0 && i < ROW_FETCH_LIMIT) {
      i++;
      const refId = this.nextRowQueue.dequeue();
      const baseUrl = `${API_BASE_URL}${SETS_API_PATH}${refId}.json`;

      safeFetch(baseUrl)
        .then((responseJson) => {
          let data = responseJson?.data;
          var row;
          if (data.CuratedSet) {
            row = this.createRow(data.CuratedSet);
          } else if (data.TrendingSet) {
            row = this.createRow(data.TrendingSet);
          } else if (data.PersonalizedCuratedSet) {
            row = this.createRow(data.PersonalizedCuratedSet);
          }

          if (!this.renderedTitles.has(row.title)) {
            this.rowMap.set(row.id, row);
            this.renderQueue.enqueue(row.id);
          } else {
            console.warn(
              `Duplicate row recieved: \nrefId: ${refId}\nTitle: ${row.title}`
            );
          }
        })

        .then(() => {
          this.renderQueuedRows();
        });
    }
  }
}

// Entry point of the application
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
