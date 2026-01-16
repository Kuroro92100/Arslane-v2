import { useState } from 'react';
import { Plus, Check, Trash2, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  useAddToLibrary,
  useUpdateMangaEntry,
  useRemoveFromLibrary,
  useToggleFavorite,
  useMangaEntry,
} from '@/hooks/useMangaLibrary';
import { useAuth } from '@/contexts/AuthContext';
import type { JikanManga } from '@/services/jikanApi';
import type { ReadingStatus } from '@/types/database';
import { STATUS_LABELS } from '@/types/database';

interface AddToLibraryDialogProps {
  manga: JikanManga;
  children?: React.ReactNode;
}

export function AddToLibraryDialog({ manga, children }: AddToLibraryDialogProps) {
  const { user } = useAuth();
  const { data: existingEntry } = useMangaEntry(manga.mal_id);
  const addToLibrary = useAddToLibrary();
  const updateEntry = useUpdateMangaEntry();
  const removeFromLibrary = useRemoveFromLibrary();
  const toggleFavorite = useToggleFavorite();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ReadingStatus>(existingEntry?.status || 'plan_to_read');
  const [chaptersRead, setChaptersRead] = useState(existingEntry?.chapters_read || 0);
  const [volumesRead, setVolumesRead] = useState(existingEntry?.volumes_read || 0);
  const [score, setScore] = useState<number>(existingEntry?.score || 0);
  const [notes, setNotes] = useState(existingEntry?.notes || '');

  const handleSubmit = async () => {
    if (existingEntry) {
      await updateEntry.mutateAsync({
        malId: manga.mal_id,
        updates: {
          status,
          chapters_read: chaptersRead,
          volumes_read: volumesRead,
          score: score || null,
          notes: notes || null,
        },
      });
    } else {
      await addToLibrary.mutateAsync({
        mal_id: manga.mal_id,
        title: manga.title,
        title_japanese: manga.title_japanese,
        image_url: manga.images.jpg.large_image_url || manga.images.jpg.image_url,
        status,
        chapters_read: chaptersRead,
        total_chapters: manga.chapters,
        volumes_read: volumesRead,
        total_volumes: manga.volumes,
        score: score || null,
        notes: notes || null,
      });
    }
    setOpen(false);
  };

  const handleRemove = async () => {
    await removeFromLibrary.mutateAsync(manga.mal_id);
    setOpen(false);
  };

  const handleToggleFavorite = async () => {
    if (existingEntry) {
      await toggleFavorite.mutateAsync({
        malId: manga.mal_id,
        isFavorite: !existingEntry.is_favorite,
      });
    }
  };

  if (!user) {
    return (
      <Button asChild>
        <a href="/auth">Connectez-vous pour ajouter</a>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={existingEntry ? 'secondary' : 'default'}>
            {existingEntry ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Dans la bibliothèque
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {existingEntry ? 'Modifier' : 'Ajouter à ma bibliothèque'}
          </DialogTitle>
          <DialogDescription>{manga.title}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Statut */}
          <div className="grid gap-2">
            <Label htmlFor="status">Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ReadingStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progression */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="chapters">Chapitres lus</Label>
              <Input
                id="chapters"
                type="number"
                min={0}
                max={manga.chapters || 9999}
                value={chaptersRead}
                onChange={(e) => setChaptersRead(parseInt(e.target.value) || 0)}
              />
              {manga.chapters && (
                <p className="text-xs text-muted-foreground">/ {manga.chapters}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="volumes">Volumes lus</Label>
              <Input
                id="volumes"
                type="number"
                min={0}
                max={manga.volumes || 999}
                value={volumesRead}
                onChange={(e) => setVolumesRead(parseInt(e.target.value) || 0)}
              />
              {manga.volumes && (
                <p className="text-xs text-muted-foreground">/ {manga.volumes}</p>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="grid gap-2">
            <Label>Note : {score > 0 ? score : '-'}/10</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[score]}
                onValueChange={([v]) => setScore(v)}
                max={10}
                step={0.5}
                className="flex-1"
              />
              <Star
                className={`h-5 w-5 ${score > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes personnelles</Label>
            <Textarea
              id="notes"
              placeholder="Ajouter des notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex gap-2">
            {existingEntry && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleFavorite}
                  disabled={toggleFavorite.isPending}
                >
                  <Heart
                    className={`h-4 w-4 ${existingEntry.is_favorite ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleRemove}
                  disabled={removeFromLibrary.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={addToLibrary.isPending || updateEntry.isPending}
          >
            {existingEntry ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Version rapide pour ajouter sans dialog
export function QuickAddButton({ manga }: { manga: JikanManga }) {
  const { user } = useAuth();
  const { data: existingEntry } = useMangaEntry(manga.mal_id);
  const addToLibrary = useAddToLibrary();

  if (!user) return null;

  if (existingEntry) {
    return (
      <Button size="icon" variant="secondary" disabled>
        <Check className="h-4 w-4" />
      </Button>
    );
  }

  const handleQuickAdd = async () => {
    await addToLibrary.mutateAsync({
      mal_id: manga.mal_id,
      title: manga.title,
      title_japanese: manga.title_japanese,
      image_url: manga.images.jpg.large_image_url || manga.images.jpg.image_url,
      total_chapters: manga.chapters,
      total_volumes: manga.volumes,
      status: 'plan_to_read',
    });
  };

  return (
    <Button
      size="icon"
      variant="secondary"
      onClick={handleQuickAdd}
      disabled={addToLibrary.isPending}
    >
      <Plus className="h-4 w-4" />
    </Button>
  );
}
