# TrollMemo

A small Easter-themed memo game built with React, TypeScript, and Vite.

## Features

- 16 animated Easter egg cards
- Simple memory-match gameplay
- Responsive Vite + React + TypeScript setup

## Tech Stack

- React 19
- TypeScript
- Vite

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## GitHub Pages

This project includes a GitHub Actions workflow for GitHub Pages deployment.

After pushing the repo to GitHub:

1. Open the repository settings.
2. Go to `Pages`.
3. Set the source to `GitHub Actions`.
4. Push to the `main` branch to publish.

The workflow file lives in [.github/workflows/deploy-pages.yml](./.github/workflows/deploy-pages.yml).

## Project Structure

```text
src/
  components/
  game/
```

- `src/components` contains UI pieces like cards, panels, and confetti.
- `src/game` contains constants, effects, types, physics helpers, and game utilities.

## Notes

- The app is configured with `base: './'` in Vite so it works cleanly on GitHub Pages.
- Some effects are intentionally playful and slightly chaotic, since the eggs are meant to feel alive.

## License

You can add a license here before publishing if you want the repository to be clearly reusable by others.
