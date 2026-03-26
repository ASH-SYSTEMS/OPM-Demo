# OPM-Pro v1

OPM-Pro is a professional Object-Process Methodology (OPM) modeling tool built with React and Konva. It allows users to create, edit, and export OPM models following the ISO 19450 standard.

## Features

- **Standard OPM Elements**: Create Objects, Processes, and States.
- **Hierarchical Modeling**: Support for in-zooming (nested subprocesses) and states within objects.
- **Procedural & Structural Links**: Full support for Agent, Instrument, Consumption, Result, Effect, Aggregation, Exhibition, Generalization, and Instantiation links.
- **Automatic OPL Generation**: Real-time generation of Object-Process Language (OPL) sentences.
- **Cardinality Support**: Specify and display cardinality/multiplicity for all link types.
- **Surface-Bound Anchors**: Links automatically snap to the boundaries of elements.
- **Import/Export**: Save and load your models as JSON files.

## Prerequisites

- **Node.js**: Version 18 or higher is recommended.
- **npm**: Usually comes bundled with Node.js.

## Installation

1. Clone or download the project files.
2. Open a terminal or command prompt in the project root directory.
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Running the Application

To start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## Deployment to GitHub Pages

This project is configured to be deployed easily to GitHub Pages.

1.  **Push your code to a GitHub repository.**
2.  **Enable GitHub Actions for Pages:**
    -   Go to your repository **Settings** > **Pages**.
    -   Under **Build and deployment** > **Source**, select **GitHub Actions**.
3.  **The included workflow** (`.github/workflows/deploy.yml`) will automatically build and deploy your app whenever you push to the `main` branch.

The `vite.config.ts` is configured with `base: './'` to ensure that assets are loaded correctly even if your app is hosted in a repository subdirectory (e.g., `https://username.github.io/repo-name/`).

## Project Structure

- `src/App.tsx`: Main application logic and UI.
- `src/types.ts`: TypeScript interfaces for OPM elements and links.
- `src/services/oplService.ts`: Logic for generating OPL sentences.
- `src/index.css`: Global styles and Tailwind CSS configuration.
