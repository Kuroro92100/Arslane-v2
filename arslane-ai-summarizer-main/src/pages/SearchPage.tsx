import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { MangaGrid } from '@/components/MangaGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { searchManga, getMangaGenres } from '@/services/jikanApi';

const MANGA_TYPES = [
  { value: 'manga', label: 'Manga' },
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'manhua', label: 'Manhua' },
  { value: 'novel', label: 'Novel' },
  { value: 'lightnovel', label: 'Light Novel' },
  { value: 'oneshot', label: 'One-shot' },
];

const STATUS_OPTIONS = [
  { value: 'publishing', label: 'En cours' },
  { value: 'complete', label: 'Terminé' },
  { value: 'hiatus', label: 'En pause' },
  { value: 'upcoming', label: 'À venir' },
];

const ORDER_OPTIONS = [
  { value: 'score', label: 'Note' },
  { value: 'popularity', label: 'Popularité' },
  { value: 'title', label: 'Titre' },
  { value: 'chapters', label: 'Chapitres' },
  { value: 'favorites', label: 'Favoris' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [orderBy, setOrderBy] = useState<string>('score');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Mettre à jour l'URL
  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
    } else {
      setSearchParams({});
    }
  }, [debouncedQuery, setSearchParams]);

  // Récupérer les genres
  const { data: genres } = useQuery({
    queryKey: ['manga-genres'],
    queryFn: getMangaGenres,
    staleTime: 1000 * 60 * 60, // 1 heure
  });

  // Recherche
  const { data: results, isLoading, isFetching } = useQuery({
    queryKey: ['search-manga', debouncedQuery, page, type, status, orderBy, selectedGenres],
    queryFn: () =>
      searchManga(debouncedQuery || '', page, 24, {
        type: type as any || undefined,
        status: status as any || undefined,
        orderBy: orderBy as any || undefined,
        sort: 'desc',
        genres: selectedGenres.length > 0 ? selectedGenres : undefined,
      }),
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setType('');
    setStatus('');
    setOrderBy('score');
    setSelectedGenres([]);
    setPage(1);
  };

  const hasFilters = type || status || selectedGenres.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        {/* Barre de recherche */}
        <div className="mb-8">
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un manga, manhwa, light novel..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 pl-12 pr-4 text-lg"
              autoFocus
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Filtres desktop */}
          <div className="hidden flex-wrap items-center gap-4 md:flex">
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {MANGA_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={orderBy} onValueChange={(v) => { setOrderBy(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bouton filtres mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <Filter className="mr-2 h-4 w-4" />
                Filtres
                {hasFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {(type ? 1 : 0) + (status ? 1 : 0) + selectedGenres.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
                <SheetDescription>Affinez votre recherche</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium">Type</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      {MANGA_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Statut</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {genres?.slice(0, 20).map((genre) => (
                      <Badge
                        key={genre.mal_id}
                        variant={selectedGenres.includes(genre.mal_id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleGenre(genre.mal_id)}
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="mr-2 h-4 w-4" />
                    Effacer les filtres
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Genres desktop */}
          <div className="hidden flex-wrap gap-2 md:flex">
            {genres?.slice(0, 10).map((genre) => (
              <Badge
                key={genre.mal_id}
                variant={selectedGenres.includes(genre.mal_id) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleGenre(genre.mal_id)}
              >
                {genre.name}
              </Badge>
            ))}
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="hidden md:flex"
            >
              <X className="mr-2 h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>

        {/* Résultats */}
        <div className="mb-4 text-sm text-muted-foreground">
          {results?.pagination.items.total
            ? `${results.pagination.items.total} résultats`
            : debouncedQuery
            ? 'Aucun résultat'
            : 'Explorez les mangas'}
        </div>

        <MangaGrid
          mangas={results?.data || []}
          isLoading={isLoading || isFetching}
          showStatus={false}
        />

        {/* Pagination */}
        {results && results.pagination.last_visible_page > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <span className="flex items-center px-4">
              Page {page} / {results.pagination.last_visible_page}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!results.pagination.has_next_page}
            >
              Suivant
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
