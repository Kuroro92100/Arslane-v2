import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  MangaEntry,
  CreateMangaEntryInput,
  UpdateMangaEntryInput,
  ReadingStatus,
} from '@/types/database';
import { toast } from 'sonner';

// Récupérer toute la bibliothèque de l'utilisateur
export function useUserLibrary(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['manga-library', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('manga_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as MangaEntry[];
    },
    enabled: !!targetUserId,
  });
}

// Récupérer les entrées par statut
export function useLibraryByStatus(status: ReadingStatus, userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['manga-library', targetUserId, status],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('manga_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', status)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as MangaEntry[];
    },
    enabled: !!targetUserId,
  });
}

// Récupérer une entrée spécifique
export function useMangaEntry(malId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['manga-entry', user?.id, malId],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('manga_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('mal_id', malId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MangaEntry | null;
    },
    enabled: !!user?.id,
  });
}

// Ajouter un manga à la bibliothèque
export function useAddToLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMangaEntryInput) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('manga_entries')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;

      // Créer l'activité
      await supabase.from('activities').insert({
        user_id: user.id,
        activity_type: 'added_manga',
        mal_id: input.mal_id,
        manga_title: input.title,
        manga_image_url: input.image_url,
        status: input.status || 'plan_to_read',
      });

      return data as MangaEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['manga-library'] });
      queryClient.invalidateQueries({ queryKey: ['manga-entry', user?.id, data.mal_id] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('Manga ajouté à la bibliothèque');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Ce manga est déjà dans votre bibliothèque');
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    },
  });
}

// Mettre à jour une entrée
export function useUpdateMangaEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ malId, updates }: { malId: number; updates: UpdateMangaEntryInput }) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('manga_entries')
        .update(updates)
        .eq('user_id', user.id)
        .eq('mal_id', malId)
        .select()
        .single();

      if (error) throw error;

      // Créer des activités selon les changements
      if (updates.status === 'completed') {
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'completed_manga',
          mal_id: malId,
          manga_title: data.title,
          manga_image_url: data.image_url,
          status: 'completed',
        });
      }

      if (updates.score !== undefined) {
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'rated_manga',
          mal_id: malId,
          manga_title: data.title,
          manga_image_url: data.image_url,
          score: updates.score,
        });
      }

      return data as MangaEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['manga-library'] });
      queryClient.invalidateQueries({ queryKey: ['manga-entry', user?.id, data.mal_id] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('Manga mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

// Supprimer une entrée
export function useRemoveFromLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (malId: number) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('manga_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('mal_id', malId);

      if (error) throw error;
      return malId;
    },
    onSuccess: (malId) => {
      queryClient.invalidateQueries({ queryKey: ['manga-library'] });
      queryClient.invalidateQueries({ queryKey: ['manga-entry', user?.id, malId] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('Manga retiré de la bibliothèque');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });
}

// Basculer le favori
export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ malId, isFavorite }: { malId: number; isFavorite: boolean }) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('manga_entries')
        .update({ is_favorite: isFavorite })
        .eq('user_id', user.id)
        .eq('mal_id', malId)
        .select()
        .single();

      if (error) throw error;
      return data as MangaEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['manga-library'] });
      queryClient.invalidateQueries({ queryKey: ['manga-entry', user?.id, data.mal_id] });
      toast.success(data.is_favorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
    },
  });
}

// Récupérer les favoris
export function useFavorites(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['favorites', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('manga_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_favorite', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as MangaEntry[];
    },
    enabled: !!targetUserId,
  });
}
