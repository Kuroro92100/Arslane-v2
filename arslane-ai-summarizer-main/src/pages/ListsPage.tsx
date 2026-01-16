import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, TrendingUp, Clock, User } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { usePopularLists, useRecentLists, useUserLists, useCreateList } from '@/hooks/useLists';
import type { CreateListInput } from '@/types/database';

export default function ListsPage() {
  const location = useLocation();
  const isMyLists = location.pathname === '/my-lists';
  const { user } = useAuth();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newList, setNewList] = useState<CreateListInput>({
    name: '',
    description: '',
    is_public: true,
    is_ranked: false,
  });

  const { data: popularLists, isLoading: loadingPopular } = usePopularLists(20);
  const { data: recentLists, isLoading: loadingRecent } = useRecentLists(20);
  const { data: userLists, isLoading: loadingUser } = useUserLists();
  const createList = useCreateList();

  const handleCreateList = async () => {
    if (!newList.name.trim()) return;
    await createList.mutateAsync(newList);
    setCreateDialogOpen(false);
    setNewList({ name: '', description: '', is_public: true, is_ranked: false });
  };

  const ListCard = ({ list }: { list: any }) => (
    <Link to={`/list/${list.id}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02]">
        <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
          {list.cover_image_url ? (
            <img
              src={list.cover_image_url}
              alt={list.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-5xl">📚</span>
            </div>
          )}
        </div>
        <CardContent className="pt-4">
          <h3 className="font-semibold line-clamp-1">{list.name}</h3>
          {list.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {list.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {list.profiles?.username || 'Utilisateur'}
            </span>
            <span>{list.likes_count || 0} likes</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const ListCardSkeleton = () => (
    <div>
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isMyLists ? 'Mes listes' : 'Listes'}
            </h1>
            <p className="text-muted-foreground">
              {isMyLists
                ? 'Gérez vos collections de mangas'
                : 'Découvrez les listes de la communauté'}
            </p>
          </div>

          {user && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une liste
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle liste</DialogTitle>
                  <DialogDescription>
                    Organisez vos mangas dans des collections thématiques
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom de la liste</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Mes mangas préférés"
                      value={newList.name}
                      onChange={(e) =>
                        setNewList({ ...newList, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez votre liste..."
                      value={newList.description || ''}
                      onChange={(e) =>
                        setNewList({ ...newList, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="public">Liste publique</Label>
                      <p className="text-sm text-muted-foreground">
                        Visible par tous les utilisateurs
                      </p>
                    </div>
                    <Switch
                      id="public"
                      checked={newList.is_public}
                      onCheckedChange={(checked) =>
                        setNewList({ ...newList, is_public: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ranked">Liste classée</Label>
                      <p className="text-sm text-muted-foreground">
                        Ordonnez vos mangas par position
                      </p>
                    </div>
                    <Switch
                      id="ranked"
                      checked={newList.is_ranked}
                      onCheckedChange={(checked) =>
                        setNewList({ ...newList, is_ranked: checked })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateList}
                  disabled={!newList.name.trim() || createList.isPending}
                >
                  Créer la liste
                </Button>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isMyLists ? (
          // Mes listes
          <div>
            {loadingUser ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ListCardSkeleton key={i} />
                ))}
              </div>
            ) : userLists && userLists.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {userLists.map((list) => (
                  <ListCard key={list.id} list={list} />
                ))}
              </div>
            ) : (
              <Card className="py-12">
                <CardContent className="text-center">
                  <p className="text-lg text-muted-foreground mb-4">
                    Vous n'avez pas encore de liste
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer ma première liste
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Toutes les listes
          <Tabs defaultValue="popular">
            <TabsList className="mb-6">
              <TabsTrigger value="popular" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Populaires
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-2">
                <Clock className="h-4 w-4" />
                Récentes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="popular">
              {loadingPopular ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ListCardSkeleton key={i} />
                  ))}
                </div>
              ) : popularLists && popularLists.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {popularLists.map((list) => (
                    <ListCard key={list.id} list={list} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Aucune liste pour le moment
                </p>
              )}
            </TabsContent>

            <TabsContent value="recent">
              {loadingRecent ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ListCardSkeleton key={i} />
                  ))}
                </div>
              ) : recentLists && recentLists.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recentLists.map((list) => (
                    <ListCard key={list.id} list={list} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Aucune liste pour le moment
                </p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
