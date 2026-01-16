import { MangaCard } from '@/components/MangaCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { JikanManga } from '@/services/jikanApi';
import type { MangaEntry } from '@/types/database';

interface MangaGridProps {
  mangas: JikanManga[];
  entries?: Map<number, MangaEntry>;
  isLoading?: boolean;
  showStatus?: boolean;
}

export function MangaGrid({ mangas, entries, isLoading, showStatus = true }: MangaGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <MangaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (mangas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">Aucun manga trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {mangas.map((manga) => (
        <MangaCard
          key={manga.mal_id}
          manga={manga}
          entry={entries?.get(manga.mal_id)}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}

export function MangaCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-2 md:hidden">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-2/3" />
      </div>
    </div>
  );
}

// Grille pour les entrées de bibliothèque
interface LibraryGridProps {
  entries: MangaEntry[];
  isLoading?: boolean;
}

export function LibraryGrid({ entries, isLoading }: LibraryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <MangaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">Aucun manga dans cette catégorie</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {entries.map((entry) => (
        <MangaCard
          key={entry.id}
          manga={{
            mal_id: entry.mal_id,
            title: entry.title,
            image_url: entry.image_url,
          }}
          entry={entry}
          showStatus={true}
        />
      ))}
    </div>
  );
}
