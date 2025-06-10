export class RowModel {
  constructor(id, title) {
    this.id = id;
    this.title = title;
    this.children = [];
    this.tileIndex = 0;
  }
}

export class Tile{
    constructor(title, imageUrl, videoUrl){
        this.title = title;
        this.imageUrl = imageUrl;
        this.videoUrl = videoUrl;
    }
}
