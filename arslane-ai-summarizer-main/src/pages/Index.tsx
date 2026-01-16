import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, TrendingUp, Sparkles, Users } from 'lucide-react';
import { Header } from '@/components/Header';
import { MangaGrid } from '@/components/MangaGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getTopManga, getPublishingManga } from '@/services/jikanApi';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityFeed } from '@/hooks/useProfile';
import { useRecentReviews } from '@/hooks/useReviews';
import { usePopularLists } from '@/hooks/useLists';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ACTIVITY_LABELS } from '@/types/database';

export default function Index() {
  const { user } = useAuth();

  // Récupérer les mangas populaires
  const { data: topManga, isLoading: loadingTop } = useQuery({
    queryKey: ['top-manga'],
    queryFn: () => getTopManga(1, 12),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Récupérer les mangas en cours de publication
  const { data: publishingManga, isLoading: loadingPublishing } = useQuery({
    queryKey: ['publishing-manga'],
    queryFn: () => getPublishingManga(1, 12),
    staleTime: 1000 * 60 * 30,
  });

  // Feed d'activités si connecté
  const { data: activities } = useActivityFeed(10);

  // Reviews récentes
  const { data: recentReviews } = useRecentReviews(5);

  // Listes populaires
  const { data: popularLists } = usePopularLists(4);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="container relative z-10 px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Suivez vos <span className="text-primary">mangas</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground md:text-xl">
            Créez votre bibliothèque, notez vos lectures, partagez vos critiques et découvrez de nouveaux mangas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to={user ? '/library' : '/auth'}>
                {user ? 'Ma bibliothèque' : 'Commencer'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/discover">Découvrir des mangas</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="container px-4 py-12">
        {/* Stats rapides si connecté */}
        {user && activities && activities.length > 0 && (
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {activity.profiles?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-sm">
                        <Link
                          to={`/profile/${activity.profiles?.username}`}
                          className="font-medium hover:underline"
                        >
                          {activity.profiles?.display_name || activity.profiles?.username}
                        </Link>
                        <span className="text-muted-foreground">
                          {' '}{ACTIVITY_LABELS[activity.activity_type]}{' '}
                        </span>
                        {activity.manga_title && (
                          <Link
                            to={`/manga/${activity.mal_id}`}
                            className="font-medium hover:underline"
                          >
                            {activity.manga_title}
                          </Link>
                        )}
                        {activity.score && (
                          <span className="text-yellow-500"> ({activity.score}/10)</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Mangas populaires */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <TrendingUp className="h-6 w-6 text-primary" />
              Mangas populaires
            </h2>
            <Button variant="ghost" asChild>
              <Link to="/discover?filter=popular">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <MangaGrid
            mangas={topManga?.data || []}
            isLoading={loadingTop}
            showStatus={false}
          />
        </section>

        {/* Mangas en cours */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-primary" />
              En cours de publication
            </h2>
            <Button variant="ghost" asChild>
              <Link to="/discover?filter=publishing">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <MangaGrid
            mangas={publishingManga?.data || []}
            isLoading={loadingPublishing}
            showStatus={false}
          />
        </section>

        {/* Critiques et listes */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Critiques récentes */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Critiques récentes</CardTitle>
                <CardDescription>Les dernières critiques de la communauté</CardDescription>
              </CardHeader>
              <CardContent>
                {recentReviews && recentReviews.length > 0 ? (
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div key={review.id} className="flex gap-3">
                        <img
                          src={review.manga_image_url || '/placeholder.png'}
                          alt={review.manga_title}
                          className="h-16 w-12 rounded object-cover"
                        />
                        <div className="flex-1 overflow-hidden">
                          <Link
                            to={`/manga/${review.mal_id}`}
                            className="font-medium hover:underline line-clamp-1"
                          >
                            {review.manga_title}
                          </Link>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.content}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>par {review.profiles?.username}</span>
                            {review.score && (
                              <span className="text-yellow-500">{review.score}/10</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Aucune critique pour le moment
                  </p>
                )}
                <Button variant="ghost" className="mt-4 w-full" asChild>
                  <Link to="/reviews">Voir toutes les critiques</Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Listes populaires */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Listes populaires
                </CardTitle>
                <CardDescription>Les listes les plus appréciées</CardDescription>
              </CardHeader>
              <CardContent>
                {popularLists && popularLists.length > 0 ? (
                  <div className="space-y-4">
                    {popularLists.map((list) => (
                      <Link
                        key={list.id}
                        to={`/list/${list.id}`}
                        className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <div className="h-16 w-12 overflow-hidden rounded bg-muted">
                          {list.cover_image_url ? (
                            <img
                              src={list.cover_image_url}
                              alt={list.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-2xl">
                              📚
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{list.name}</p>
                          <p className="text-sm text-muted-foreground">
                            par {list.profiles?.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {list.likes_count} likes
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Aucune liste pour le moment
                  </p>
                )}
                <Button variant="ghost" className="mt-4 w-full" asChild>
                  <Link to="/lists">Voir toutes les listes</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>MangaTrack - Suivez vos mangas préférés</p>
          <p className="mt-2">Données fournies par MyAnimeList via Jikan API</p>
        </div>
      </footer>
    </div>
  );
}
