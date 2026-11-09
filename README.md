<p align="center">
  <img src="branding/social-preview.png" width="800" alt="SnapOtter - A Self-Hosted File Manipulation Suite">
</p>

# SnapOtter (fork)

Open-source, self-hosted file-processing suite: convert, compress, OCR, transcribe, strip metadata and run local AI across image, video, audio, PDF and documents, through a web UI, a REST API and pipelines. Your files never leave your network.

This is a fork of [snapotter-hq/SnapOtter](https://github.com/snapotter-hq/SnapOtter), maintained at [PabloVTM/SnapOtter](https://github.com/PabloVTM/SnapOtter). The interface uses the PabloSystems theme shared by the PabloVTM tools: Deep Sage Green `#4B5A50`, Warm Ivory `#F1EEE3` and Vibrant Vermillion Red `#F20B0B` for details, system monospace fonts and a `pablo@systems:~/snapotter` prompt, in light and dark modes.

![SnapOtter - Dashboard](branding/dashboard.gif)

## Image

Images are published to GitHub Container Registry for `linux/amd64` (with NVIDIA CUDA support) and `linux/arm64`:

| Tag | Content |
| --- | --- |
| `ghcr.io/pablovtm/snapotter:latest` | Latest build of `main`. |
| `ghcr.io/pablovtm/snapotter:YYYY-MM-DD` | Dated version, e.g. `2026-11-09`, published when a git tag of the same name is pushed. Each build upgrades the OS packages, so a new dated version also brings the latest security fixes. |

The image is the **community edition**: everything in this repository except `packages/enterprise`, which is under the SnapOtter Commercial License and may not be redistributed, so it is not built into the image. All tools, batch processing, pipelines and API keys work without it; the enterprise features (SAML/SCIM, S3 storage, audit and SIEM routes, distributed tracing) are not available.

## Quick start

```bash
docker run -d --name snapotter -p 1349:1349 -v snapotter-data:/data ghcr.io/pablovtm/snapotter:latest
```

Open http://localhost:1349 and log in with `admin` / `admin`; you are asked to change the password on first login. This single container embeds PostgreSQL 17 and Redis 8. The first start takes a few minutes; the container reports its health on `/api/v1/health`.

## Key Features

- **200+ tools across 5 modalities:**
  - **Image (112):** resize, crop, compress, convert, watermark, color adjust, beautify screenshots, generate memes, vectorize, GIF tools, find duplicates, passport photos, plus dedicated format converters (JPG to PNG, HEIC to JPG, WebP to PNG, image to PDF, and more). Supports 55+ input formats (including 23 camera RAW formats) and 17 output formats
  - **Video (57):** convert, compress, trim, resize, crop, merge, video-to-GIF, extract audio, stabilize, change FPS, burn/extract subtitles, plus dedicated converters (MOV to MP4, MKV to MP4, MP4 to MP3, and more)
  - **Audio (27):** convert, trim, normalize, volume, fade, pitch shift, silence removal, noise reduction, merge/split, waveform, plus dedicated converters (M4A to MP3, AAC to MP3, OGG to WAV, and more)
  - **PDF (35):** merge, split, compress, convert, protect/unlock, redact, sign, watermark, page numbers, multi-tool page editor, OCR, plus PDF to JPG/PNG/TIFF
  - **Files (23):** CSV/JSON/XML/YAML conversion, CSV merge/split, Excel to CSV, chart maker, ZIP create/extract
- **Image editor:** Free layer-based editor with brushes, shapes, adjustments, filters, curves, and keyboard shortcuts. Runs in your browser and processes on your hardware
- **Local AI:** Remove backgrounds, upscale images, restore and colorize old photos, erase objects, blur faces, enhance faces, extract text (OCR from images and PDFs), transcribe audio, auto-generate video subtitles, expand canvas, and fix transparency. All on your hardware, no internet required. Built-in Fast OCR adds about 25 MiB to the official image; the optional accuracy pack installs on demand
- **OIDC / SSO:** Login with Google, GitHub, Okta, or any OpenID Connect provider
- **21 languages:** English, Arabic, Chinese (Simplified & Traditional), Dutch, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Polish, Portuguese, Russian, Spanish, Swedish, Thai, Turkish, Ukrainian, Vietnamese. RTL support for Arabic
- **Pipelines:** Chain tools into reusable workflows, 20 steps by default (`MAX_PIPELINE_STEPS`). Import/export as JSON. Batch size is unlimited in the published image and 100 from a source build (`MAX_BATCH_SIZE`)
- **REST API:** Every tool available via API with API key auth. Interactive docs at `/api/docs`
- **Self-hosted:** one `docker run` for a single-container quick start (embedded Postgres 17 + Redis 8), or the same Postgres 17 + Redis 8 as a Compose stack for production. No external SaaS dependencies
- **Multi-arch:** Runs on AMD64 and ARM64 (Intel, Apple Silicon, Raspberry Pi)
- **Privacy first:** Your files never leave your network. This fork builds its image with analytics off (`SNAPOTTER_ANALYTICS=off`): no PostHog or Sentry calls

## Deployment

For production, run the app with its own PostgreSQL 17 and Redis 8. Save this as `compose.yaml`:

```yaml
services:
  snapotter:
    image: ghcr.io/pablovtm/snapotter:latest
    ports: ["1349:1349"]
    environment:
      # Requests are served by a role that can only read and write rows. The
      # owner connects only during boot, to migrate and to grant.
      DATABASE_URL: postgres://${POSTGRES_APP_USER:-snapotter_app}:${POSTGRES_APP_PASSWORD:-snapotter_app}@postgres:5432/${POSTGRES_DB:-snapotter}
      DATABASE_MIGRATION_URL: postgres://${POSTGRES_USER:-snapotter}:${POSTGRES_PASSWORD:-snapotter}@postgres:5432/${POSTGRES_DB:-snapotter}
      REDIS_URL: redis://redis:6379
    volumes:
      - snapotter-data:/data
    depends_on: [postgres, redis]
    restart: unless-stopped
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-snapotter}
      # Change this and POSTGRES_APP_PASSWORD for any non-local deployment.
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-snapotter}
      POSTGRES_DB: ${POSTGRES_DB:-snapotter}
    volumes: ["snapotter-pgdata:/var/lib/postgresql/data"]
    restart: unless-stopped
  redis:
    image: redis:8-alpine
    volumes: ["snapotter-redisdata:/data"]
    restart: unless-stopped
volumes:
  snapotter-data:
  snapotter-pgdata:
  snapotter-redisdata:
```

```bash
docker compose up -d
```

NVIDIA GPUs accelerate background removal, upscaling and transcription on the amd64 image; see the upstream [Docker Tags](https://docs.snapotter.com/guide/docker-tags) guide for the GPU Compose settings. Configuration, OIDC / SSO and the REST API are documented in the upstream [documentation](https://docs.snapotter.com).

## Releasing

Images are built by GitHub Actions on native amd64 and arm64 runners. A push to `main` publishes `latest`; a dated version is published by pushing a tag named after the day:

```bash
git tag 2026-11-09
git push origin 2026-11-09
```

The workflow smoke tests the image first (health, web UI, analytics off, no enterprise code), then publishes `ghcr.io/pablovtm/snapotter:2026-11-09` and `latest`. There is no scheduled rebuild: tag a new version when you want one.

## Building

```bash
docker build -f docker/Dockerfile -t snapotter:local .
```

The build compiles several native tools and needs a lot of disk space (the amd64 image sits on a CUDA base).

## Development

Requires Node.js 22 or later and pnpm 9.

```bash
pnpm install
pnpm dev          # API and web app with hot reload
pnpm lint
pnpm typecheck
pnpm test:unit
```

See the upstream [developer guide](https://docs.snapotter.com/guide/developer) for details.

## Credits

SnapOtter is created by [snapotter-hq](https://github.com/snapotter-hq) and its contributors; consider [sponsoring them](https://github.com/sponsors/snapotter-hq). This fork is maintained by [PabloVTM](https://github.com/PabloVTM).

## License

[AGPLv3](LICENSE), except `packages/enterprise`, which is under the SnapOtter Commercial License (see [LICENSING.md](LICENSING.md)). Under the AGPLv3, the source of this modified version is available at [PabloVTM/SnapOtter](https://github.com/PabloVTM/SnapOtter).
