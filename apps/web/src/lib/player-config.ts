export interface Source {
  url: string;
  type: string;
}

export const buildArtplayerConfig = (container: HTMLDivElement, source: Source) => ({
  container,
  url: source.url,
  type: source.type,
  autoplay: false,
  volume: 0.6,
  setting: true,
  hotkey: true,
  playbackRate: true,
  fullscreen: true,
  miniProgressBar: true,
  lock: true
});
