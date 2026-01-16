import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Pause,
  XCircle,
  Heart,
  LayoutGrid,
  List as ListIcon,
  Filter,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { LibraryGrid } from '@/components/MangaGrid';
import { MangaCardCompact } from '@/components/MangaCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLibrary, useFavorites } from '@/hooks/useMangaLibrary';
import { useUserStats } from '@/hooks/useProfile';
import type { ReadingStatus, MangaEntry } from '@/types/database';
import { STATUS_LABELS, STATUS_COLORS } from '@/types/database';

const STATUS_ICONS: Record<ReadingStatus, React.ReactNode> = {
  reading: <BookOpen className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  plan_to_read: <Clock className="h-4 w-4" />,
  on_hold: <Pause className="h-4 w-4" />,
  dropped: <XCircle className="h-4 w-4" />,
};

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'score'>('updated');

  const { data: library, isLoading } = useUserLibrary();
  const { data: favorites } = useFavorites();
  const { data: stats } = useUserStats();

  // Rediriger si non connecté
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Filtrer par recherche
  const filterEntries = (entries: MangaEntry[] | undefined) => {
    if (!entries) return [];
    let filtered = entries;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.title_japanese?.toLowerCase().includes(query)
      );
    }

    // Trier
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'score':
          return (b.score || 0) - (a.score || 0);
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  };

  const getEntriesByStatus = (status: ReadingStatus) =>
    filterEntries(library?.filter((e) => e.status === status));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ma bibliothèque</h1>
            <p className="text-muted-foreground">
              Gérez votre collection de mangas
            </p>
          </div>
          <Button asChild>
            <Link to="/discover">Découvrir des mangas</Link>
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total_manga}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Chapitres lus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total_chapters_read}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Volumes lus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total_volumes_read}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Note moyenne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats.mean_score?.toFixed(1) || '-'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Favoris
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.favorites_count}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtres et tri */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Input
            placeholder="Rechercher dans ma bibliothèque..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={sortBy} onValueChange={(v: typeof sortBy) => setSortBy(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Dernière mise à jour</SelectItem>
              <SelectItem value="title">Titre</SelectItem>
              <SelectItem value="score">Note</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Onglets par statut */}
        <Tabs defaultValue="all">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="all">
              Tout ({filterEntries(library).length})
            </TabsTrigger>
            {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map((status) => (
              <TabsTrigger key={status} value={status} className="gap-2">
                {STATUS_ICONS[status]}
                <span className="hidden sm:inline">{STATUS_LABELS[status]}</span>
                <span className="text-muted-foreground">
                  ({getEntriesByStatus(status).length})
                </span>
              </TabsTrigger>
            ))}
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoris</span>
              <span className="text-muted-foreground">
                ({filterEntries(favorites).length})
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {viewMode === 'grid' ? (
              <LibraryGrid entries={filterEntries(library)} isLoading={isLoading} />
            ) : (
              <div className="space-y-2">
                {filterEntries(library).map((entry) => (
                  <MangaCardCompact
                    key={entry.id}
                    manga={{
                      mal_id: entry.mal_id,
                      title: entry.title,
                      image_url: entry.image_url,
                    }}
                    entry={entry}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map((status) => (
            <TabsContent key={status} value={status}>
              {viewMode === 'grid' ? (
                <LibraryGrid entries={getEntriesByStatus(status)} isLoading={isLoading} />
              ) : (
                <div className="space-y-2">
                  {getEntriesByStatus(status).map((entry) => (
                    <MangaCardCompact
                      key={entry.id}
                      manga={{
                        mal_id: entry.mal_id,
                        title: entry.title,
                        image_url: entry.image_url,
                      }}
                      entry={entry}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}

          <TabsContent value="favorites">
            {viewMode === 'grid' ? (
              <LibraryGrid entries={filterEntries(favorites)} isLoading={isLoading} />
            ) : (
              <div className="space-y-2">
                {filterEntries(favorites).map((entry) => (
                  <MangaCardCompact
                    key={entry.id}
                    manga={{
                      mal_id: entry.mal_id,
                      title: entry.title,
                      image_url: entry.image_url,
                    }}
                    entry={entry}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
