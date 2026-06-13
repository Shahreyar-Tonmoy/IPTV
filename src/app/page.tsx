import type { Metadata } from "next";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import ChannelList from "@/components/ChannelList";

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 — Live Streaming",
  description: "Watch FIFA World Cup 2026 live. All matches, all channels, ultra-low latency.",
};

export default function Home() {
  return (
    <main className="app-root">
      <Header />
      <div className="app-body">
        <div className="main-area">
          <VideoPlayer />
        
        </div>
        <ChannelList />
      </div>
    </main>
  );
}
