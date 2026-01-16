import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Star, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { MangaGrid } from '@/components/MangaGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  getTopManga,
  getPublishingManga,
  getMangaByGenre,
  getMangaGenres,
} from '@/services/jikanApi';

const FEATURED_GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Aventure' },
  { id: 8, name: 'Drame' },
  { id: 10, name: 'Fantaisie' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Tranche de vie' },
  { id: 37, name: 'Surnaturel' },
  { id: 30, name: 'Sports' },
  { id: 7, name: 'Mystère' },
];

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'popular';
  const [activeTab, setActiveTab] = useState(initialFilter);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // Top mangas
  const { data: topManga, isLoading: loadingTop } = useQuery({
    queryKey: ['top-manga-discover', page],
    queryFn: () => getTopManga(page, 24),
    enabled: activeTab === 'popular',
    staleTime: 1000 * 60 * 10,
  });

  // Mangas favoris
  const { data: favoriteManga, isLoading: loadingFavorite } = useQuery({
    queryKey: ['favorite-manga', page],
    queryFn: () => getTopManga(page, 24, 'favorite'),
    enabled: activeTab === 'favorites',
    staleTime: 1000 * 60 * 10,
  });

  // Mangas en cours
  const { data: publishingManga, isLoading: loadingPublishing } = useQuery({
    queryKey: ['publishing-manga-discover', page],
    queryFn: () => getPublishingManga(page, 24),
    enabled: activeTab === 'publishing',
    staleTime: 1000 * 60 * 10,
  });

  // À venir
  const { data: upcomingManga, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['upcoming-manga', page],
    queryFn: () => getTopManga(page, 24, 'upcoming'),
    enabled: activeTab === 'upcoming',
    staleTime: 1000 * 60 * 10,
  });

  // Par genre
  const { data: genreManga, isLoading: loadingGenre } = useQuery({
    queryKey: ['genre-manga', selectedGenre, page],
    queryFn: () => getMangaByGenre(selectedGenre!, page, 24),
    enabled: activeTab === 'genres' && !!selectedGenre,
    staleTime: 1000 * 60 * 10,
  });

  // Liste des genres
  const { data: allGenres } = useQuery({
    queryKey: ['all-genres'],
    queryFn: getMangaGenres,
    staleTime: 1000 * 60 * 60,
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams({ filter: tab });
  };

  const handleGenreSelect = (genreId: number) => {
    setSelectedGenre(genreId);
    setPage(1);
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'popular':
        return { data: topManga, loading: loadingTop };
      case 'favorites':
        return { data: favoriteManga, loading: loadingFavorite };
      case 'publishing':
        return { data: publishingManga, loading: loadingPublishing };
      case 'upcoming':
        return { data: upcomingManga, loading: loadingUpcoming };
      case 'genres':
        return { data: genreManga, loading: loadingGenre };
      default:
        return { data: topManga, loading: loadingTop };
    }
  };

  const { data: currentData, loading: currentLoading } = getCurrentData();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Découvrir</h1>
          <p className="text-muted-foreground">
            Explorez les meilleurs mangas du moment
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="popular" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Populaires
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Star className="h-4 w-4" />
              Mieux notés
            </TabsTrigger>
            <TabsTrigger value="publishing" className="gap-2">
              <Sparkles className="h-4 w-4" />
              En cours
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="h-4 w-4" />
              À venir
            </TabsTrigger>
            <TabsTrigger value="genres">Par genre</TabsTrigger>
          </TabsList>

          {/* Sélection de genre */}
          {activeTab === 'genres' && (
            <div className="mb-6">
              <h3 className="mb-3 font-medium">Sélectionnez un genre</h3>
              <div className="flex flex-wrap gap-2">
                {(allGenres || FEATURED_GENRES).map((genre) => (
                  <Badge
                    key={genre.mal_id || genre.id}
                    variant={selectedGenre === (genre.mal_id || genre.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleGenreSelect(genre.mal_id || genre.id)}
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <TabsContent value="popular">
            <MangaGrid
              mangas={currentData?.data || []}
              isLoading={currentLoading}
              showStatus={false}
            />
          </TabsContent>

          <TabsContent value="favorites">
            <MangaGrid
              mangas={currentData?.data || []}
              isLoading={currentLoading}
              showStatus={false}
            />
          </TabsContent>

          <TabsContent value="publishing">
            <MangaGrid
              mangas={currentData?.data || []}
              isLoading={currentLoading}
              showStatus={false}
            />
          </TabsContent>

          <TabsContent value="upcoming">
            <MangaGrid
              mangas={currentData?.data || []}
              isLoading={currentLoading}
              showStatus={false}
            />
          </TabsContent>

          <TabsContent value="genres">
            {selectedGenre ? (
              <MangaGrid
                mangas={currentData?.data || []}
                isLoading={currentLoading}
                showStatus={false}
              />
            ) : (
              <p className="text-center text-muted-foreground py-12">
                Sélectionnez un genre pour voir les mangas
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {currentData && currentData.pagination?.last_visible_page > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <span className="flex items-center px-4">
              Page {page} / {currentData.pagination.last_visible_page}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!currentData.pagination.has_next_page}
            >
              Suivant
            </Button>
          </div>
        )}

        {/* Genres populaires si pas sur l'onglet genres */}
        {activeTab !== 'genres' && (
          <section className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Explorer par genre</h2>
              <Button variant="ghost" onClick={() => handleTabChange('genres')}>
                Tous les genres
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {FEATURED_GENRES.map((genre) => (
                <Badge
                  key={genre.id}
                  variant="outline"
                  className="cursor-pointer text-base py-2 px-4"
                  onClick={() => {
                    setActiveTab('genres');
                    setSelectedGenre(genre.id);
                  }}
                >
                  {genre.name}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
