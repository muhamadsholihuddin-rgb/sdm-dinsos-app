"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [nip, setNip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nip }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk.");
        setLoading(false);
        return;
      }
      router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err) {
      setError("Tidak bisa terhubung ke server.");
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-badge">SDM</div>
        <h1 style={{ fontSize: 18, margin: "0 0 4px" }}>Data SDM Dinsos</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 24px" }}>
          Masuk dengan NIP untuk melengkapi data Anda.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nip">NIP</label>
            <input
              id="nip"
              inputMode="numeric"
              autoFocus
              placeholder="Masukkan NIP Anda"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}
