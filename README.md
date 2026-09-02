# Photobooth Template Studio

Browser editor for photobooth print templates.

[Open live demo →](https://studio.so.gl)

https://github.com/user-attachments/assets/83fa8b6d-d9aa-492b-9095-c552fdd15703

## Facts

- Builds grid and dual-strip layouts for a 3688 × 2480 px print.
- Edits photo slots, print trim, backgrounds, overlays, text, images and vector shapes.
- Imports existing template ZIPs or folders, including local fonts.
- Exports `config.json`, rendered PNG layers, editable project data and used fonts as one ZIP.
- Saves drafts in IndexedDB and publishes template folders directly to Yandex Disk. No application backend.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Network access is required for CDN dependencies.

## Stack

Vanilla JavaScript · Fabric.js · jQuery · Spectrum · Grapick
