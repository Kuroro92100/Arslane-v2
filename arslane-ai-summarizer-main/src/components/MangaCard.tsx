import { Link } from 'react-router-dom';
import { Star, BookOpen, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JikanManga } from '@/services/jikanApi';
import type { MangaEntry } from '@/types/database';
import { STATUS_COLORS } from '@/types/database';

interface MangaCardProps {
  manga: JikanManga | {
    mal_id: number;
    title: string;
    image_url: string | null;
    score?: number | null;
    chapters?: number | null;
    status?: string;
  };
  entry?: MangaEntry | null;
  className?: string;
  showStatus?: boolean;
}

export function MangaCard({ manga, entry, className, showStatus = true }: MangaCardProps) {
  const imageUrl = 'images' in manga
    ? manga.images.jpg.large_image_url || manga.images.jpg.image_url
    : manga.image_url;

  const score = 'score' in manga ? manga.score : entry?.score;
  const chapters = 'chapters' in manga ? manga.chapters : entry?.total_chapters;

  return (
    <Link
      to={`/manga/${manga.mal_id}`}
      className={cn(
        'group relative block overflow-hidden rounded-lg bg-card transition-all hover:scale-[1.02] hover:shadow-xl',
        className
      )}
    >
      {/* Image */}
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={manga.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* Status badge */}
      {showStatus && entry && (
        <div
          className={cn(
            'absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium text-white',
            STATUS_COLORS[entry.status]
          )}
        >
          {entry.status === 'reading' && 'En cours'}
          {entry.status === 'completed' && 'Terminé'}
          {entry.status === 'plan_to_read' && 'À lire'}
          {entry.status === 'on_hold' && 'En pause'}
          {entry.status === 'dropped' && 'Abandonné'}
        </div>
      )}

      {/* Favorite badge */}
      {entry?.is_favorite && (
        <div className="absolute right-2 top-2">
          <Heart className="h-5 w-5 fill-red-500 text-red-500" />
        </div>
      )}

      {/* Score badge (MAL or user) */}
      {score && (
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-bold text-yellow-400">
          <Star className="h-3 w-3 fill-yellow-400" />
          {typeof score === 'number' ? score.toFixed(1) : score}
        </div>
      )}

      {/* Info on hover */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform group-hover:translate-y-0">
        <h3 className="line-clamp-2 text-sm font-semibold text-white">
          {manga.title}
        </h3>
        {chapters && (
          <p className="mt-1 text-xs text-gray-300">
            {chapters} chapitres
          </p>
        )}
        {entry && (
          <p className="mt-1 text-xs text-gray-300">
            {entry.chapters_read}/{entry.total_chapters || '?'} chapitres lus
          </p>
        )}
      </div>

      {/* Title (always visible on mobile) */}
      <div className="p-2 md:hidden">
        <h3 className="line-clamp-2 text-sm font-medium">{manga.title}</h3>
      </div>
    </Link>
  );
}

// Version compacte pour les listes
export function MangaCardCompact({ manga, entry }: MangaCardProps) {
  const imageUrl = 'images' in manga
    ? manga.images.jpg.image_url
    : manga.image_url;

  return (
    <Link
      to={`/manga/${manga.mal_id}`}
      className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
    >
      <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={manga.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <h4 className="truncate font-medium">{manga.title}</h4>
        {entry && (
          <p className="text-sm text-muted-foreground">
            {entry.chapters_read}/{entry.total_chapters || '?'} chapitres
          </p>
        )}
      </div>
      {entry?.score && (
        <div className="flex items-center gap-1 text-sm font-medium text-yellow-500">
          <Star className="h-4 w-4 fill-yellow-500" />
          {entry.score}
        </div>
      )}
    </Link>
  );
}
