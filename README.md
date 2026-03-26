# Force 1080p on Twitch & Kick 🎥

[![Version](https://img.shields.io/badge/Version-1.3-blue.svg)](https://update.greasyfork.org/scripts/571237/Force%201080p%20on%20Twitch%20%20Kick.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A [Tampermonkey](https://www.tampermonkey.net/) userscript that automatically forces the highest available video quality (1080p) on **Twitch.tv** and **Kick.com**. 

This tool eliminates the annoying issue of default players automatically lowering video quality, ensuring an uninterrupted viewing experience in high definition.

## ✨ Key Features

* **Auto-Force 1080p:** The script automatically opens the player's settings menu, selects 1080p (or the highest available quality, ignoring the "Auto" mode), and instantly closes the menu without disrupting your stream.
* **Quality Watcher:** Runs in the background and monitors the current resolution every 2 seconds. If the player drops the quality on its own (e.g., due to a temporary network drop), the script immediately restores it to 1080p.
* **Seamless Channel Switching (SPA):** By utilizing a `MutationObserver`, the script detects when you switch channels without a page reload and automatically resets its operation for the new stream.
* **Stealth Operation:** An improved auto-close mechanism ensures that the menu navigation and quality change process is practically invisible to the user.

## 🛠 Installation

1. Install a userscript manager extension for your browser:
   * [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   * [Violentmonkey](https://violentmonkey.github.io/)
2. Install the script directly from GreasyFork:
   * 👉 **[Install the script](https://update.greasyfork.org/scripts/571237/Force%201080p%20on%20Twitch%20%20Kick.user.js)**
3. Refresh any open Twitch or Kick tabs.

## ⚙️ How it works

The script is injected into `*://*.twitch.tv/*` and `*://*.kick.com/*`. Once the video player loads, it:
1. Scans the page structure to find the settings "cog" button.
2. Simulates user clicks to navigate through the quality menu.
3. Selects the option containing `1080` (bypassing any variants labeled `Auto`).
4. Starts a verification loop that continuously checks the height of the main `<video>` element to prevent quality drops.

## 📜 License

This project is licensed under the **MIT License**. Details can be found in the script header. Feel free to modify and share it.
