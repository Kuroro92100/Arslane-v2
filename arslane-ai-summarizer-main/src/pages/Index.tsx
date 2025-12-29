import { useState } from "react";
import Header from "@/components/Header";
import URLInput from "@/components/URLInput";
import ActionButtons from "@/components/ActionButtons";
import LoadingState from "@/components/LoadingState";
import SummaryCard from "@/components/SummaryCard";
import ErrorMessage from "@/components/ErrorMessage";
import { supabase } from "@/integrations/supabase/client";

type SummaryMode = "quick" | "detailed";

const Index = () => {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<SummaryMode | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<SummaryMode>("quick");

  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)/;
    return youtubeRegex.test(url);
  };

  const summarizeVideo = async (youtubeUrl: string, mode: SummaryMode) => {
    setLoading(true);
    setLoadingMode(mode);
    setLastMode(mode);
    setError(null);
    setSummary("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("summarize-video", {
        body: {
          url: youtubeUrl,
          mode: mode,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.success) {
        setSummary(data.summary);
      } else {
        setError(data?.error || "Erreur lors du résumé");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Impossible de contacter le serveur";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMode(undefined);
    }
  };

  const handleQuickSummary = () => {
    if (isValidYouTubeUrl(url)) {
      summarizeVideo(url, "quick");
    }
  };

  const handleDetailedSummary = () => {
    if (isValidYouTubeUrl(url)) {
      summarizeVideo(url, "detailed");
    }
  };

  const handleRetry = () => {
    if (isValidYouTubeUrl(url)) {
      summarizeVideo(url, lastMode);
    }
  };

  const isButtonDisabled = !url.trim() || !isValidYouTubeUrl(url);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <main className="relative z-10 container max-w-2xl mx-auto px-4 py-16 md:py-24">
        <Header />

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 shadow-xl">
          <URLInput value={url} onChange={setUrl} disabled={loading} />
          <ActionButtons
            onQuickSummary={handleQuickSummary}
            onDetailedSummary={handleDetailedSummary}
            disabled={isButtonDisabled}
            loading={loading}
            loadingMode={loadingMode}
          />

          {!url.trim() && (
            <p className="text-center text-sm text-muted-foreground mt-4">Colle un lien YouTube pour commencer</p>
          )}

          {url.trim() && !isValidYouTubeUrl(url) && (
            <p className="text-center text-sm text-destructive mt-4">Entre un lien YouTube valide</p>
          )}
        </div>

        {loading && <LoadingState />}
        {error && !loading && <ErrorMessage message={error} onRetry={handleRetry} />}
        {summary && !loading && !error && <SummaryCard summary={summary} />}

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Propulsé par l'intelligence artificielle ✨</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
