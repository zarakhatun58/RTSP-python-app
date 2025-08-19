# Frontend (React + Vite + TS + Tailwind)

## Quick start
```bash
cd frontend
npm i
npm run dev
# open http://localhost:5173
```

> The dev server proxies `/api` and `/hls` to `http://localhost:8000` (Flask).

### Using the app
1. Start the backend (`python backend/app.py`) with FFmpeg installed.
2. Open the frontend, paste an RTSP URL (e.g., from rtsp.me), click **Start**.
3. Drag/resize overlay elements on the video.
4. Save overlay presets; load/update/delete them from the list.

### Notes
- Browsers cannot play RTSP directly. The backend transcodes to HLS and serves `/hls/<id>/index.m3u8`.
- For production, consider a process supervisor (systemd, PM2) for the ffmpeg job and using a CDN for HLS segments.
