import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  showProfile?: boolean;
}

export const MobileHeader = ({ title, showBack = false, showProfile = false }: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="animate-scale-in"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        
        {showProfile && (
          <Button
            variant="ghost"
            size="sm"
            className="animate-scale-in"
          >
            <User className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};