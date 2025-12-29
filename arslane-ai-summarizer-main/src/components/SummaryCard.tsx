import ReactMarkdown from "react-markdown";
import { CheckCircle2, Copy, Check, Download, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SummaryCardProps {
  summary: string;
}

const SummaryCard = ({ summary }: SummaryCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Copié dans le presse-papier");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([summary], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-arslane-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Fichier Markdown téléchargé");
  };

  const handleExportTxt = () => {
    // Convert markdown to plain text (basic conversion)
    const plainText = summary
      .replace(/#{1,6}\s/g, "") // Remove headers
      .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.+?)\*/g, "$1") // Remove italic
      .replace(/`(.+?)`/g, "$1") // Remove inline code
      .replace(/^\s*[-*+]\s/gm, "• ") // Convert list items
      .replace(/^\s*\d+\.\s/gm, "• "); // Convert numbered lists

    const blob = new Blob([plainText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-arslane-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Fichier texte téléchargé");
  };

  const handleExportPdf = async () => {
    // Create a printable version
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Résumé - Arslane AI</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            h1, h2, h3 { color: #1a1a1a; margin-top: 24px; }
            h1 { font-size: 24px; border-bottom: 2px solid #0ea5e9; padding-bottom: 8px; }
            h2 { font-size: 20px; }
            h3 { font-size: 16px; }
            p { margin: 12px 0; }
            ul, ol { margin: 12px 0; padding-left: 24px; }
            li { margin: 6px 0; }
            blockquote {
              border-left: 3px solid #0ea5e9;
              padding-left: 16px;
              margin: 16px 0;
              color: #666;
              font-style: italic;
            }
            code {
              background: #f3f4f6;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 14px;
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
              padding-bottom: 16px;
              border-bottom: 1px solid #e5e7eb;
            }
            .header h1 {
              border: none;
              color: #0ea5e9;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Arslane AI</h1>
            <p>Résumé généré le ${new Date().toLocaleDateString("fr-FR")}</p>
          </div>
          <div id="content">${summary
            .replace(/^# (.+)$/gm, "<h1>$1</h1>")
            .replace(/^## (.+)$/gm, "<h2>$1</h2>")
            .replace(/^### (.+)$/gm, "<h3>$1</h3>")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/`(.+?)`/g, "<code>$1</code>")
            .replace(/^- (.+)$/gm, "<li>$1</li>")
            .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
            .replace(/\n\n/g, "</p><p>")
            .replace(/^(.+)$/gm, (match) =>
              match.startsWith("<") ? match : `<p>${match}</p>`
            )
          }</div>
          <div class="footer">
            <p>Généré par Arslane AI - arslaneai.lovable.app</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("Impression lancée (enregistrez en PDF)");
  };

  return (
    <div className="mt-8 animate-slide-up">
      <div className="gradient-border p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 animate-bounce-in" />
            <span className="text-sm font-medium text-muted-foreground">Résumé généré</span>
          </div>
          <div className="flex items-center gap-2">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportMarkdown}>
                  <FileText className="w-4 h-4 mr-2" />
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTxt}>
                  <FileText className="w-4 h-4 mr-2" />
                  Texte (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF (impression)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
