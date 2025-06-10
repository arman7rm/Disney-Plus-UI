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
} from "./config.js";
//Stores refIds for rows to be rendered later

const nextRowQueue = new Queue();

//Stores rowIds that will be rendered when renderRows is invoked

const renderQueue = new Queue();

//Stores rows

const rowMap = new Map();

const renderedRows = new Set();

let currentRowId = 0;

const url = "https://cd-static.bamgrid.com/dp-117731241344/home.json";

function getImageUrl(title, data, size) {
  const images = data?.image?.tile?.[size];

  if (!images) {
    console.warn(`${title} No Image found for size`, size);

    return null;
  }

  return (
    Object.values(images).find((img) => img?.default?.url)?.default?.url ?? null
  );
}

function getItemData(item) {
  const data = {};

  data.full = item?.text?.title?.full;

  if (data.full) {
    for (let key in data.full) {
      data.title = data.full[key]?.default?.content;
    }
  }

  data.imageUrl = getImageUrl(data.title, item, "1.78");

  data.contentId = item.contentId;

  data.videoArt = item.videoArt?.[0]?.mediaMetadata?.urls?.[0]?.url;

  return data;
}

function createRow(set) {
  const row = {};

  row.id = rowMap.size;

  row.title = set?.text?.title?.full?.set?.default?.content;

  row.tileIndex = 0;

  row.children = [];

  set.items.forEach((item) => {
    row.children.push(getItemData(item));
  });

  return row;
}

async function retrieveMoreRows() {
  let i = 0;

  while (nextRowQueue.length > 0 && i < 2) {
    i++;

    const refId = nextRowQueue.dequeue();

    const baseUrl = `https://cd-static.bamgrid.com/dp-117731241344/sets/${refId}.json`;

    safeFetch(baseUrl)
      .then((responseJson) => {
        let data = responseJson?.data;

        var row;

        if (data.CuratedSet) {
          row = createRow(data.CuratedSet);
        } else if (data.TrendingSet) {
          row = createRow(data.TrendingSet);
        } else if (data.PersonalizedCuratedSet) {
          row = createRow(data.PersonalizedCuratedSet);
        }

        if (!renderedRows.has(row.title)) {
          rowMap.set(row.id, row);

          renderQueue.enqueue(row.id);
        } else {
          console.warn(
            `Duplicate row recieved: \nrefId: ${refId}\nTitle: ${row.title}`
          );
        }
      })

      .then(() => {
        renderRows();
      });
  }
}

let previewTimeout = null;

let currentVideo = null;

function updateSelection(newRowIndex) {
  const rowObject = rowMap.get(newRowIndex);

  const oldSelected = document.querySelector(".tile.selected");

  // Remove old video if exists

  if (oldSelected) {
    oldSelected.classList.remove("selected");

    const oldWrapper = oldSelected.closest(".tile-wrapper");

    const existingVideo = oldWrapper.querySelector(".preview-video");

    if (existingVideo) {
      existingVideo.remove();
    }

    clearTimeout(previewTimeout);
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

    currentRowId = newRowIndex;

    const selectedTile = document.querySelector(".tile.selected");

    const title = selectedTile ? selectedTile.alt : null;

    row.querySelector(".item-title").textContent = ": " + title;

    previewTimeout = setTimeout(() => {
      const wrapper = newTile.closest(".tile-wrapper");

      const video = createEl("video");

      video.src = selectedTile.videoUrl;

      video.autoplay = true;

      video.muted = true;

      video.loop = true;

      video.classList.add("preview-video");

      wrapper.appendChild(video);

      currentVideo = video;
    }, 3000);
  }
}

document.addEventListener("keydown", (event) => {
  const rows = document.querySelectorAll(".row-children");

  const currentRowElement = rows[currentRowId];

  const currentRow = rowMap.get(currentRowId);

  if (!currentRowElement) return;

  const tiles = currentRowElement.querySelectorAll(".tile");

  if (event.key === "ArrowRight") {
    if (currentRow.tileIndex < tiles.length - 1) {
      currentRow.tileIndex++;

      updateSelection(currentRowId);
    }
  } else if (event.key === "ArrowLeft") {
    if (currentRow.tileIndex > 0) {
      currentRow.tileIndex--;

      updateSelection(currentRowId);
    }
  } else if (event.key === "ArrowDown") {
    if (currentRowId < rows.length - 1) {
      if (Math.abs(rows.length - currentRowId - 1) <= 2) {
        retrieveMoreRows();
      }

      document

        .querySelectorAll(".row")

        [currentRowId].querySelector(".item-title").textContent = "";

      updateSelection(currentRowId + 1);
    }
  } else if (event.key === "ArrowUp") {
    if (currentRowId > 0) {
      document

        .querySelectorAll(".row")

        [currentRowId].querySelector(".item-title").textContent = "";

      updateSelection(currentRowId - 1);
    }
  }
});

function renderRows() {
  while (renderQueue.length > 0) {
    const row = rowMap.get(renderQueue.dequeue());

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

    document.querySelector(".grid-container").appendChild(rowElement);

    renderedRows.add(row.title);
  }
}

function initializeRowMap() {
  return safeFetch(url).then((response) => {
    const containers = response?.data?.StandardCollection?.containers;

    if (!containers) {
      console.error(
        "Error: Data could not be parsed. Invalid response structure."
      );

      return;
    }

    containers.forEach((container) => {
      if (container.set?.items) {
        const row = createRow(container.set);

        rowMap.set(row.id, row);

        renderQueue.enqueue(row.id);
      } else {
        nextRowQueue.enqueue(container?.set?.refId);
      }
    });
  });
}

function main() {
  initializeRowMap().then(() => {
    renderRows();

    updateSelection(0);
  });
}

main();
