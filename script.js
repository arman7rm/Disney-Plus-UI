const url = "https://cd-static.bamgrid.com/dp-117731241344/home.json";
var containers = [];
var rows = [];
var queue = [];
var renderedRows = new Set();

async function getData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.log("failed to fetch data", err);
  }
}

function setContainers(responseJson) {
  containers = responseJson?.data?.StandardCollection?.containers;
  if (!containers) {
    console.error(
      "Failed to extract containers from response JSON: 'StandardCollection.containers' is undefined or null."
    );
  }
}

function setRows() {
  containers.forEach((container) => {
    var items = container?.set?.items;
    if (items) {
      rows.push(createRow(items, container.set));
    } else {
      queue.push({
        id: container?.set?.refId,
        title: container.set.text.title.full.set.default.content,
      });
    }
  });
}

function createRow(items, set) {
  var row = {};
  row.title = set?.text?.title?.full?.set?.default?.content;
  row.children = [];
  items.forEach((item) => {
    var itemData = GetItemData(item);
    row.children.push(itemData);
  });
  return row;
}

function GetItemData(item) {
  var data = {
    title: "",
    tile: "",
    contentId: "",
  };

  data.full = item?.text?.title?.full;
  if (data.full) {
    for (let key in data.full) {
      data.title = data.full[key]?.default?.content;
    }
  }

  data.tile = getImageUrl(item, "1.78");
  data.contentId = item.contentId;
  return data;
}

function getImageUrl(data, size) {
  const aspectRatio = data?.image?.tile[size];
  if (aspectRatio) {
    for (let key in aspectRatio) {
      var imageUrl = aspectRatio[key]?.default?.url;
      if (imageUrl) return imageUrl;
    }
  } else {
    console.log("Error: No Image found for size ", size);
  }
}

function renderRows(startIndex) {
  for (let i = startIndex; i < rows.length; i++) {
    var row = rows[i];
    const rowElement = document.createElement("div");
    rowElement.classList.add("row");

    const rowTitle = document.createElement("h2");
    rowTitle.textContent = row.title;
    rowTitle.classList.add("row-title");

    const rowChildren = document.createElement("div");
    rowChildren.classList.add("row-children");

    row.children.forEach((item) => {
      const img = document.createElement("img");
      img.src = item.tile;
      img.classList.add("tile");
      rowChildren.appendChild(img);
    });

    rowElement.appendChild(rowTitle);
    rowElement.appendChild(rowChildren);
    rowIndexMap[i] = 0;
    document.querySelector(".grid-container").appendChild(rowElement);
    renderedRows.add(row.title);
  }
}

let currentRowIndex = 0;
let currentTileIndex = 0;

var rowIndexMap = new Map();

function updateSelection(newRowIndex, newTileIndex) {
  const oldSelected = document.querySelector(".tile.selected");
  if (oldSelected) {
    oldSelected.classList.remove("selected");
  }

  const rowElements = document.querySelectorAll(".row");
  const row = rowElements[newRowIndex];
  if (!row) return;

  const rowChildren = row.querySelector(".row-children");
  const tiles = rowChildren.querySelectorAll(".tile");
  const newTile = tiles[newTileIndex];

  if (newTile) {
    newTile.classList.add("selected");

    newTile.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

    const rowTitle = row.querySelector(".row-title");
    if (rowTitle) {
      console.log("scrolling to row");
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

    currentRowIndex = newRowIndex;
    currentTileIndex = newTileIndex;
  }
}

document.addEventListener("keydown", (event) => {
  const rows = document.querySelectorAll(".row-children");
  const currentRow = rows[currentRowIndex];
  if (!currentRow) return;

  const tiles = currentRow.querySelectorAll(".tile");

  if (event.key === "ArrowRight") {
    if (currentTileIndex < tiles.length - 1) {
      rowIndexMap[currentRowIndex]++;
      updateSelection(currentRowIndex, currentTileIndex + 1);
    }
  } else if (event.key === "ArrowLeft") {
    if (currentTileIndex > 0) {
      const prevColIndex = rowIndexMap[currentRowIndex];
      rowIndexMap[currentRowIndex] =
        prevColIndex > 0 ? prevColIndex - 1 : prevColIndex;
      updateSelection(currentRowIndex, currentTileIndex - 1);
    }
  } else if (event.key === "ArrowDown") {
    if (currentRowIndex < rows.length - 1) {
      const newIndex = rowIndexMap[currentRowIndex + 1];
      if (Math.abs(rows.length - currentRowIndex - 1) <= 2) {
        retrieveMoreRows();
      }
      updateSelection(currentRowIndex + 1, newIndex);
    }
  } else if (event.key === "ArrowUp") {
    if (currentRowIndex > 0) {
      const newIndex = rowIndexMap[currentRowIndex - 1];
      updateSelection(currentRowIndex - 1, newIndex);
    }
  }
});

async function retrieveMoreRows() {
  let i = 0;
  var prevRowLength = rows.length;
  while (queue.length > 0 && i < 2) {
    i++;
    let { id, title } = queue.shift();
    let baseUrl = `https://cd-static.bamgrid.com/dp-117731241344/sets/${id}.json`;
    const responseJson = await getData(baseUrl);
    let data = responseJson?.data;
    if (data.CuratedSet) {
      var row = createRow(data.CuratedSet.items, data.CuratedSet);
      if (renderedRows.has(row.title)) continue;
      rows.push(row);
    } else if (data.TrendingSet) {
      var row = createRow(data.TrendingSet.items, data.TrendingSet);
      if (renderedRows.has(row.title)) continue;
      rows.push(row);
    } else if (data.PersonalizedCuratedSet) {
      var row = createRow(
        data.PersonalizedCuratedSet.items,
        data.PersonalizedCuratedSet
      );
      if (renderedRows.has(row.title)) continue;
      rows.push(row);
    }
  }
  renderRows(prevRowLength);
}

async function main() {
  const data = await getData(url);
  setContainers(data);
  setRows();
  renderRows(0);
  updateSelection(0, 0);
}
main();
