# 🛠️ FFXIV Guildleve Calculator & Profit Optimizer

A high-performance, precision-engineered tool for Final Fantasy XIV crafters. Maximize your Gil earnings and optimize your leveling journey with real-time market data integration.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Universalis](https://img.shields.io/badge/Universalis-API-orange)](https://universalis.app/)

## Key Features

- **💰 Profit Optimization**: Real-time ranking of levequests by net profit (Revenue from turn-ins minus Crafting Costs).
- **📈 Advanced Leveling Pathing**: Intelligent recommendations for the fastest or most cost-effective XP gains.
- **🔍 Deep Market Integration**: Live price fetching from Universalis API with support for all Data Centers and Worlds.
- **🛠️ Precision Crafting Analysis**: Detailed breakdown of raw material costs, crystalline recipes, and sub-assembly requirements.
- **🌐 Global Ready**: Full localization for English and Simplified Chinese (CN) communities.
- **⚡ Performance First**: Optimized with SWR fetching, dynamic caching, and advanced IndexedDB state persistence.

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `pnpm` (recommended), `npm`, or `yarn`

### Installation

1. **Clone & Enter**
   ```bash
   git clone https://github.com/oovz/guildleve-calculator.git
   cd guildleve-calculator
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Initialize Game Data**
   The application requires internal game data to function. Run the build pipeline to synchronize with the latest patch data:
   ```bash
   pnpm run build:data
   ```
   *Note: This script fetches data from XIVAPI/CafeMaker and saves it to `public/data/` for the static build.*

4. **Launch Application**
   ```bash
   pnpm run dev
   ```
   Visit `http://localhost:3000` to start optimizing.

## Project Structure

- `src/app/`: Next.js 14 App Router pages, layouts, and global styles.
- `src/components/`: Reusable UI components including feature-specific views.
- `src/lib/`: Core business logic, profit calculators, and Universalis API integration.
- `src/scripts/`: Data build pipeline and automation scripts for game data updates.
- `scripts/`: Raw data processing utilities used by the build pipeline.
- `public/data/`: Static JSON data generated from game files.

## Deployment

This project is optimized for **GitHub Pages** using a static export strategy.

### Automated Deployment
The repository includes a GitHub Action (`.github/workflows/nextjs.yml`) that automatically builds and deploys the site whenever you push to the `main` branch.

**To enable:**
1. Go to your GitHub Repository **Settings**.
2. Navigate to **Pages** in the left sidebar.
3. Under **Build and deployment > Source**, select **GitHub Actions**.

## Data Automation

To keep the calculator accurate with the latest FFXIV patches, the building of static game data (Leves, Items, Recipes) is automated via GitHub Actions.

- **Weekly Update**: The `.github/workflows/data-update.yml` action runs every **Tuesday (00:00 UTC)** to fetch fresh data from XIVAPI.
- **Auto-Commit**: If changes are detected in the game data, the action automatically commits and pushes the updates back to the repository, which in turn triggers a fresh site deployment.

## License

This project is licensed under the [MIT License](LICENSE).

---
*Created with ❤️ for the FFXIV community.*
