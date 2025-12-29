import { Link2 } from "lucide-react";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const URLInput = ({ value, onChange, disabled }: URLInputProps) => {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Link2 className="w-5 h-5 text-muted-foreground" />
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Colle ton lien YouTube ici..."
        className="w-full h-14 pl-12 pr-4 text-base bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default URLInput;
