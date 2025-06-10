# Disney-Plus-UI
This project is a simplified Disney Plus UI, built with vanilla HTML, CSS, and JavaScript. It demonstrates dynamic content loading, and keyboard navigation.

---

## Features

* **Dynamic Content Loading:** Fetches and displays rows of streaming content from a mock API.
* **Lazy Loading:** As the user navigates down, new rows of content are automatically fetched and rendered, providing a smooth, continuous Browse experience.
* **Keyboard Navigation:** Fully navigable using arrow keys (Up, Down, Left, Right) to select content tiles and move between rows.
* **Preview Videos:** When a tile is selected, a muted preview video plays after a short delay, mimicking a common streaming UI pattern.
* **Modular JavaScript:** The codebase is organized into separate modules for better maintainability and readability (e.g., `App.js` for main logic, `DataService.js` for API interactions, `models.js` for data structures).

---

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/arman7rm/Disney-Plus-UI.git
    cd Disney-Plus-UI

    ```
2.  **Open `index.html` Important: Open with Live Server
---

## Usage

* Navigate through the content rows and tiles using your **keyboard arrow keys**.
* **Left/Right Arrows:** Move between titles within the current row.
* **Up/Down Arrows:** Move to the previous or next row.
* Observe the preview video playing when a tile is highlighted.
* Navigate to trigger the loading of more content rows.

---

## Future Enhancements

* **Responsiveness:** Optimize layout for mobile devices.
* **Accessibility:** Add more ARIA attributes for improved screen reader support.
* **Testing:** Add unit and integration tests for JavaScript modules.