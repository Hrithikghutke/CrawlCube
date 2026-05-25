"use client";

import { useEffect, useState } from "react";
import { Link2, Link2Off, Loader2 } from "lucide-react";

export default function NetlifyConnectionStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    email: string | null;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/netlify/check-connection")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false, email: null }));
  }, []);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch("/api/netlify/disconnect", { method: "POST" });
      setStatus({ connected: false, email: null });
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background shadow-sm animate-pulse">
        <div className="h-10 bg-secondary/50 rounded w-1/2"></div>
        <div className="h-8 bg-secondary/50 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-5 border border-border rounded-xl bg-background shadow-sm transition-all">
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full ${
            status.connected ? "bg-green-500/10 text-green-500" : "bg-secondary/80 text-muted-foreground"
          }`}
        >
          {status.connected ? <Link2 className="w-5 h-5" /> : <Link2Off className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Netlify Integration</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {status.connected
              ? `Connected as ${status.email ?? "your account"}`
              : "Not connected — sites deploy to CrawlCube account"}
          </p>
        </div>
      </div>
      {status.connected ? (
        <button
          className="btn btn-ghost btn-sm text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          onClick={handleDisconnect}
          disabled={loading}
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Disconnect
        </button>
      ) : (
        <button
          onClick={() => { window.location.href = "/api/netlify/oauth-start"; }}
          className="btn btn-primary btn-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          Connect Account
        </button>
      )}
    </div>
  );
}
