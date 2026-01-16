import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Review, CreateReviewInput } from '@/types/database';
import { toast } from 'sonner';

// Récupérer les critiques d'un manga
export function useMangaReviews(malId: number) {
  return useQuery({
    queryKey: ['reviews', 'manga', malId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('mal_id', malId)
        .order('likes_count', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });
}

// Récupérer les critiques d'un utilisateur
export function useUserReviews(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['reviews', 'user', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!targetUserId,
  });
}

// Récupérer une critique spécifique
export function useReview(reviewId: string) {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('id', reviewId)
        .single();

      if (error) throw error;
      return data as Review;
    },
  });
}

// Récupérer les critiques récentes (pour le feed)
export function useRecentReviews(limit: number = 10) {
  return useQuery({
    queryKey: ['reviews', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Review[];
    },
  });
}

// Créer une critique
export function useCreateReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('reviews')
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
        activity_type: 'reviewed_manga',
        mal_id: input.mal_id,
        manga_title: input.manga_title,
        manga_image_url: input.manga_image_url,
        review_id: data.id,
        score: input.score,
      });

      return data as Review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('Critique publiée');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Vous avez déjà écrit une critique pour ce manga');
      } else {
        toast.error('Erreur lors de la publication');
      }
    },
  });
}

// Mettre à jour une critique
export function useUpdateReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      updates,
    }: {
      reviewId: string;
      updates: Partial<CreateReviewInput>;
    }) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Critique mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

// Supprimer une critique
export function useDeleteReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;
      return reviewId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('Critique supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });
}

// Vérifier si l'utilisateur a liké une critique
export function useHasLikedReview(reviewId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['review-like', reviewId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('review_likes')
        .select('user_id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id,
  });
}

// Liker/Unliker une critique
export function useToggleReviewLike() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, isLiked }: { reviewId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Non authentifié');

      if (isLiked) {
        const { error } = await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('review_likes').insert({
          review_id: reviewId,
          user_id: user.id,
        });

        if (error) throw error;
      }

      return { reviewId, nowLiked: !isLiked };
    },
    onSuccess: ({ reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['review-like', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
