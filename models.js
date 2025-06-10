/**
 * Represents a row of tiles (e.g., a horizontal scrollable row of media content).
 */
export class RowModel {
    /**
     * Tracks the next available unique ID for rows.
     * @type {number}
     */
    static nextId = 0;
  
    constructor(title) {
      /**
       * Unique ID for this row instance.
       * @type {number}
       */
      this.id = RowModel.nextId++;
  
      this.title = title;
  
      /**
       * List of Tile objects in this row.
       * @type {Tile[]}
       */
      this.children = [];
  
      /**
       * The currently selected tile index in this row.
       * @type {number}
       */
      this.tileIndex = 0;
    }
  }
  
  /**
   * Represents a single tile/item within a row.
   */
  export class Tile {
    constructor(title, imageUrl, videoUrl) {
      this.title = title;
      this.imageUrl = imageUrl;
      this.videoUrl = videoUrl;
    }
  }
  