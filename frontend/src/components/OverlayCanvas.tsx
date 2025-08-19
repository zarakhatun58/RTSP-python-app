import React, { useState } from "react";
import { Rnd } from "react-rnd"; // <-- install with `npm install react-rnd`
import { OverlayElement } from "../api";

type Props = {
  elements: OverlayElement[];
  updateElement: (id: string, changes: Partial<OverlayElement>) => void;
};

export default function OverlayCanvas({ elements, updateElement }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempText, setTempText] = useState("");

  return (
    <div className="w-full h-full relative bg-black">
      {elements.map((el) => (
        <Rnd
          key={el.id}
          size={{ width: `${el.w * 100}%`, height: `${el.h * 100}%` }}
          position={{ x: el.x * window.innerWidth, y: el.y * window.innerHeight }}
          onDragStop={(_, d) => {
            updateElement(el.id, {
              x: d.x / window.innerWidth,
              y: d.y / window.innerHeight,
            });
          }}
          onResizeStop={(_, __, ref, ___, pos) => {
            updateElement(el.id, {
              w: ref.offsetWidth / window.innerWidth,
              h: ref.offsetHeight / window.innerHeight,
              x: pos.x / window.innerWidth,
              y: pos.y / window.innerHeight,
            });
          }}
          bounds="parent"
          style={{ zIndex: el.zIndex, opacity: el.opacity }}
        >
          <div
            className="w-full h-full flex items-center justify-center bg-transparent cursor-move"
            onDoubleClick={() => {
              if (el.type === "text") {
                setEditingId(el.id);
                setTempText(el.content);
              }
            }}
          >
            {el.type === "text" ? (
              editingId === el.id ? (
                <input
                  className="w-full h-full bg-black/70 text-white border border-pink-500 rounded p-1 text-sm"
                  autoFocus
                  value={tempText}
                  onChange={(e) => setTempText(e.target.value)}
                  onBlur={() => {
                    updateElement(el.id, { content: tempText });
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateElement(el.id, { content: tempText });
                      setEditingId(null);
                    }
                  }}
                />
              ) : (
                <span className="text-white font-bold select-none">
                  {el.content}
                </span>
              )
            ) : (
              <img
                src={el.content}
                alt=""
                className="w-full h-full object-contain pointer-events-none"
              />
            )}
          </div>
        </Rnd>
      ))}
    </div>
  );
}
