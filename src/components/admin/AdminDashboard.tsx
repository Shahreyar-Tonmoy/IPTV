"use client";

/* eslint-disable @next/next/no-img-element */
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Channel } from "@/lib/channels";

type Asset = {
  id: string;
  title: string;
  url: string;
  type: "channel-icon" | "banner" | "other";
  alt?: string;
};

type AdminAccount = {
  id: string;
  username: string;
  displayName?: string;
  role: "admin";
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
};

type ChannelForm = {
  id?: string;
  name: string;
  streamUrl: string;
  backupUrls: string;
  logo: string;
  imageUrl: string;
  category: Channel["category"];
  language: string;
  quality: Channel["quality"];
  viewers: number;
  isLive: boolean;
  currentMatch: string;
  region: string;
  sortOrder: number;
};

const emptyChannel: ChannelForm = {
  name: "",
  streamUrl: "",
  backupUrls: "",
  logo: "TV",
  imageUrl: "",
  category: "main",
  language: "EN",
  quality: "HD",
  viewers: 0,
  isLive: true,
  currentMatch: "",
  region: "Global",
  sortOrder: 0,
};

const emptyAsset = {
  title: "",
  url: "",
  type: "channel-icon" as Asset["type"],
  alt: "",
};

const emptyAdminForm = {
  displayName: "",
  username: "",
  password: "",
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload as T;
}

function toForm(channel: Channel): ChannelForm {
  return {
    id: channel.id,
    name: channel.name,
    streamUrl: channel.streamUrl,
    backupUrls: (channel.backupUrls || []).join("\n"),
    logo: channel.logo,
    imageUrl: channel.imageUrl || "",
    category: channel.category,
    language: channel.language,
    quality: channel.quality,
    viewers: channel.viewers,
    isLive: channel.isLive,
    currentMatch: channel.currentMatch || "",
    region: channel.region,
    sortOrder: channel.sortOrder || 0,
  };
}

export default function AdminDashboard({ username }: { username: string }) {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [channelForm, setChannelForm] = useState<ChannelForm>(emptyChannel);
  const [assetForm, setAssetForm] = useState(emptyAsset);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [activeTab, setActiveTab] = useState<"channels" | "images" | "admins">("channels");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const totals = useMemo(
    () => ({
      live: channels.filter((channel) => channel.isLive).length,
      viewers: channels.reduce((sum, channel) => sum + channel.viewers, 0),
      images: assets.length,
      admins: admins.length,
    }),
    [admins.length, assets.length, channels]
  );

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [channelData, assetData, adminData] = await Promise.all([
        fetchJson<{ channels: Channel[] }>("/api/admin/channels"),
        fetchJson<{ assets: Asset[] }>("/api/admin/assets"),
        fetchJson<{ admins: AdminAccount[] }>("/api/admin/admins"),
      ]);
      setChannels(channelData.channels);
      setAssets(assetData.assets);
      setAdmins(adminData.admins);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function saveChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const url = channelForm.id ? `/api/admin/channels/${channelForm.id}` : "/api/admin/channels";
    const method = channelForm.id ? "PUT" : "POST";

    try {
      await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channelForm),
      });
      setMessage(channelForm.id ? "Channel updated" : "Channel created");
      setChannelForm(emptyChannel);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save channel");
    }
  }

  async function deleteChannel(id: string) {
    if (!confirm("Delete this channel?")) return;
    setError("");
    try {
      await fetchJson(`/api/admin/channels/${id}`, { method: "DELETE" });
      setMessage("Channel deleted");
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete channel");
    }
  }

  async function saveAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await fetchJson("/api/admin/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetForm),
      });
      setMessage("Image saved");
      setAssetForm(emptyAsset);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save image");
    }
  }

  async function deleteAsset(id: string) {
    if (!confirm("Delete this image?")) return;
    setError("");
    try {
      await fetchJson(`/api/admin/assets/${id}`, { method: "DELETE" });
      setMessage("Image deleted");
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete image");
    }
  }

  async function saveAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await fetchJson("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      setMessage("Admin account created");
      setAdminForm(emptyAdminForm);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create admin");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">Signed in as {username}</p>
          <h1>IPTV Control Dashboard</h1>
        </div>
        <div className="admin-actions">
          <Link className="admin-secondary-btn" href="/">View site</Link>
          <button className="admin-secondary-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="admin-stats">
        <div><span>{channels.length}</span><p>Total channels</p></div>
        <div><span>{totals.live}</span><p>Live now</p></div>
        <div><span>{new Intl.NumberFormat("en-US").format(totals.viewers)}</span><p>Base viewers</p></div>
        <div><span>{totals.images}</span><p>Images</p></div>
        <div><span>{totals.admins}</span><p>Admins</p></div>
      </section>

      {(message || error) && (
        <div className={error ? "admin-alert error" : "admin-alert"}>{error || message}</div>
      )}

      <nav className="admin-tabs">
        <button className={activeTab === "channels" ? "active" : ""} onClick={() => setActiveTab("channels")}>Channels</button>
        <button className={activeTab === "images" ? "active" : ""} onClick={() => setActiveTab("images")}>Images</button>
        <button className={activeTab === "admins" ? "active" : ""} onClick={() => setActiveTab("admins")}>Admins</button>
      </nav>

      {activeTab === "channels" ? (
        <section className="admin-grid">
          <form className="admin-panel" onSubmit={saveChannel}>
            <h2>{channelForm.id ? "Edit channel" : "Add channel"}</h2>
            <div className="admin-form-grid">
              <label className="admin-field span-2"><span>Name</span><input value={channelForm.name} onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} /></label>
              <label className="admin-field span-2"><span>Stream URL</span><input value={channelForm.streamUrl} onChange={(e) => setChannelForm({ ...channelForm, streamUrl: e.target.value })} /></label>
              <label className="admin-field span-2"><span>Backup URLs</span><textarea value={channelForm.backupUrls} onChange={(e) => setChannelForm({ ...channelForm, backupUrls: e.target.value })} rows={3} /></label>
              <label className="admin-field"><span>Logo text</span><input value={channelForm.logo} onChange={(e) => setChannelForm({ ...channelForm, logo: e.target.value })} /></label>
              <label className="admin-field"><span>Image URL</span><input value={channelForm.imageUrl} onChange={(e) => setChannelForm({ ...channelForm, imageUrl: e.target.value })} /></label>
              <label className="admin-field"><span>Category</span><select value={channelForm.category} onChange={(e) => setChannelForm({ ...channelForm, category: e.target.value as Channel["category"] })}><option value="main">Main</option><option value="highlights">Highlights</option><option value="analysis">Analysis</option><option value="local">Local</option></select></label>
              <label className="admin-field"><span>Quality</span><select value={channelForm.quality} onChange={(e) => setChannelForm({ ...channelForm, quality: e.target.value as Channel["quality"] })}><option value="4K">4K</option><option value="FHD">FHD</option><option value="HD">HD</option><option value="SD">SD</option></select></label>
              <label className="admin-field"><span>Language</span><input value={channelForm.language} onChange={(e) => setChannelForm({ ...channelForm, language: e.target.value })} /></label>
              <label className="admin-field"><span>Region</span><input value={channelForm.region} onChange={(e) => setChannelForm({ ...channelForm, region: e.target.value })} /></label>
              <label className="admin-field"><span>Viewers</span><input type="number" value={channelForm.viewers} onChange={(e) => setChannelForm({ ...channelForm, viewers: Number(e.target.value) })} /></label>
              <label className="admin-field"><span>Sort order</span><input type="number" value={channelForm.sortOrder} onChange={(e) => setChannelForm({ ...channelForm, sortOrder: Number(e.target.value) })} /></label>
              <label className="admin-field span-2"><span>Current match</span><input value={channelForm.currentMatch} onChange={(e) => setChannelForm({ ...channelForm, currentMatch: e.target.value })} /></label>
              <label className="admin-check"><input type="checkbox" checked={channelForm.isLive} onChange={(e) => setChannelForm({ ...channelForm, isLive: e.target.checked })} /> Live channel</label>
            </div>
            <div className="admin-actions">
              <button className="admin-primary-btn" type="submit">{channelForm.id ? "Update channel" : "Create channel"}</button>
              {channelForm.id && <button className="admin-secondary-btn" type="button" onClick={() => setChannelForm(emptyChannel)}>Cancel edit</button>}
            </div>
          </form>

          <div className="admin-panel">
            <h2>Channel list</h2>
            {loading ? <p className="admin-muted">Loading...</p> : channels.map((channel) => (
              <div className="admin-list-row" key={channel.id}>
                <div className="admin-thumb">{channel.imageUrl ? <img src={channel.imageUrl} alt="" /> : channel.logo}</div>
                <div>
                  <strong>{channel.name}</strong>
                  <p>{channel.category} / {channel.quality} / {channel.isLive ? "live" : "offline"}</p>
                </div>
                <button className="admin-secondary-btn" onClick={() => setChannelForm(toForm(channel))}>Edit</button>
                <button className="admin-danger-btn" onClick={() => deleteChannel(channel.id)}>Delete</button>
              </div>
            ))}
          </div>
        </section>
      ) : activeTab === "images" ? (
        <section className="admin-grid">
          <form className="admin-panel" onSubmit={saveAsset}>
            <h2>Add image</h2>
            <label className="admin-field"><span>Title</span><input value={assetForm.title} onChange={(e) => setAssetForm({ ...assetForm, title: e.target.value })} /></label>
            <label className="admin-field"><span>Image URL</span><input value={assetForm.url} onChange={(e) => setAssetForm({ ...assetForm, url: e.target.value })} /></label>
            <label className="admin-field"><span>Type</span><select value={assetForm.type} onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value as Asset["type"] })}><option value="channel-icon">Channel icon</option><option value="banner">Banner</option><option value="other">Other</option></select></label>
            <label className="admin-field"><span>Alt text</span><input value={assetForm.alt} onChange={(e) => setAssetForm({ ...assetForm, alt: e.target.value })} /></label>
            <button className="admin-primary-btn" type="submit">Save image</button>
          </form>

          <div className="admin-panel">
            <h2>Image library</h2>
            <div className="admin-asset-grid">
              {assets.map((asset) => (
                <div className="admin-asset" key={asset.id}>
                  <img src={asset.url} alt={asset.alt || asset.title} />
                  <strong>{asset.title}</strong>
                  <p>{asset.type}</p>
                  <button className="admin-danger-btn" onClick={() => deleteAsset(asset.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="admin-grid">
          <form className="admin-panel" onSubmit={saveAdmin}>
            <h2>Register admin</h2>
            <label className="admin-field">
              <span>Display name</span>
              <input value={adminForm.displayName} onChange={(e) => setAdminForm({ ...adminForm, displayName: e.target.value })} />
            </label>
            <label className="admin-field">
              <span>Username</span>
              <input value={adminForm.username} onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })} />
            </label>
            <label className="admin-field">
              <span>Password</span>
              <input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
            </label>
            <button className="admin-primary-btn" type="submit">Create admin</button>
          </form>

          <div className="admin-panel">
            <h2>Admin accounts</h2>
            {loading ? <p className="admin-muted">Loading...</p> : admins.map((admin) => (
              <div className="admin-list-row" key={admin.id}>
                <div className="admin-thumb">{admin.username.slice(0, 2).toUpperCase()}</div>
                <div>
                  <strong>{admin.displayName || admin.username}</strong>
                  <p>{admin.username} / {admin.isActive ? "active" : "disabled"}</p>
                </div>
                <span className="admin-status-pill">{admin.role}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
