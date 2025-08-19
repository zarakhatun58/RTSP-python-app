import React, { useEffect, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import OverlayCanvas from "../components/OverlayCanvas";
import bgImage from "../assets/netflix-bg.jpg";
import {
  createOverlay,
  deleteOverlay,
  getOverlay,
  listOverlays,
  OverlayDoc,
  OverlayElement,
  startStream,
  stopStream,
  updateOverlay,
} from "../api";

export default function Landing() {
  const [rtspUrl, setRtspUrl] = useState("");
  const [streamId, setStreamId] = useState<string | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [elements, setElements] = useState<OverlayElement[]>([]);
  const [saved, setSaved] = useState<OverlayDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
   const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

  // Load overlays on mount
  useEffect(() => {
    async function load() {
      const overlays = await listOverlays();
      if (overlays.length > 0) {
        setActiveOverlayId(overlays[0]._id!);
        setElements(overlays[0].elements);
      }
    }
    load();
  }, []);

  // Load saved presets from backend on mount
  useEffect(() => {
    listOverlays().then(setSaved).catch(console.error);
  }, []);

  /** Stream controls */
  const start = async () => {
    if (!rtspUrl) return alert("Enter an RTSP URL first.");
    const data = await startStream(rtspUrl);
    setStreamId(data.streamId);
    setHlsUrl(`http://localhost:8000${data.hlsUrl}`);
    // setHlsUrl(data.hlsUrl);
  };
  const stop = async () => {
    if (!streamId) return;
    await stopStream(streamId);
    setStreamId(null);
    setHlsUrl(null);
  };

  /** Overlay CRUD */
  const save = async () => {
    const name = prompt("Name this overlay preset:", "My Overlay");
    if (!name) return;
    const doc = await createOverlay({ name, elements });
    setSaved([doc, ...saved]);
    setSelectedId(doc._id!);
  };

  const load = async (id: string) => {
    const doc = await getOverlay(id);
    setElements(doc.elements || []);
    setSelectedId(id);
  };

  const update = async () => {
    if (!selectedId) return alert("Load a preset first.");
    const doc = await updateOverlay(selectedId, { elements });
    setElements(doc.elements || []);
    alert("Updated.");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this preset?")) return;
    await deleteOverlay(id);
    setSaved(saved.filter((s) => s._id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  /** Add overlay elements dynamically */
  const addText = () => {
    const id = `t-${Date.now()}`;
    setElements([
      ...elements,
      {
        id,
        type: "text",
        content: "New Text",
        x: 0.1,
        y: 0.1,
        w: 0.2,
        h: 0.1,
        opacity: 1,
        rotation: 0,
        zIndex: elements.length + 1,
      },
    ]);
  };

  const addImage = () => {
    const url = prompt("Enter image URL:", "https://placekitten.com/200/200");
    if (!url) return;
    const id = `i-${Date.now()}`;
    setElements([
      ...elements,
      {
        id,
        type: "image",
        content: url,
        x: 0.5,
        y: 0.5,
        w: 0.2,
        h: 0.2,
        opacity: 1,
        rotation: 0,
        zIndex: elements.length + 1,
      },
    ]);
  };

   // 🔑 updateElement = local state + backend sync
  const updateElement = async (id: string, changes: Partial<OverlayElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...changes } : el))
    );

    if (activeOverlayId) {
      try {
        await updateOverlay(activeOverlayId, {
          elements: elements.map((el) =>
            el.id === id ? { ...el, ...changes } : el
          ),
        });
        console.log("✅ Overlay updated on backend");
      } catch (err) {
        console.error("❌ Failed to update overlay:", err);
      }
    }
  };

  return (
    <div className="relative min-h-screen text-white">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-10">
          <section className="grid md:grid-cols-[2fr_1fr] gap-8">
            {/* Video */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
              <VideoPlayer src={hlsUrl} autoPlay />
              <div className="absolute inset-0">
                <OverlayCanvas elements={elements} updateElement={updateElement} />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Stream */}
              <div className="p-6 bg-white/10 rounded-2xl shadow-lg backdrop-blur-md space-y-4">
                <h3 className="font-semibold text-lg">🔗 RTSP Stream</h3>
                <input
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  placeholder="rtsp://..."
                  className="w-full rounded-lg bg-black/60 px-3 py-2 border border-gray-600 focus:border-pink-500 outline-none transition"
                />
                <div className="flex gap-3">
                  <button
                    onClick={start}
                    className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 shadow-md transition"
                  >
                    ▶ Start
                  </button>
                  <button
                    onClick={stop}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 shadow-md transition"
                  >
                    ⏹ Stop
                  </button>
                </div>
                <p className="text-xs text-gray-300">
                  Tip: Use a temporary RTSP source (e.g., rtsp.me) or an IP camera.
                </p>
              </div>

              {/* Presets */}
              <div className="p-6 bg-white/10 rounded-2xl shadow-lg backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">⭐ Overlay Presets</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={save}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 shadow"
                    >
                      + Save
                    </button>
                    <button
                      onClick={update}
                      className="px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 shadow"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Presets Table */}
                <div className="overflow-hidden rounded-xl border border-gray-700 shadow-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-black/70 text-gray-300">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Elements</th>
                        <th className="px-4 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 bg-black/50">
                      {saved.length > 0 ? (
                        saved.map((s) => (
                          <tr
                            key={s._id}
                            className="hover:bg-pink-500/20 transition cursor-pointer"
                          >
                            <td
                              onClick={() => load(s._id!)}
                              className="px-4 py-2 font-medium hover:text-pink-400"
                            >
                              {s.name}
                            </td>
                            <td className="px-4 py-2 text-gray-300">
                              {s.elements?.length ?? 0}
                            </td>
                            <td className="px-4 py-2 flex justify-center gap-2">
                              <button
                                onClick={() => load(s._id!)}
                                className="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700"
                              >
                                Load
                              </button>
                              <button
                                onClick={() => remove(s._id!)}
                                className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-4 text-center text-gray-400 italic"
                          >
                            No presets yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Element */}
              <div className="p-6 bg-white/10 rounded-2xl shadow-lg backdrop-blur-md space-y-3">
                <h3 className="font-semibold text-lg">➕ Add Element</h3>
                <div className="flex gap-3">
                  <button
                    onClick={addText}
                    className="flex-1 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 shadow"
                  >
                    + Text
                  </button>
                  <button
                    onClick={addImage}
                    className="flex-1 px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 shadow"
                  >
                    + Image
                  </button>
                </div>
                <p className="text-xs text-gray-300">
                  Drag/resize elements on the video. Positions are saved relative
                  to the player.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
