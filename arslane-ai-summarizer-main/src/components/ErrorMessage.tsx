import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => {
  return (
    <div className="mt-8 animate-shake">
      <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/30 animate-scale-in">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5 animate-bounce-in" />
          <div className="flex-1">
            <p className="font-medium text-destructive mb-1">Erreur</p>
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-destructive/50 text-destructive hover:bg-destructive/10 transition-transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
