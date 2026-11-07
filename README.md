# COSMOS — Explore the Universe

A lightweight, responsive solar-system explorer built with React, Vite, Tailwind CSS, Motion for React, and Lucide icons. The planet visuals are CSS illustrations; the experience does not require WebGL, external image hosting, or an API key.

## Run locally

Requirements: Node.js 18+ and npm.

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, or preview it locally with `npm run preview`.

## Features

- Cinematic landing section, responsive navigation, scroll progress, and reduced-motion support.
- Interactive eight-planet selector, filterable/searchable planet archive, and accessible planet detail dialogs.
- Persistent favorites stored in browser localStorage.
- Side-by-side diameter, orbital-period, and mean-distance comparisons using the included planet data.
- CSS-built deep-space discovery illustrations and planet visuals; no WebGL fallback is needed.
- Search overlay with `Ctrl+K` / `Cmd+K` shortcut.

## Planet data

Planet content lives in [`src/data/planets.js`](./src/data/planets.js). Distances are mean distances from the Sun, diameters and orbital periods are rounded for display, and temperatures are labeled by measurement context. Moon counts are explicitly identified as known counts because confirmations can change. Edit the values and descriptions in that file to customize the archive.

Values are based on NASA's [planetary fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) and [Solar System exploration pages](https://science.nasa.gov/solar-system/planets/); they are educational summaries, not live ephemerides. Moon counts are a static reference snapshot and should be checked against current NASA/IAU catalogs before scientific use.

## Optional NASA APOD

An Astronomy Picture of the Day integration is not enabled; the Discover section uses local CSS artwork so it is available offline and cannot fail due to network/API issues. `.env.example` documents the optional `VITE_NASA_API_KEY` variable if an APOD integration is added later. Any Vite environment variable embedded in a frontend build is public to site visitors; use a server-side proxy for production secrets.

## Limitations

- Planet and discovery visuals are stylized CSS artwork rather than photographs or scientific renderings.
- The orbital diagram is illustrative, not to scale.
- Favorites are local to the current browser and device; there is no account or cross-device sync.
- Planet data is a static educational snapshot and may need refresh as discoveries and reference values change.
