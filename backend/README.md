# Backend (Flask) — RTSP Livestream + Overlays API

## Prereqs
- Python 3.10+
- FFmpeg installed and on PATH (`ffmpeg -version`)
- MongoDB running (local or cloud).

## Quick start
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure env
cp .env.sample .env
# Edit .env to set MONGODB_URI, etc.

python app.py
# Server runs at http://localhost:8000
```

## Environment
Create a `.env` file based on `.env.sample`:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=rtsp_overlay_app
FRONTEND_URL=http://localhost:5173
HLS_ROOT=./hls
STATIC_ROOT=./static
FFMPEG_BIN=ffmpeg
PORT=8000
```

## Streaming endpoints
- `POST /api/stream/start`
  - Body: `{ "rtspUrl": "rtsp://..." }`
  - Starts an `ffmpeg` job that converts the RTSP stream to HLS in `./hls/<streamId>/index.m3u8`.
  - Returns: `{ "streamId": "<uuid>", "hlsUrl": "/hls/<uuid>/index.m3u8" }`
- `POST /api/stream/stop`
  - Body: `{ "streamId": "<uuid>" }`
  - Stops the ffmpeg process.

> Note: Browsers can't play RTSP directly. This backend transcodes RTSP to HLS (M3U8), which the React frontend plays using hls.js. Keep FFmpeg installed and the server running for live playback.

## Overlays CRUD
- `POST /api/overlays` — create overlay settings.
- `GET /api/overlays` — list overlays.
- `GET /api/overlays/:id` — get overlay.
- `PUT /api/overlays/:id` — update overlay.
- `DELETE /api/overlays/:id` — delete overlay.

### Overlay document example
```json
{
  "name": "Bottom-left tag",
  "description": "Brand watermark and ticker",
  "elements": [
    {
      "id": "el-1",
      "type": "image",
      "content": "https://example.com/logo.png",
      "x": 0.03,
      "y": 0.75,
      "w": 0.2,
      "h": 0.2,
      "opacity": 0.9,
      "rotation": 0,
      "zIndex": 1
    },
    {
      "id": "el-2",
      "type": "text",
      "content": "LIVE",
      "x": 0.02,
      "y": 0.03,
      "w": 0.15,
      "h": 0.08,
      "opacity": 1,
      "rotation": 0,
      "zIndex": 2
    }
  ]
}
```

## API Docs (OpenAPI-ish)
```
GET  /api/health

POST /api/stream/start
    body: { rtspUrl: string }
    200: { streamId: string, hlsUrl: string }

POST /api/stream/stop
    body: { streamId: string }
    200: { stopped: boolean }

POST   /api/overlays
GET    /api/overlays
GET    /api/overlays/:id
PUT    /api/overlays/:id
DELETE /api/overlays/:id
```

python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
