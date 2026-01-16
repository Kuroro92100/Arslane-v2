import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { List, ListItem, CreateListInput, AddListItemInput } from '@/types/database';
import { toast } from 'sonner';

// Récupérer les listes d'un utilisateur
export function useUserLists(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['lists', 'user', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          ),
          list_items (count)
        `)
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as List[];
    },
    enabled: !!targetUserId,
  });
}

// Récupérer une liste spécifique avec ses items
export function useList(listId: string) {
  return useQuery({
    queryKey: ['list', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          ),
          list_items (
            *
          )
        `)
        .eq('id', listId)
        .single();

      if (error) throw error;

      // Trier les items par position si c'est une liste classée
      if (data.is_ranked && data.list_items) {
        data.list_items.sort((a: ListItem, b: ListItem) => (a.position || 0) - (b.position || 0));
      }

      return data as List;
    },
  });
}

// Récupérer les listes populaires
export function usePopularLists(limit: number = 10) {
  return useQuery({
    queryKey: ['lists', 'popular', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          ),
          list_items (count)
        `)
        .eq('is_public', true)
        .order('likes_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as List[];
    },
  });
}

// Récupérer les listes récentes
export function useRecentLists(limit: number = 10) {
  return useQuery({
    queryKey: ['lists', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          ),
          list_items (count)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as List[];
    },
  });
}

// Créer une liste
export function useCreateList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateListInput) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('lists')
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
        activity_type: 'created_list',
        list_id: data.id,
      });

      return data as List;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('Liste créée');
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });
}

// Mettre à jour une liste
export function useUpdateList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      updates,
    }: {
      listId: string;
      updates: Partial<CreateListInput>;
    }) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as List;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['list', data.id] });
      toast.success('Liste mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

// Supprimer une liste
export function useDeleteList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id);

      if (error) throw error;
      return listId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('Liste supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });
}

// Ajouter un manga à une liste
export function useAddToList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddListItemInput) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('list_items')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour l'image de couverture si c'est le premier item
      if (input.manga_image_url) {
        const { data: list } = await supabase
          .from('lists')
          .select('cover_image_url')
          .eq('id', input.list_id)
          .single();

        if (!list?.cover_image_url) {
          await supabase
            .from('lists')
            .update({ cover_image_url: input.manga_image_url })
            .eq('id', input.list_id);
        }
      }

      // Créer l'activité
      await supabase.from('activities').insert({
        user_id: user.id,
        activity_type: 'updated_list',
        list_id: input.list_id,
        mal_id: input.mal_id,
        manga_title: input.manga_title,
        manga_image_url: input.manga_image_url,
      });

      return data as ListItem;
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['list', input.list_id] });
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('Manga ajouté à la liste');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Ce manga est déjà dans cette liste');
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    },
  });
}

// Retirer un manga d'une liste
export function useRemoveFromList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, malId }: { listId: string; malId: number }) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('list_id', listId)
        .eq('mal_id', malId);

      if (error) throw error;
      return { listId, malId };
    },
    onSuccess: ({ listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('Manga retiré de la liste');
    },
    onError: () => {
      toast.error('Erreur lors du retrait');
    },
  });
}

// Réordonner les items d'une liste
export function useReorderListItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      items,
    }: {
      listId: string;
      items: { id: string; position: number }[];
    }) => {
      if (!user?.id) throw new Error('Non authentifié');

      // Mettre à jour toutes les positions
      const updates = items.map((item) =>
        supabase
          .from('list_items')
          .update({ position: item.position })
          .eq('id', item.id)
      );

      await Promise.all(updates);
      return listId;
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
    },
  });
}

// Vérifier si l'utilisateur a liké une liste
export function useHasLikedList(listId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['list-like', listId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('list_likes')
        .select('user_id')
        .eq('list_id', listId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id,
  });
}

// Liker/Unliker une liste
export function useToggleListLike() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, isLiked }: { listId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Non authentifié');

      if (isLiked) {
        const { error } = await supabase
          .from('list_likes')
          .delete()
          .eq('list_id', listId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('list_likes').insert({
          list_id: listId,
          user_id: user.id,
        });

        if (error) throw error;
      }

      return { listId, nowLiked: !isLiked };
    },
    onSuccess: ({ listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-like', listId] });
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
    },
  });
}
