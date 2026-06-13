import { create } from "zustand";
import { Channel } from "@/lib/channels";

export interface QualityLevel {
  id: string;
  label: string;
  height: number;
  bitrate: number;
  index: number;
}

interface PlayerState {
  activeChannel: Channel | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  quality: string;
  qualityLevels: QualityLevel[];
  isLoading: boolean;
  isFullscreen: boolean;
  isTheaterMode: boolean;
  bufferHealth: number;
  latency: number;
  bitrate: number;
  setActiveChannel: (channel: Channel) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setQuality: (quality: string) => void;
  setQualityLevels: (levels: QualityLevel[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsFullscreen: (fs: boolean) => void;
  setIsTheaterMode: (theater: boolean) => void;
  setBufferHealth: (health: number) => void;
  setLatency: (latency: number) => void;
  setBitrate: (bitrate: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  activeChannel: null,
  isPlaying: false,
  isMuted: false,
  volume: 80,
  quality: "auto",
  qualityLevels: [],
  isLoading: false,
  isFullscreen: false,
  isTheaterMode: false,
  bufferHealth: 0,
  latency: 0,
  bitrate: 0,
  setActiveChannel: (channel) =>
    set({
      activeChannel: channel,
      isPlaying: true,
      quality: "auto",
      qualityLevels: [],
      isLoading: true,
      bufferHealth: 0,
      latency: 0,
      bitrate: 0,
    }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setVolume: (volume) => set({ volume }),
  setQuality: (quality) => set({ quality }),
  setQualityLevels: (qualityLevels) => set({ qualityLevels }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsTheaterMode: (isTheaterMode) => set({ isTheaterMode }),
  setBufferHealth: (bufferHealth) => set({ bufferHealth }),
  setLatency: (latency) => set({ latency }),
  setBitrate: (bitrate) => set({ bitrate }),
}));
