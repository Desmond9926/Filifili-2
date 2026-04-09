"use client";

import Artplayer from "artplayer";
import Hls from "hls.js";
import { useEffect, useRef } from "react";
import { buildArtplayerConfig, Source } from "@/lib/player-config";

function playM3u8(art: Artplayer, url: string, video: HTMLVideoElement) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    art.on("destroy", () => hls.destroy());
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
  } else {
    art.notice.show = "当前浏览器不支持 HLS";
  }
}

export default function Player({ source }: { source: Source }) {
  const ref = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!ref.current || !source.url) return;
    const art = new Artplayer(
      Object.assign(buildArtplayerConfig(ref.current, source), {
        customType: {
          m3u8: (video: HTMLVideoElement, url: string) => playM3u8(artRef.current!, url, video)
        }
      })
    );
    artRef.current = art;
    return () => art.destroy(false);
  }, [source.url, source.type]);

  return <div ref={ref} className="player-shell" />;
}
