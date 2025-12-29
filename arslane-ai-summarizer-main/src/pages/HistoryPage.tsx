import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Clock, Zap, FileText, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Summary {
  id: string;
  video_id: string;
  url: string;
  mode: "quick" | "detailed";
  summary: string;
  created_at: string;
}

const HistoryPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchSummaries();
    }
  }, [user, authLoading, navigate]);

  const fetchSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from("video_summaries")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error("Error fetching summaries:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const deleteSummary = async (id: string) => {
    try {
      const { error } = await supabase
        .from("video_summaries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSummaries(summaries.filter((s) => s.id !== id));
      toast.success("Résumé supprimé");
    } catch (error) {
      console.error("Error deleting summary:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <main className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold gradient-text">Arslane AI</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Historique</h1>
        <p className="text-muted-foreground mb-8">
          Retrouve tous tes résumés de vidéos
        </p>

        {summaries.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun résumé pour l'instant</p>
            <Button
              onClick={() => navigate("/")}
              className="mt-4 bg-gradient-to-r from-primary to-accent"
            >
              Créer mon premier résumé
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={getYouTubeThumbnail(summary.video_id)}
                      alt="Video thumbnail"
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {summary.mode === "quick" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                          <Zap className="w-3 h-3" />
                          Rapide
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs">
                          <FileText className="w-3 h-3" />
                          Détaillé
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(summary.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {summary.summary.slice(0, 150)}...
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/summary/${summary.id}`)}
                      >
                        Voir le résumé
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(summary.url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSummary(summary.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
