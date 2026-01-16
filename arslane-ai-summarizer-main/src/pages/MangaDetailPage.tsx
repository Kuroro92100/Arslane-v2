import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  Users,
  BookOpen,
  Calendar,
  ExternalLink,
  Heart,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { AddToLibraryDialog } from '@/components/AddToLibraryDialog';
import { MangaCard } from '@/components/MangaCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  getMangaFullById,
  getMangaCharacters,
  getMangaRecommendations,
} from '@/services/jikanApi';
import { useMangaEntry, useToggleFavorite } from '@/hooks/useMangaLibrary';
import { useMangaReviews } from '@/hooks/useReviews';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function MangaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const malId = parseInt(id || '0');
  const { user } = useAuth();

  // Récupérer les détails du manga
  const { data: manga, isLoading } = useQuery({
    queryKey: ['manga', malId],
    queryFn: () => getMangaFullById(malId),
    enabled: !!malId,
  });

  // Entrée de la bibliothèque utilisateur
  const { data: entry } = useMangaEntry(malId);
  const toggleFavorite = useToggleFavorite();

  // Personnages
  const { data: characters } = useQuery({
    queryKey: ['manga-characters', malId],
    queryFn: () => getMangaCharacters(malId),
    enabled: !!malId,
  });

  // Recommandations
  const { data: recommendations } = useQuery({
    queryKey: ['manga-recommendations', malId],
    queryFn: () => getMangaRecommendations(malId),
    enabled: !!malId,
  });

  // Reviews
  const { data: reviews } = useMangaReviews(malId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <div className="flex flex-col gap-8 md:flex-row">
            <Skeleton className="h-[400px] w-[280px] rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <p className="text-center text-lg">Manga non trouvé</p>
        </div>
      </div>
    );
  }

  const imageUrl = manga.images.jpg.large_image_url || manga.images.jpg.image_url;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero section avec image de fond */}
      <div
        className="relative h-64 bg-cover bg-center md:h-80"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${imageUrl})`,
        }}
      >
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      <main className="container relative px-4 pb-12">
        {/* Contenu principal - remonte sur l'image hero */}
        <div className="relative -mt-32 flex flex-col gap-8 md:-mt-40 md:flex-row">
          {/* Image */}
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={manga.title}
              className="mx-auto h-auto w-48 rounded-lg shadow-xl md:w-64"
            />

            {/* Actions */}
            <div className="mt-4 space-y-2">
              <AddToLibraryDialog manga={manga}>
                <Button className="w-full" size="lg">
                  {entry ? 'Modifier' : 'Ajouter à ma liste'}
                </Button>
              </AddToLibraryDialog>

              {entry && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    toggleFavorite.mutate({
                      malId: manga.mal_id,
                      isFavorite: !entry.is_favorite,
                    })
                  }
                >
                  <Heart
                    className={cn(
                      'mr-2 h-4 w-4',
                      entry.is_favorite && 'fill-red-500 text-red-500'
                    )}
                  />
                  {entry.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </Button>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="icon" asChild>
                  <a href={manga.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold md:text-4xl">{manga.title}</h1>
            {manga.title_japanese && (
              <p className="mt-1 text-lg text-muted-foreground">{manga.title_japanese}</p>
            )}

            {/* Stats */}
            <div className="mt-4 flex flex-wrap gap-4">
              {manga.score && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold">{manga.score}</span>
                  <span className="text-muted-foreground">
                    ({manga.scored_by?.toLocaleString()} votes)
                  </span>
                </div>
              )}
              {manga.rank && (
                <Badge variant="secondary">
                  #{manga.rank} Classement
                </Badge>
              )}
              {manga.popularity && (
                <Badge variant="outline">
                  #{manga.popularity} Popularité
                </Badge>
              )}
            </div>

            {/* Méta infos */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{manga.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Statut</p>
                <p className="font-medium">{manga.status}</p>
              </div>
              {manga.chapters && (
                <div>
                  <p className="text-muted-foreground">Chapitres</p>
                  <p className="font-medium">{manga.chapters}</p>
                </div>
              )}
              {manga.volumes && (
                <div>
                  <p className="text-muted-foreground">Volumes</p>
                  <p className="font-medium">{manga.volumes}</p>
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="mt-4 flex flex-wrap gap-2">
              {manga.genres.map((genre) => (
                <Badge key={genre.mal_id} variant="secondary">
                  {genre.name}
                </Badge>
              ))}
              {manga.themes?.map((theme) => (
                <Badge key={theme.mal_id} variant="outline">
                  {theme.name}
                </Badge>
              ))}
            </div>

            {/* Auteurs */}
            {manga.authors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Auteur(s)</p>
                <p className="font-medium">
                  {manga.authors.map((a) => a.name).join(', ')}
                </p>
              </div>
            )}

            {/* Progression si dans la bibliothèque */}
            {entry && (
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ma progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Chapitres</p>
                      <p className="text-xl font-bold">
                        {entry.chapters_read}/{entry.total_chapters || '?'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Volumes</p>
                      <p className="text-xl font-bold">
                        {entry.volumes_read}/{entry.total_volumes || '?'}
                      </p>
                    </div>
                    {entry.score && (
                      <div>
                        <p className="text-sm text-muted-foreground">Ma note</p>
                        <p className="flex items-center gap-1 text-xl font-bold text-yellow-500">
                          <Star className="h-5 w-5 fill-yellow-500" />
                          {entry.score}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="synopsis" className="mt-8">
          <TabsList>
            <TabsTrigger value="synopsis">Synopsis</TabsTrigger>
            <TabsTrigger value="characters">Personnages</TabsTrigger>
            <TabsTrigger value="reviews">
              Critiques ({reviews?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="recommendations">Similaires</TabsTrigger>
          </TabsList>

          <TabsContent value="synopsis" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                {manga.synopsis ? (
                  <p className="whitespace-pre-line leading-relaxed">{manga.synopsis}</p>
                ) : (
                  <p className="text-muted-foreground">Pas de synopsis disponible</p>
                )}

                {manga.background && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="mb-2 font-semibold">Contexte</h3>
                    <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                      {manga.background}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="characters" className="mt-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {characters?.slice(0, 12).map((char) => (
                <Card key={char.mal_id} className="overflow-hidden">
                  <img
                    src={char.images.jpg.image_url}
                    alt={char.name}
                    className="aspect-square w-full object-cover"
                  />
                  <CardContent className="p-3">
                    <p className="truncate font-medium">{char.name}</p>
                    <p className="text-xs text-muted-foreground">{char.role}</p>
                  </CardContent>
                </Card>
              ))}
              {!characters?.length && (
                <p className="col-span-full text-center text-muted-foreground">
                  Aucun personnage disponible
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {user && (
                <Card>
                  <CardContent className="pt-6">
                    <Link to={`/manga/${malId}/review`}>
                      <Button>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Écrire une critique
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {reviews?.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {review.profiles?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profile/${review.profiles?.username}`}
                            className="font-medium hover:underline"
                          >
                            {review.profiles?.display_name || review.profiles?.username}
                          </Link>
                          {review.score && (
                            <Badge variant="secondary">
                              <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {review.score}
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="mt-2 font-semibold">{review.title}</h4>
                        )}
                        <p className="mt-2 whitespace-pre-line">{review.content}</p>
                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <button className="flex items-center gap-1 hover:text-primary">
                            <Heart className="h-4 w-4" />
                            {review.likes_count}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!reviews?.length && (
                <p className="text-center text-muted-foreground py-8">
                  Aucune critique pour le moment. Soyez le premier à donner votre avis !
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {recommendations?.slice(0, 12).map((rec) => (
                <MangaCard
                  key={rec.entry.mal_id}
                  manga={{
                    mal_id: rec.entry.mal_id,
                    title: rec.entry.title,
                    image_url: rec.entry.images.jpg.large_image_url,
                  }}
                  showStatus={false}
                />
              ))}
              {!recommendations?.length && (
                <p className="col-span-full text-center text-muted-foreground">
                  Pas de recommandations disponibles
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
