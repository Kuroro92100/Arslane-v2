import ReactMarkdown from "react-markdown";
import { CheckCircle2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SummaryCardProps {
  summary: string;
}

const SummaryCard = ({ summary }: SummaryCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 animate-slide-up">
      <div className="gradient-border p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 animate-bounce-in" />
            <span className="text-sm font-medium text-muted-foreground">Résumé généré</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copié
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copier
              </>
            )}
          </Button>
        </div>
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mb-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mb-2 mt-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mb-2 mt-3">{children}</h3>,
              p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-3">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside text-muted-foreground mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside text-muted-foreground mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground my-3">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-secondary px-1.5 py-0.5 rounded text-sm text-primary">{children}</code>
              ),
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
