export class RowModel {
  static nextId = 0;

  constructor(title) {
    this.id = RowModel.nextId++;
    this.title = title;
    this.children = [];
    this.tileIndex = 0;
  }
}

export class Tile {
  constructor(title, imageUrl, videoUrl) {
    this.title = title;
    this.imageUrl = imageUrl;
    this.videoUrl = videoUrl;
  }
}
