# Task: Update Reader Screen UI

## Objective
Update the Reader screen (likely `app/(reader)/[id].tsx` based on the routing structure) to exactly match the provided design mockup. The new design introduces a cleaner typography hierarchy, a distinct active sentence highlight, and an overhauled persistent bottom player bar.

## UI Breakdown & Requirements

### 1. Header Navigation
*   **Left Element:** Change to a simple left-pointing arrow icon (`<---` equivalent).
*   **Title:** Update text to "Now Reading", centered, dark semi-bold font.
*   **Right Element:** Change to a vertical three-dots menu icon.

### 2. Main Content Area (Scrollable)
*   **Article Title:** Large, bold dark typography (e.g., "The Evolution of Generative AI").
*   **Article Subtitle/Chapter:** Blue, semi-bold text below the title (e.g., "Chapter 4: Neural Architectures").
*   **Body Text:** Comfortable reading font, likely responsive. Light gray/slate color for inactive text. Lines should be comfortably spaced.
*   **Active Reading Highlight:**
    *   The specific sentence currently being read by the TTS engine must be highlighted.
    *   **Background:** Light blue tint with subtle rounded corners on the right side.
    *   **Border:** Distinct, thick solid blue border on the left edge.
    *   **Text:** Darker, high-contrast color than the surrounding text to ensure readability within the highlight block.

### 3. Persistent Bottom Player Bar
This section should be anchored permanently to the bottom of the screen. It has a white background layered over the content.

*   **Progress Section:**
    *   Top row info: Current time (`12:45`) on the left, completion percentage (`35% complete`) in the center in a smaller lighter font, and remaining time (`-24:10`) on the right.
    *   Progress Bar: Thin track, solid blue filled portion matching current time, and a distinct blue circular thumb/knob.
*   **Playback Controls:**
    *   **Voice Select (Far Left):** Icon of a person with sound waves, text "VOICE" underneath.
    *   **Skip Back 5s:** Circular back arrow with "5" inside.
    *   **Play/Pause (Center):** Prominent solid blue circle with white pause/play icon. Provide a soft, diffused blue drop shadow to make it pop.
    *   **Skip Forward 5s:** Circular forward arrow with "5" inside.
    *   **Speed (Far Right):** Bold text showing current speed (e.g., "1.25x") with "SPEED" underneath.
*   **Bottom Utility Navigation (Underneath Controls):**
    *   Three evenly spaced actions, utilizing gray icons and labels:
        *   List icon + "Contents"
        *   Bookmark icon + "Bookmarks"
        *   Gear/Cog icon + "Settings"

## Layout & Interaction Notes
*   **Spacing:** Ensure generous padding around elements, particularly in the content body and above/below the playback controls.
*   **Scrolling:** Ensure the main text content scrolls entirely behind the sticky bottom player bar, adding enough bottom padding to the scroll view so the last paragraph isn't hidden forever behind the player bar.
*   **Auto-scroll:** The active sentence highlight should smoothly auto-scroll into view when it changes in the background.
