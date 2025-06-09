class Queue {
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
  const aspectRatio = data?.image?.tile[size];
  if (aspectRatio) {
    for (let key in aspectRatio) {
      var imageUrl = aspectRatio[key]?.default?.url;
      if (imageUrl) return imageUrl;
    }
  } else {
    console.warn(`${title} No Image found for size`, size);
  }
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

async function fetchData(url) {
  return fetch(url)
    .then((response) => response.json())
    .catch((err) => {
      console.error("Failed to fetch data:", err);
    });
}

async function retrieveMoreRows() {
  let i = 0;
  while (nextRowQueue.length > 0 && i < 2) {
    i++;
    const refId = nextRowQueue.dequeue();
    const baseUrl = `https://cd-static.bamgrid.com/dp-117731241344/sets/${refId}.json`;
    fetchData(baseUrl)
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

function updateSelection(newRowIndex) {
  const rowObject = rowMap.get(newRowIndex);
  const oldSelected = document.querySelector(".tile.selected");
  if (oldSelected) {
    oldSelected.classList.remove("selected");
  }
  const rowElements = document.querySelectorAll(".row");
  const row = rowElements[newRowIndex];

  if (!row) return;

  const rowChildren = row.querySelector(".row-children");
  const tiles = rowChildren.querySelectorAll(".tile");
  const newTile = tiles[rowObject.tileIndex];

  if (newTile) {
    newTile.classList.add("selected");
    newTile.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

    const rowTitle = row.querySelector(".row-title");
    if (rowTitle) {
      rowTitle.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    if (newRowIndex === 0) {
      document.documentElement.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    currentRowId = newRowIndex;
  }

  const selectedTile = document.querySelector(".tile.selected");
  const title = selectedTile ? selectedTile.alt : null;
  row.querySelector(".item-title").textContent = ":  " + title;
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
      document.querySelectorAll('.row')[currentRowId].querySelector('.item-title').textContent = '';
      updateSelection(currentRowId + 1);
    }
  } else if (event.key === "ArrowUp") {
    if (currentRowId > 0) {
      document.querySelectorAll('.row')[currentRowId].querySelector('.item-title').textContent = '';
      updateSelection(currentRowId - 1);
    }
  }
});

function renderRows() {
  while (renderQueue.length > 0) {
    const row = rowMap.get(renderQueue.dequeue());
    const rowElement = document.createElement("div");
    rowElement.classList.add("row");

    const rowHeading = document.createElement("div");
    rowHeading.classList.add("row-heading");

    const rowTitle = document.createElement("h2");
    rowTitle.textContent = row.title;
    rowTitle.classList.add("row-title");

    const itemTitle = document.createElement("h2");
    itemTitle.classList.add("item-title");

    rowHeading.appendChild(rowTitle);
    rowHeading.appendChild(itemTitle);

    const rowChildren = document.createElement("div");
    rowChildren.classList.add("row-children");

    row.children.forEach((item) => {
      const img = document.createElement("img");
      img.src = item.imageUrl;
      img.classList.add("tile");
      img.alt = item.title;
      rowChildren.appendChild(img);
      img.onerror = () => {
        console.warn(`Image failed to load for ${item.title}:`, img.src);
        rowChildren.removeChild(img);
      };
    });

    rowElement.appendChild(rowHeading);
    rowElement.appendChild(rowChildren);
    document.querySelector(".grid-container").appendChild(rowElement);
    renderedRows.add(row.title);
  }
}

function initializeRowMap() {
  return fetchData(url).then((response) => {
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
