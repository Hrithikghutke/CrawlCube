"use client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NetlifyConnectModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const handleConnect = () => {
    // Store a flag so after OAuth callback we know to auto-deploy
    sessionStorage.setItem("pendingNetlifyDeploy", "true");
    // Redirect to our oauth-start route
    window.location.href = "/api/netlify/oauth-start";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border w-full max-w-md p-6 rounded-2xl shadow-xl">
        <h3 className="font-bold text-xl mb-3">Connect your Netlify account</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Deploy directly to your own Netlify account. Free to connect — your
          site will live under your personal Netlify dashboard.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-secondary/80 text-foreground transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            onClick={handleConnect}
          >
            Connect Netlify →
          </button>
        </div>
      </div>
    </div>
  );
}
