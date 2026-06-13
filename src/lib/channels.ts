export interface Channel {
  id: string;
  name: string;
  streamUrl: string;
  backupUrls?: string[];
  logo: string;
  imageUrl?: string;
  category: "main" | "highlights" | "analysis" | "local";
  language: string;
  quality: "4K" | "FHD" | "HD" | "SD";
  viewers: number;
  liveViewers?: number;
  baseViewers?: number;
  isLive: boolean;
  currentMatch?: string;
  region: string;
  sortOrder?: number;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "upcoming" | "live" | "finished";
  minute?: number;
  kickoff: string;
  group?: string;
  stage: string;
  venue: string;
  channelIds: string[];
}

export const CHANNELS: Channel[] = [
  {
    id: "ch1",
    name: "Caze TV",
    streamUrl: "https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/1080p-vtt/index.m3u8",
    backupUrls: ["https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/1080p-vtt/index.m3u8"],
    logo: "⚽",
    category: "main",
    language: "EN",
    quality: "4K",
    viewers: 2847392,
    isLive: true,
    currentMatch: "BRA vs ARG",
    region: "Global",
  },
  {
    id: "ch2",
    name: "Bein",
    streamUrl: "https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8",
    logo: "🏆",
    category: "main",
    language: "ES",
    quality: "FHD",
    viewers: 1923847,
    isLive: true,
    currentMatch: "FRA vs GER",
    region: "Europe",
  },
  {
    id: "ch3",
    name: "T-Sports",
    streamUrl: "http://198.195.239.50:8095/tsports/index.m3u8",
    logo: "📺",
    category: "analysis",
    language: "EN",
    quality: "FHD",
    viewers: 743821,
    isLive: true,
    currentMatch: "Pre-match Analysis",
    region: "Global",
  },
  {
    id: "ch4",
    name: "Goal Rush",
    streamUrl: "http://198.195.239.50:8095/somoyTv/index.m3u8",
    logo: "🎯",
    category: "highlights",
    language: "EN",
    quality: "HD",
    viewers: 1284910,
    isLive: true,
    currentMatch: "Multi-match Highlights",
    region: "Global",
  },
  {
    id: "ch5",
    name: "Channel 24",
    streamUrl: "http://198.195.239.50:8095/channel24/index.m3u8",
    logo: "🌙",
    category: "main",
    language: "AR",
    quality: "FHD",
    viewers: 987234,
    isLive: true,
    currentMatch: "KSA vs JPN",
    region: "MENA",
  },
  {
    id: "ch6",
    name: "Euro Stream",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    logo: "🇪🇺",
    category: "main",
    language: "FR",
    quality: "4K",
    viewers: 654321,
    isLive: true,
    currentMatch: "FRA vs GER",
    region: "Europe",
  },
  {
    id: "ch7",
    name: "Studio Extra",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    logo: "🎙️",
    category: "analysis",
    language: "EN",
    quality: "HD",
    viewers: 312456,
    isLive: true,
    currentMatch: "Half-time Analysis",
    region: "Global",
  },
  {
    id: "ch8",
    name: "Asia Pacific",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    logo: "🌏",
    category: "local",
    language: "ZH",
    quality: "FHD",
    viewers: 2134567,
    isLive: true,
    currentMatch: "KOR vs AUS",
    region: "APAC",
  },
];

export const MATCHES: Match[] = [
  {
    id: "m1",
    homeTeam: "Brazil",
    awayTeam: "Argentina",
    homeFlag: "🇧🇷",
    awayFlag: "🇦🇷",
    homeScore: 2,
    awayScore: 1,
    status: "live",
    minute: 67,
    kickoff: "2026-06-12T18:00:00Z",
    stage: "Quarter Final",
    venue: "Lusail Stadium",
    channelIds: ["ch1"],
  },
  {
    id: "m2",
    homeTeam: "France",
    awayTeam: "Germany",
    homeFlag: "🇫🇷",
    awayFlag: "🇩🇪",
    homeScore: 1,
    awayScore: 1,
    status: "live",
    minute: 44,
    kickoff: "2026-06-12T15:00:00Z",
    stage: "Quarter Final",
    venue: "Al Bayt Stadium",
    channelIds: ["ch2", "ch6"],
  },
  {
    id: "m3",
    homeTeam: "Saudi Arabia",
    awayTeam: "Japan",
    homeFlag: "🇸🇦",
    awayFlag: "🇯🇵",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    kickoff: "2026-06-12T21:00:00Z",
    stage: "Quarter Final",
    venue: "Education City",
    channelIds: ["ch5"],
  },
  {
    id: "m4",
    homeTeam: "England",
    awayTeam: "Spain",
    homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    awayFlag: "🇪🇸",
    homeScore: 3,
    awayScore: 2,
    status: "finished",
    kickoff: "2026-06-11T18:00:00Z",
    stage: "Round of 16",
    venue: "Stadium 974",
    channelIds: [],
  },
  {
    id: "m5",
    homeTeam: "Korea",
    awayTeam: "Australia",
    homeFlag: "🇰🇷",
    awayFlag: "🇦🇺",
    homeScore: 0,
    awayScore: 0,
    status: "live",
    minute: 12,
    kickoff: "2026-06-12T12:00:00Z",
    stage: "Quarter Final",
    venue: "Ahmad Bin Ali",
    channelIds: ["ch8"],
  },
];
