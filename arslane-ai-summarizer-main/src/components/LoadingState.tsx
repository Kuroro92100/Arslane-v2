import { Loader2 } from "lucide-react";

const LoadingState = () => {
  return (
    <div className="mt-8 animate-scale-in">
      <div className="gradient-border p-6 animate-pulse-subtle">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="text-lg font-medium text-foreground">Analyse en cours...</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 rounded-md animate-shimmer" style={{ animationDelay: '0ms' }} />
          <div className="h-4 rounded-md animate-shimmer w-5/6" style={{ animationDelay: '100ms' }} />
          <div className="h-4 rounded-md animate-shimmer w-4/6" style={{ animationDelay: '200ms' }} />
          <div className="h-4 rounded-md animate-shimmer w-5/6" style={{ animationDelay: '300ms' }} />
          <div className="h-4 rounded-md animate-shimmer w-3/6" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
