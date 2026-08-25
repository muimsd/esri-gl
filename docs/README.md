# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static
contents hosting service (`npm run serve` previews it locally).

Both commands can also be run from the repository root as `npm run dev:docs` / `npm run build:docs`.

## Deployment

The published site at <https://esri-gl.pages.dev> is built from this directory by the hosting
provider; there is no manual deploy step. `npm run deploy` (Docusaurus' GitHub Pages deploy) is
available but unused.
