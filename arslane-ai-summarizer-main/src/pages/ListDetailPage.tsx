import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Edit,
  Trash2,
  Share2,
  ArrowLeft,
  Lock,
  Globe,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { MangaCard } from '@/components/MangaCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  useList,
  useHasLikedList,
  useToggleListLike,
  useDeleteList,
  useRemoveFromList,
} from '@/hooks/useLists';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: list, isLoading } = useList(id || '');
  const { data: hasLiked } = useHasLikedList(id || '');
  const toggleLike = useToggleListLike();
  const deleteList = useDeleteList();
  const removeFromList = useRemoveFromList();

  const isOwner = user?.id === list?.user_id;

  const handleDelete = async () => {
    if (id) {
      await deleteList.mutateAsync(id);
      navigate('/my-lists');
    }
  };

  const handleRemoveItem = async (malId: number) => {
    if (id) {
      await removeFromList.mutateAsync({ listId: id, malId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <p className="text-center text-lg">Liste non trouvée</p>
          <div className="mt-4 text-center">
            <Button asChild>
              <Link to="/lists">Retour aux listes</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{list.name}</h1>
                <Badge variant={list.is_public ? 'secondary' : 'outline'}>
                  {list.is_public ? (
                    <>
                      <Globe className="mr-1 h-3 w-3" />
                      Publique
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1 h-3 w-3" />
                      Privée
                    </>
                  )}
                </Badge>
                {list.is_ranked && <Badge variant="outline">Classée</Badge>}
              </div>

              {list.description && (
                <p className="mt-2 text-muted-foreground">{list.description}</p>
              )}

              <div className="mt-4 flex items-center gap-4">
                <Link
                  to={`/profile/${list.profiles?.username}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={list.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {list.profiles?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {list.profiles?.display_name || list.profiles?.username}
                  </span>
                </Link>
                <span className="text-sm text-muted-foreground">
                  Créée {formatDistanceToNow(new Date(list.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
                <span className="text-sm text-muted-foreground">
                  {list.list_items?.length || 0} mangas
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={hasLiked ? 'default' : 'outline'}
                onClick={() =>
                  toggleLike.mutate({ listId: id!, isLiked: hasLiked || false })
                }
                disabled={!user || toggleLike.isPending}
              >
                <Heart
                  className={cn(
                    'mr-2 h-4 w-4',
                    hasLiked && 'fill-current'
                  )}
                />
                {list.likes_count}
              </Button>

              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer la liste ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. La liste et tous ses
                            éléments seront définitivement supprimés.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Liste des mangas */}
        {list.list_items && list.list_items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {list.list_items.map((item, index) => (
              <div key={item.id} className="group relative">
                {list.is_ranked && (
                  <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                )}
                <MangaCard
                  manga={{
                    mal_id: item.mal_id,
                    title: item.manga_title,
                    image_url: item.manga_image_url,
                  }}
                  showStatus={false}
                />
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveItem(item.mal_id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {item.notes && (
                  <Card className="mt-2">
                    <CardContent className="p-2 text-sm text-muted-foreground">
                      {item.notes}
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <p className="text-lg text-muted-foreground">
                Cette liste est vide
              </p>
              {isOwner && (
                <Button asChild className="mt-4">
                  <Link to="/discover">Ajouter des mangas</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
