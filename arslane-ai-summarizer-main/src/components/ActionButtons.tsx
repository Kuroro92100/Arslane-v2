import { Rocket, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onQuickSummary: () => void;
  onDetailedSummary: () => void;
  disabled: boolean;
  loading: boolean;
  loadingMode?: "quick" | "detailed";
}

const ActionButtons = ({
  onQuickSummary,
  onDetailedSummary,
  disabled,
  loading,
  loadingMode,
}: ActionButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant="outline"
        size="lg"
        onClick={onQuickSummary}
        disabled={disabled || loading}
        className="flex-1"
      >
        {loading && loadingMode === "quick" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Rocket className="w-5 h-5" />
        )}
        Résumé Rapide
      </Button>
      <Button
        variant="gradient"
        size="lg"
        onClick={onDetailedSummary}
        disabled={disabled || loading}
        className="flex-1"
      >
        {loading && loadingMode === "detailed" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <BookOpen className="w-5 h-5" />
        )}
        Résumé Détaillé
      </Button>
    </div>
  );
};

export default ActionButtons;
