import { Link } from "react-router-dom";
import { BookOpen, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>
        <h1 className="mb-2 text-6xl font-bold">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">
          Oups ! Cette page n'existe pas
        </p>
        <p className="mb-8 text-muted-foreground">
          Le manga que vous cherchez n'est peut-être pas dans notre base de données
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/discover">
              <Search className="mr-2 h-4 w-4" />
              Découvrir des mangas
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
