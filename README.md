# Photobooth Template Studio

Browser editor for photobooth print templates.

[Open live demo →](https://studio.so.gl)

https://github.com/user-attachments/assets/83fa8b6d-d9aa-492b-9095-c552fdd15703

## Facts

- Builds grid and dual-strip layouts for a 3688 × 2480 px print.
- Edits photo slots, print trim, backgrounds, overlays, text, images and vector shapes.
- Shifts the second strip's photos and added artwork together, with the offset saved in the template.
- Imports existing template ZIPs or folders, including local fonts.
- Exports `config.json`, rendered PNG layers, editable project data and used fonts as one ZIP.
- Saves drafts in IndexedDB and publishes template folders directly to Yandex Disk. No application backend.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Network access is required for CDN dependencies.

## Deploy

Point the domain's DNS at the server and allow ports 22, 80 and 443. The server
must be reachable as root over SSH and be able to clone the Git origin. Run:

```sh
./deploy.sh root@your-server studio.so.gl
```

The server address is required and is not stored in the repository. The domain
argument defaults to `studio.so.gl`. To register a new Let's Encrypt account with
an email address for expiry notices, set `CERTBOT_EMAIL=you@example.com` when
running the command. Without one, Certbot uses an existing account or registers
without email notifications.

The script commits changes in `templates/`, pushes `main`, installs missing
Debian/Ubuntu packages, creates or fast-forwards the server checkout, configures
Nginx and obtains an HTTPS certificate. It sets up certificate renewal and an
Nginx reload hook. Commit other changes before running it. It refuses to replace
an unrelated server checkout or Nginx configuration.

## Stack

Vanilla JavaScript · Fabric.js · jQuery · Spectrum · Grapick
