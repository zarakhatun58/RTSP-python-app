import os
import signal
import subprocess
import uuid
from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
import psutil  # safer process management
from bson import ObjectId

# Load .env file
load_dotenv()

# --------- Config from ENV ---------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "rtsp_overlay_app")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
HLS_ROOT = os.path.abspath(os.getenv("HLS_ROOT", "./hls"))
STATIC_ROOT = os.path.abspath(os.getenv("STATIC_ROOT", "./static"))
FFMPEG_BIN = os.getenv("FFMPEG_BIN", "ffmpeg")
PORT = int(os.getenv("PORT", "8000"))

# Ensure required dirs exist
os.makedirs(HLS_ROOT, exist_ok=True)
os.makedirs(STATIC_ROOT, exist_ok=True)

# --------- Flask + CORS ---------
app = Flask(__name__, static_folder=STATIC_ROOT)
CORS(app, resources={r"/api/*": {"origins": FRONTEND_URL}})

# --------- MongoDB ---------
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
overlays = db["overlays"]

# Track ffmpeg processes (memory only)
STREAM_PROCS = {}


# --------- Streaming Helpers ---------
def start_ffmpeg_hls(rtsp_url: str, stream_id: str):
    out_dir = os.path.join(HLS_ROOT, stream_id)
    os.makedirs(out_dir, exist_ok=True)

    cmd = [
        FFMPEG_BIN,
        "-rtsp_transport", "tcp",
        "-i", rtsp_url,
        "-fflags", "nobuffer",
        "-an",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-tune", "zerolatency",
        "-g", "48",
        "-sc_threshold", "0",
        "-f", "hls",
        "-hls_time", "2",
        "-hls_list_size", "5",
        "-hls_flags", "delete_segments+append_list",
        os.path.join(out_dir, "index.m3u8"),
    ]

    print("Running FFmpeg command:", " ".join(cmd))  # 👈 log command
    proc = subprocess.Popen(cmd)  # 👈 don’t suppress output
    STREAM_PROCS[stream_id] = proc
    return out_dir


def stop_ffmpeg_hls(stream_id: str):
    proc = STREAM_PROCS.get(stream_id)
    if proc and proc.poll() is None:
        try:
            # cross-platform kill
            parent = psutil.Process(proc.pid)
            for child in parent.children(recursive=True):
                child.kill()
            parent.kill()
        except Exception as e:
            print(f"Error stopping stream {stream_id}: {e}")
    STREAM_PROCS.pop(stream_id, None)
    return True


# --------- Routes ---------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True})


# --- HLS serving (supports nested dirs) ---
@app.route("/hls/<stream_id>/<path:filename>")
def serve_hls(stream_id, filename):
    dir_path = os.path.join(HLS_ROOT, stream_id)
    if not os.path.exists(os.path.join(dir_path, filename)):
        abort(404)
    return send_from_directory(dir_path, filename, as_attachment=False)


# --- Streaming control ---
@app.route("/api/stream/start", methods=["POST"])
def api_stream_start():
    data = request.get_json(force=True)
    rtsp_url = data.get("rtspUrl")
    if not rtsp_url:
        return jsonify({"error": "rtspUrl is required"}), 400

    stream_id = str(uuid.uuid4())
    start_ffmpeg_hls(rtsp_url, stream_id)
    hls_url = f"/hls/{stream_id}/index.m3u8"

    return jsonify({"streamId": stream_id, "hlsUrl": hls_url})


@app.route("/api/stream/stop", methods=["POST"])
def api_stream_stop():
    data = request.get_json(force=True)
    stream_id = data.get("streamId")
    if not stream_id:
        return jsonify({"error": "streamId is required"}), 400

    stop_ffmpeg_hls(stream_id)
    return jsonify({"stopped": True})


# --- CRUD: Overlays ---
# --- CRUD: Overlays ---
@app.route("/api/overlays", methods=["POST"])
def create_overlay():
    data = request.get_json(force=True)
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    data.setdefault("elements", [])
    res = overlays.insert_one(data)

    # Convert before sending response
    response_data = {**data, "_id": str(res.inserted_id)}
    return jsonify(response_data), 201


@app.route("/api/overlays", methods=["GET"])
def list_overlays():
    docs = []
    for doc in overlays.find().sort("_id", -1):
        doc["_id"] = str(doc["_id"])
        docs.append(doc)
    return jsonify(docs)


@app.route("/api/overlays/<overlay_id>", methods=["GET"])
def get_overlay(overlay_id):
    try:
        doc = overlays.find_one({"_id": ObjectId(overlay_id)})
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    if not doc:
        return jsonify({"error": "not found"}), 404

    doc["_id"] = str(doc["_id"])
    return jsonify(doc)


@app.route("/api/overlays/<overlay_id>", methods=["PUT"])
def update_overlay(overlay_id):
    payload = request.get_json(force=True)
    try:
        _id = ObjectId(overlay_id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    res = overlays.update_one({"_id": _id}, {"$set": payload})
    if res.matched_count == 0:
        return jsonify({"error": "not found"}), 404

    doc = overlays.find_one({"_id": _id})
    doc["_id"] = str(doc["_id"])
    return jsonify(doc)


@app.route("/api/overlays/<overlay_id>", methods=["DELETE"])
def delete_overlay(overlay_id):
    try:
        _id = ObjectId(overlay_id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    res = overlays.delete_one({"_id": _id})
    return jsonify({"deleted": res.deleted_count == 1})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
