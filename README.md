# Transcendance — Frontend
<video controls src="https://github.com/user-attachments/assets/89ccf654-f00b-473e-ac9e-316b53aac872" title="Title"></video>

This repository is the frontend for the [Transcendance](https://github.com/N1ghtm4reee/ft_transcendence-x10) project. It is written in TypeScript using my custom [Miku](https://github.com/WeismannS/miku) framework with tailwindcss for styling, and Bun for bundling and running local development servers.

---

## Technologies

- TypeScript
- [Miku](https://github.com/WeismannS/miku)
- TailwindCSS
- Bun (runtime & bundler)
- Biome (formatter)

---

## Quick start

Prerequisites:
- Bun installed — https://bun.sh/ (this project uses `bun` and `bunx` in scripts)

Install dependencies:

```
bun install
```

Development mode (watch build and serve public directory):

```
bunx serve -s -l 4000 public
# or use npm script
bun run dev
# or with bun directly
bun run dev
```
---

## Build for production

```
bun run build
```

This runs Tailwind to generate `public/output.css`, then builds a production-optimized bundle and places files into the `public` folder.

---

## Development details & scripts

Available scripts (see `package.json`):

- `dev` — watch and build files during development
- `start` — serve public folder on port 4000 (static server built-in Bun)
- `build` — production build (Tailwind + bun build) and minification
- `format` — run Biome (formatter) across the project

Run scripts with Bun:

```
bun run dev
bun run build
bun run start
bun run format
```

---

## Project structure

- `src/` — main TypeScript application code
- `src/pages/` — high-level page routes like `dashboard`, `home`, `profile` and `game`
- `src/services/api/` — API service calls and configuration
- `public/` — static content served by Bun (entry HTML is `public/index.html`)

---
