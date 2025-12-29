import { Sparkles } from "lucide-react";
const Header = () => {
  return <header className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          <span className="gradient-text">Arslane AI</span>
        </h1>
      </div>
      <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
        Résume n'importe quelle vidéo YouTube ! 
      </p>
    </header>;
};
export default Header;