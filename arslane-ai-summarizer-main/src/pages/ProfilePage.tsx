import { useParams, Link } from 'react-router-dom';
import {
  User,
  Calendar,
  BookOpen,
  Star,
  Heart,
  Users,
  MessageSquare,
  List,
  Settings,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { LibraryGrid } from '@/components/MangaGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import {
  useProfileByUsername,
  useUserStats,
  useIsFollowing,
  useToggleFollow,
  useFollowers,
  useFollowing,
  useUserActivities,
} from '@/hooks/useProfile';
import { useUserLibrary, useFavorites } from '@/hooks/useMangaLibrary';
import { useUserReviews } from '@/hooks/useReviews';
import { useUserLists } from '@/hooks/useLists';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ACTIVITY_LABELS, STATUS_LABELS } from '@/types/database';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useProfileByUsername(username || '');
  const { data: stats, isLoading: loadingStats } = useUserStats(profile?.id);
  const { data: isFollowing } = useIsFollowing(profile?.id || '');
  const toggleFollow = useToggleFollow();

  const { data: library } = useUserLibrary(profile?.id);
  const { data: favorites } = useFavorites(profile?.id);
  const { data: reviews } = useUserReviews(profile?.id);
  const { data: lists } = useUserLists(profile?.id);
  const { data: activities } = useUserActivities(profile?.id, 20);
  const { data: followers } = useFollowers(profile?.id);
  const { data: following } = useFollowing(profile?.id);

  const isOwnProfile = user?.id === profile?.id;

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <p className="text-center text-lg">Utilisateur non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        {/* En-tête du profil */}
        <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:items-start">
          <Avatar className="h-32 w-32">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-4xl">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div>
                <h1 className="text-3xl font-bold">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              {!isOwnProfile && user && (
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={() =>
                    toggleFollow.mutate({
                      targetUserId: profile.id,
                      isFollowing: isFollowing || false,
                    })
                  }
                  disabled={toggleFollow.isPending}
                >
                  {isFollowing ? 'Ne plus suivre' : 'Suivre'}
                </Button>
              )}

              {isOwnProfile && (
                <Button variant="outline" asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Modifier le profil
                  </Link>
                </Button>
              )}
            </div>

            {profile.bio && (
              <p className="mt-4 max-w-xl text-muted-foreground">{profile.bio}</p>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm md:justify-start">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}
              </span>
              {profile.favorite_genres && profile.favorite_genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {profile.favorite_genres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  Mangas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total_manga}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Star className="h-4 w-4" />
                  Note moyenne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.mean_score?.toFixed(1) || '-'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  Favoris
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.favorites_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Critiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.reviews_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Followers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.followers_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Following
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.following_count}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Distribution des statuts */}
        {stats && stats.total_manga > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Répartition de la bibliothèque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { key: 'reading', color: 'bg-blue-500' },
                  { key: 'completed', color: 'bg-green-500' },
                  { key: 'plan_to_read', color: 'bg-purple-500' },
                  { key: 'on_hold', color: 'bg-yellow-500' },
                  { key: 'dropped', color: 'bg-red-500' },
                ].map(({ key, color }) => {
                  const count = stats[key as keyof typeof stats] as number;
                  const percentage = (count / stats.total_manga) * 100;
                  return (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{STATUS_LABELS[key as keyof typeof STATUS_LABELS]}</span>
                        <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Onglets */}
        <Tabs defaultValue="activity">
          <TabsList className="mb-6">
            <TabsTrigger value="activity">Activité</TabsTrigger>
            <TabsTrigger value="library">Bibliothèque</TabsTrigger>
            <TabsTrigger value="favorites">Favoris</TabsTrigger>
            <TabsTrigger value="reviews">Critiques</TabsTrigger>
            <TabsTrigger value="lists">Listes</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <div className="space-y-4">
              {activities?.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    {activity.manga_image_url && (
                      <img
                        src={activity.manga_image_url}
                        alt=""
                        className="h-16 w-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p>
                        <span className="text-muted-foreground">
                          {ACTIVITY_LABELS[activity.activity_type]}{' '}
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
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!activities?.length && (
                <p className="text-center text-muted-foreground py-8">
                  Aucune activité récente
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="library">
            <LibraryGrid entries={library || []} />
          </TabsContent>

          <TabsContent value="favorites">
            <LibraryGrid entries={favorites || []} />
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews?.map((review) => (
                <Card key={review.id}>
                  <CardContent className="flex gap-4 pt-6">
                    <img
                      src={review.manga_image_url || '/placeholder.png'}
                      alt={review.manga_title}
                      className="h-24 w-16 rounded object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/manga/${review.mal_id}`}
                          className="font-semibold hover:underline"
                        >
                          {review.manga_title}
                        </Link>
                        {review.score && (
                          <Badge variant="secondary">
                            <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {review.score}
                          </Badge>
                        )}
                      </div>
                      {review.title && <h4 className="mt-1 font-medium">{review.title}</h4>}
                      <p className="mt-2 line-clamp-3 text-muted-foreground">
                        {review.content}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!reviews?.length && (
                <p className="text-center text-muted-foreground py-8">
                  Aucune critique
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="lists">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lists?.map((list) => (
                <Link key={list.id} to={`/list/${list.id}`}>
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
                      {list.cover_image_url ? (
                        <img
                          src={list.cover_image_url}
                          alt={list.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">
                          📚
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold">{list.name}</h3>
                      {list.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {list.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{list.likes_count} likes</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {!lists?.length && (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  Aucune liste
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Followers ({followers?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {followers?.slice(0, 10).map((follower) => (
                      <Link
                        key={follower.id}
                        to={`/profile/${follower.username}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <Avatar>
                          <AvatarImage src={follower.avatar_url || undefined} />
                          <AvatarFallback>
                            {follower.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {follower.display_name || follower.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{follower.username}
                          </p>
                        </div>
                      </Link>
                    ))}
                    {!followers?.length && (
                      <p className="text-center text-muted-foreground">
                        Aucun follower
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Following ({following?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {following?.slice(0, 10).map((user) => (
                      <Link
                        key={user.id}
                        to={`/profile/${user.username}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <Avatar>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.display_name || user.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </Link>
                    ))}
                    {!following?.length && (
                      <p className="text-center text-muted-foreground">
                        Ne suit personne
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
