import { createEl, Queue } from "./utils.js";
import {
  PREVIEW_VIDEO_DELAY_MS,
  ROW_FETCH_LIMIT,
  SCROLL_THRESHOLD_ROWS,
  CSS_CLASSES,
} from "./constants.js";
import { dataService } from "./dataservice.js";

class App {
  // Static members for managing playing video after wait time
  static previewTimeout = null;
  static currentVideo = null;

  constructor() {
    this.nextRowQueue = new Queue();     // Stores upcoming refIds for lazy loading
    this.renderQueue = new Queue();      // Stores row IDs queued for rendering

    this.rowMap = new Map();             // Maps row IDs to row objects
    this.renderedRows = [];              // List of rendered rows to avoid duplicates
    this.currentRowId = 0;               // Currently selected row index

    this.gridContainer = document.querySelector(`.${CSS_CLASSES.GRID_CONTAINER}`);

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Initializes the app:
   * - Adds event listeners
   * - Loads initial data
   * - Renders initial rows
   * - Sets the current selected tile
   */
  async init() {
    this.addEventListeners();
    await this.initializeRowData();
    this.renderQueuedRows();
    this.updateSelection(0, true); // Select the first tile in the first row
  }

  /**
   * Fetches initial home screen rows and queues them for rendering.
   */
  async initializeRowData() {
    const { initialRows, nextRowRefIds } = await dataService.fetchInitialRows();

    initialRows.forEach((row) => {
      this.rowMap.set(row.id, row);
      this.renderQueue.enqueue(row.id);
    });

    nextRowRefIds.forEach((refId) => {
      this.nextRowQueue.enqueue(refId);
    });
  }

  /**
   * Updates the currently selected tile in the specified row.
   * @param {number} rowIndex
   */
  updateSelection(rowIndex) {
    if (!this.rowMap.has(this.renderedRows[rowIndex].id)) return;

    const rowObject = this.rowMap.get(this.renderedRows[rowIndex].id);
    const oldSelected = document.querySelector(".tile.selected");

    // Remove previous selection and preview video
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
    const row = rowElements[rowIndex];
    if (!row) return;

    const rowChildren = row.querySelector(".row-children");
    const tiles = rowChildren.querySelectorAll(".tile");
    const newTile = tiles[rowObject.tileIndex];

    if (newTile) {
      newTile.classList.add("selected");
      newTile.scrollIntoView({ behavior: "smooth", inline: "center" });

      // Scroll the row title into view
      const rowTitle = row.querySelector(".row-title");
      if (rowTitle) {
        rowTitle.scrollIntoView({ behavior: "smooth" });
      }

      // Scroll to top if it's the first row to view overHang
      if (rowIndex === 0) {
        document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
      }

      this.currentRowId = rowIndex;

      // Update title display
      const selectedTile = document.querySelector(".tile.selected");
      const title = selectedTile ? selectedTile.alt : null;
      row.querySelector(".item-title").textContent = ": " + title;

      // Schedule preview video
      App.previewTimeout = setTimeout(() => {
        const wrapper = newTile.closest(".tile-wrapper");
        const video = createEl("video");
        video.src = selectedTile.videoUrl;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.classList.add(CSS_CLASSES.PREVIEW_VIDEO);
        wrapper.appendChild(video);
        App.currentVideo = video;
      }, PREVIEW_VIDEO_DELAY_MS);
    }
  }

  /**
   * Renders all rows currently queued in renderQueue.
   */
  renderQueuedRows() {
    while (this.renderQueue.length > 0) {
      const row = this.rowMap.get(this.renderQueue.dequeue());

      // Create row container
      const rowElement = createEl("div", CSS_CLASSES.ROW);
      const rowHeading = createEl("div", CSS_CLASSES.ROW_HEADING);
      const rowTitle = createEl("h2", CSS_CLASSES.ROW_TITLE, row.title);
      const itemTitle = createEl("h3", [CSS_CLASSES.ITEM_TITLE]);

      rowHeading.appendChild(rowTitle);
      rowHeading.appendChild(itemTitle);

      const rowChildren = createEl("div", CSS_CLASSES.ROW_CHILDREN);
      rowChildren.setAttribute("role", "list");
      rowChildren.setAttribute("aria-label", `Row: ${row.title}`);

      // Add tiles to row
      row.children.forEach((item) => {
        const img = createEl("img");
        img.src = item.imageUrl;
        img.classList.add(CSS_CLASSES.TILE);
        img.alt = item.title;
        img.setAttribute("role", "listitem");
        img.setAttribute("tabindex", "-1");
        img.setAttribute("aria-label", item.title);
        img.videoUrl = item.videoArt;

        const tileWrapper = createEl("div", CSS_CLASSES.TILE_WRAPPER);
        tileWrapper.appendChild(img);
        rowChildren.appendChild(tileWrapper);

        // Handle broken image
        img.onerror = () => {
          console.warn(`Image failed to load for ${item.title}:`, img.src);
          rowChildren.removeChild(tileWrapper);
        };
      });

      rowElement.appendChild(rowHeading);
      rowElement.appendChild(rowChildren);
      this.gridContainer.appendChild(rowElement);
      this.renderedRows.push({ title: row.title, id: row.id });
    }
  }

  /**
   * Event listeners for keyboard navigation
   */
  addEventListeners() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  /**
   * Handles arrow key navigation between and within rows.
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    const rows = document.querySelectorAll(".row-children");
    const currentRowElement = rows[this.currentRowId];
    const currentRow = this.rowMap.get(this.renderedRows[this.currentRowId].id);
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
        // Fetch more rows if nearing bottom
        if (Math.abs(rows.length - 1 - this.currentRowId) < SCROLL_THRESHOLD_ROWS) {
          this.retrieveMoreRows();
        }
        document.querySelectorAll(".row")[this.currentRowId].querySelector(".item-title").textContent = "";
        this.updateSelection(this.currentRowId + 1);
      }
    } else if (event.key === "ArrowUp") {
      if (this.currentRowId > 0) {
        document.querySelectorAll(".row")[this.currentRowId].querySelector(".item-title").textContent = "";
        this.updateSelection(this.currentRowId - 1);
      }
    }
  }

  /**
   * Loads additional rows from the queue and renders them.
   */
  async retrieveMoreRows() {
    let numOfRows = 0;

    while (this.nextRowQueue.length > 0 && numOfRows < ROW_FETCH_LIMIT) {
      numOfRows++;
      const refId = this.nextRowQueue.dequeue();
      const row = await dataService.fetchRowbyRefId(refId);

      if (row && !this.renderedRows.some((r) => r.title === row.title)) {
        this.rowMap.set(row.id, row);
        this.renderQueue.enqueue(row.id);
      } else {
        console.warn(`Duplicate row received: \nrefId: ${refId}`);
      }

      this.renderQueuedRows();
    }
  }
}

// Entry point:
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
