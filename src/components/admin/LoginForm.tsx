"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Unable to sign in");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="admin-login-card" onSubmit={handleSubmit}>
      <div>
        <p className="admin-kicker">IPTV Control</p>
        <h1>Admin Dashboard</h1>
        <p className="admin-muted">Sign in to manage live channels, stream URLs, backups, and image assets.</p>
      </div>

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
          autoComplete="current-password"
        />
      </label>

      {error && <p className="admin-error">{error}</p>}

      <button className="admin-primary-btn" disabled={loading} type="submit">
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <Link className="admin-secondary-btn" href="/admin/register">Register first admin</Link>
    </form>
  );
}
