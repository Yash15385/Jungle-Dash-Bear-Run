# 🏃 Jungle Dash 3D

[![Live Demo](https://img.shields.io/badge/Play%20Live-jungle--dash--henna.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://jungle-dash-henna.vercel.app)
[![Built with Three.js](https://img.shields.io/badge/Built%20with-Three.js-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Powered by Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

A fast, responsive 3D endless runner built with **Three.js** and vanilla JavaScript, inspired by classics like *Subway Surfers*. Run along subway tracks, dodge oncoming trains, climb ramps, vault over jumpable hurdles, grab jetpacks, and surf on hoverboards!

🎮 **Play the live game here:** [https://jungle-dash-henna.vercel.app](https://jungle-dash-henna.vercel.app)

---

## 🚀 Getting Started

Follow these steps to run and customize your own copy of the game:

### 1. Fork the Repository
Click the **Fork** button at the top-right corner of this repository on GitHub to create your own copy under your GitHub account.

### 2. Clone Your Fork
Clone your newly forked repository to your local computer:

```bash
git clone https://github.com/<YOUR-USERNAME>/<REPO-NAME>.git
cd <REPO-NAME>
```

*(Replace `<YOUR-USERNAME>` and `<REPO-NAME>` with your GitHub username and repository name).*

### 3. Install Dependencies
Make sure you have [Node.js](https://nodejs.org/) (version 18 or newer recommended) installed, then run:

```bash
npm install
```

### 4. Start the Local Development Server
Launch the Vite development server:

```bash
npm run dev
```

Open your browser and navigate to the local URL displayed in your terminal (typically **`http://localhost:5173`**).

### 5. Build for Production
To bundle and optimize the project for production deployment:

```bash
npm run build
```

This creates an optimized, production-ready build in the `dist/` directory. You can preview the production build locally with:

```bash
npm run preview
```

---

## 🕹️ Controls

The game features zero-latency input for both desktop keyboards and mobile touchscreens:

| Action | Desktop Keyboard | Mobile Touch Gestures |
| :--- | :--- | :--- |
| **Change Lane Left** | `←` or `A` | **Swipe Left** |
| **Change Lane Right** | `→` or `D` | **Swipe Right** |
| **Jump** | `↑` or `W` | **Swipe Up** |
| **Slide / Fast Dive** | `↓` or `S` | **Swipe Down** |
| **Activate Hoverboard** | `Space` or `B` | **Double-Tap Screen** or tap **🛹 Hoverboard** |
| **Super Headstart** | Tap Rocket Button | Tap **🚀 Headstart** button |
| **Pause / Resume** | `Escape` or `P` | Tap **Ⅱ** Pause button |

> **Pro Tip for Mobile:** You can chain gestures fluidly without lifting your finger — swipe right and immediately swipe up to avoid a barrier and leap into the air! Swiping down while jumping immediately slams you back down into a slide.

---

## ✨ Game Features

- **🦝 Thief Chase**:
  - **The Jungle Bandit (Roy)**: A sneaky 3D raccoon bandit runs ahead of you on the tracks carrying a bulging loot sack and the stolen **Sacred Jungle Precision Stone**!
  - **Dynamic Pursuit & Parkour**: The thief dodges oncoming trains, leaps over hurdles, and glances back nervously over his shoulder as you gain on him.
  - **Proximity Radar HUD & Loot Drops**: Close in within 16 meters to trigger thief panic! He flails his arms, drops bundles of gleaming **Gold Bars** and rare **Sacred Precision Gems**, and scrambles forward with an alert squeak.
  - **Recover the Sacred Gem**: Snatch the dropped Precision Stones for massive score bonuses (+250) and bank coin riches!
- **Subway Tracks & Obstacles**: Run on a 3D perspective track with oncoming subway trains, rooftop running ramps, low slide barriers, and jumpable hurdles with arc coins.
- **Power-Ups & Gadgets**:
  - 🚀 **Jetpack**: Rocket high into the sky with procedural cone thruster flames and collect rows of sky coins.
  - 🛹 **Hoverboards**: Crash-protection shield that saves you from a fatal collision.
  - 🧲 **Coin Magnet**: Pulls all nearby coins into your wallet automatically.
  - 👟 **Super Sneakers**: High-altitude super jumps.
  - ⚡ **2x Multiplier**: Doubles your run score in real time.
- **Shop & Customization**: Purchase and equip runner characters, unique hoverboards, and power-up duration upgrades with in-game bank coins.
- **Missions & Rank**: Complete challenges (collect coins, jump hurdles, use hoverboards) to increase your permanent score multiplier.
- **Revive System ("Save Me!")**: Use keys or banked coins to revive and keep your record streak alive.
- **Audio & Sound Synthesizer**: Built-in procedural Web Audio sound effects for jumps, coin chimes, jetpacks, train horns, close calls, thief panic squeaks, gem chimes, and background beats.

---

## 🛠️ Tech Stack

- **Three.js** — 3D graphics, procedural meshes, track generation, lighting, and camera effects
- **Vite** — Next-generation frontend tooling and bundler
- **Web Audio API** — Synthesized spatial game sound effects and soundtrack
- **HTML5 Canvas / CSS3** — Responsive glassmorphic HUD, UI modals, and touch handling

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
