import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, UserStats, Activity } from '@/types/database';
import { toast } from 'sonner';

// Récupérer le profil actuel
export function useCurrentProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });
}

// Récupérer un profil par username
export function useProfileByUsername(username: string) {
  return useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!username,
  });
}

// Récupérer un profil par ID
export function useProfileById(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
}

// Mettre à jour le profil
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profil mis à jour');
    },
    onError: (error: Error) => {
      if (error.message.includes('username')) {
        toast.error('Ce nom d\'utilisateur est déjà pris');
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    },
  });
}

// Récupérer les statistiques d'un utilisateur
export function useUserStats(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-stats', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      // Récupérer les stats de la bibliothèque
      const { data: entries } = await supabase
        .from('manga_entries')
        .select('status, chapters_read, volumes_read, score, is_favorite')
        .eq('user_id', targetUserId);

      // Compter les reviews
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      // Compter les listes
      const { count: listsCount } = await supabase
        .from('lists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      // Compter les followers
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      // Compter les following
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      // Calculer les stats
      const stats: UserStats = {
        total_manga: entries?.length || 0,
        reading: entries?.filter(e => e.status === 'reading').length || 0,
        completed: entries?.filter(e => e.status === 'completed').length || 0,
        plan_to_read: entries?.filter(e => e.status === 'plan_to_read').length || 0,
        on_hold: entries?.filter(e => e.status === 'on_hold').length || 0,
        dropped: entries?.filter(e => e.status === 'dropped').length || 0,
        total_chapters_read: entries?.reduce((sum, e) => sum + (e.chapters_read || 0), 0) || 0,
        total_volumes_read: entries?.reduce((sum, e) => sum + (e.volumes_read || 0), 0) || 0,
        mean_score: entries?.filter(e => e.score).length
          ? entries.filter(e => e.score).reduce((sum, e) => sum + (e.score || 0), 0) / entries.filter(e => e.score).length
          : null,
        favorites_count: entries?.filter(e => e.is_favorite).length || 0,
        reviews_count: reviewsCount || 0,
        lists_count: listsCount || 0,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
      };

      return stats;
    },
    enabled: !!targetUserId,
  });
}

// Vérifier si on suit un utilisateur
export function useIsFollowing(targetUserId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-following', user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || user.id === targetUserId) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId,
  });
}

// Follow/Unfollow un utilisateur
export function useToggleFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, isFollowing }: { targetUserId: string; isFollowing: boolean }) => {
      if (!user?.id) throw new Error('Non authentifié');
      if (user.id === targetUserId) throw new Error('Vous ne pouvez pas vous suivre vous-même');

      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        if (error) throw error;

        // Créer l'activité
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'followed_user',
          target_user_id: targetUserId,
        });
      }

      return { targetUserId, nowFollowing: !isFollowing };
    },
    onSuccess: ({ targetUserId, nowFollowing }) => {
      queryClient.invalidateQueries({ queryKey: ['is-following', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast.success(nowFollowing ? 'Vous suivez cet utilisateur' : 'Vous ne suivez plus cet utilisateur');
    },
    onError: () => {
      toast.error('Erreur');
    },
  });
}

// Récupérer les followers d'un utilisateur
export function useFollowers(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['followers', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          created_at,
          profiles!follows_follower_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('following_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(f => f.profiles) as Profile[];
    },
    enabled: !!targetUserId,
  });
}

// Récupérer les utilisateurs suivis
export function useFollowing(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['following', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          created_at,
          profiles!follows_following_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('follower_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(f => f.profiles) as Profile[];
    },
    enabled: !!targetUserId,
  });
}

// Récupérer les activités d'un utilisateur
export function useUserActivities(userId?: string, limit: number = 20) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['activities', 'user', targetUserId, limit],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!targetUserId,
  });
}

// Récupérer le feed d'activités (des utilisateurs suivis)
export function useActivityFeed(limit: number = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity-feed', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      // Récupérer les IDs des utilisateurs suivis
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = following?.map(f => f.following_id) || [];

      // Inclure aussi ses propres activités
      followingIds.push(user.id);

      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user?.id,
  });
}

// Rechercher des utilisateurs
export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['search-users', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: query.length >= 2,
  });
}
