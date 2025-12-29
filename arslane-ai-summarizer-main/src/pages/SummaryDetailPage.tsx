import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import SummaryCard from "@/components/SummaryCard";
import { Sparkles, ArrowLeft, ExternalLink, Zap, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Summary {
  id: string;
  video_id: string;
  url: string;
  mode: "quick" | "detailed";
  summary: string;
  created_at: string;
}

const SummaryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user && id) {
      fetchSummary();
    }
  }, [user, authLoading, id, navigate]);

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("video_summaries")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Résumé introuvable");
      navigate("/history");
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <main className="relative z-10 container max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/history")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Historique
          </Button>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold gradient-text">Arslane AI</span>
          </div>
        </div>

        {/* Video Info */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden mb-6">
          <img
            src={getYouTubeThumbnail(summary.video_id)}
            alt="Video thumbnail"
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {summary.mode === "quick" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                  <Zap className="w-3 h-3" />
                  Résumé Rapide
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs">
                  <FileText className="w-3 h-3" />
                  Résumé Détaillé
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {format(new Date(summary.created_at), "d MMMM yyyy 'à' HH:mm", {
                  locale: fr,
                })}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(summary.url, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir la vidéo sur YouTube
            </Button>
          </div>
        </div>

        {/* Summary */}
        <SummaryCard summary={summary.summary} />
      </main>
    </div>
  );
};

export default SummaryDetailPage;
