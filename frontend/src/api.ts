import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

export type OverlayElement = {
  id: string
  type: 'text' | 'image'
  content: string
  x: number
  y: number
  w: number
  h: number
  opacity: number
  rotation: number
  zIndex: number
}

export type OverlayDoc = {
  _id?: string
  name: string
  description?: string
  elements: OverlayElement[]
}

export async function startStream(rtspUrl: string) {
  const { data } = await axios.post(`${API_BASE}/stream/start`, { rtspUrl });
  return data as { streamId: string; hlsUrl: string };
}

export async function stopStream(streamId: string) {
  const { data } = await axios.post(`${API_BASE}/stream/stop`, { streamId });
  return data as { stopped: boolean };
}

export async function createOverlay(doc: OverlayDoc) {
  const { data } = await axios.post(`${API_BASE}/overlays`, doc);
  return data as OverlayDoc;
}

export async function listOverlays() {
  const { data } = await axios.get(`${API_BASE}/overlays`);
  return data as OverlayDoc[];
}

export async function getOverlay(id: string) {
  const { data } = await axios.get(`${API_BASE}/overlays/${id}`);
  return data as OverlayDoc;
}

export async function updateOverlay(id: string, doc: Partial<OverlayDoc>) {
  const { data } = await axios.put(`${API_BASE}/overlays/${id}`, doc);
  return data as OverlayDoc;
}

export async function deleteOverlay(id: string) {
  const { data } = await axios.delete(`${API_BASE}/overlays/${id}`);
  return data as { deleted: boolean };
}
