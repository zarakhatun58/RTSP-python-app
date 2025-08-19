#ffmpeg_manager.py
import subprocess
import psutil

_processes = {}

def start_ffmpeg(rtsp_url: str, stream_id: str, output_path: str):
    """Start an ffmpeg process and store it by stream_id"""
    cmd = [
        "ffmpeg", "-i", rtsp_url,
        "-c:v", "copy", "-c:a", "aac",
        "-f", "hls", "-hls_time", "4",
        "-hls_list_size", "5",
        "-hls_flags", "delete_segments",
        output_path
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    _processes[stream_id] = proc
    return proc

def stop_ffmpeg(stream_id: str):
    """Stop ffmpeg process by stream_id"""
    proc = _processes.get(stream_id)
    if proc:
        try:
            parent = psutil.Process(proc.pid)
            for child in parent.children(recursive=True):
                child.kill()
            parent.kill()
        except Exception as e:
            print(f"Error stopping ffmpeg: {e}")
        finally:
            _processes.pop(stream_id, None)
        return True
    return False
