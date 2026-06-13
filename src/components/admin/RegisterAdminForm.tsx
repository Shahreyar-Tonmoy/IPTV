"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterAdminForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/admin/register");
      const payload = await response.json().catch(() => ({}));
      setSetupRequired(Boolean(payload.setupRequired));
      if (!response.ok) setError(payload.error || "Unable to check registration state");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, username, password }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || "Unable to register admin");
      return;
    }

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <form className="admin-login-card" onSubmit={handleSubmit}>
      <div>
        <p className="admin-kicker">First admin setup</p>
        <h1>Register Admin</h1>
        <p className="admin-muted">
          {setupRequired === false
            ? "An admin already exists. Sign in first, then create more admins from the dashboard."
            : "Create the first database admin account for this IPTV control panel."}
        </p>
      </div>

      <label className="admin-field">
        <span>Display name</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" />
      </label>

      <label className="admin-field">
        <span>Username</span>
        <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
      </label>

      <label className="admin-field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
      </label>

      {error && <p className="admin-error">{error}</p>}

      <button className="admin-primary-btn" disabled={loading || setupRequired === false} type="submit">
        {loading ? "Creating..." : "Create admin"}
      </button>

      <Link className="admin-secondary-btn" href="/admin/login">Back to login</Link>
    </form>
  );
}
