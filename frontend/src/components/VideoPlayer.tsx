// src/components/VideoPlayer.tsx
import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

interface Props {
  src: string | null;
  autoPlay?: boolean;
}

export default function VideoPlayer({ src, autoPlay = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;

    // If HLS is supported via hls.js
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });
      return () => {
        hls.destroy();
      };
    }

    // If Safari supports HLS natively
    else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      if (autoPlay) {
        video.play().catch(console.error);
      }
    }
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      autoPlay={autoPlay}
      className="w-full h-[400px] bg-black rounded-lg"
    />
  );
}
