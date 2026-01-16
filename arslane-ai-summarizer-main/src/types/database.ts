// Types pour la base de données MangaTrack

export type ReadingStatus = 'reading' | 'completed' | 'plan_to_read' | 'on_hold' | 'dropped';

export type ActivityType =
  | 'added_manga'
  | 'completed_manga'
  | 'rated_manga'
  | 'reviewed_manga'
  | 'created_list'
  | 'updated_list'
  | 'followed_user';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_genres: string[] | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface MangaEntry {
  id: string;
  user_id: string;
  mal_id: number;
  title: string;
  title_japanese: string | null;
  image_url: string | null;
  status: ReadingStatus;
  chapters_read: number;
  total_chapters: number | null;
  volumes_read: number;
  total_volumes: number | null;
  score: number | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  is_favorite: boolean;
  reread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  mal_id: number;
  manga_title: string;
  manga_image_url: string | null;
  title: string | null;
  content: string;
  score: number | null;
  contains_spoilers: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  // Relations jointes
  profiles?: Profile;
}

export interface ReviewLike {
  user_id: string;
  review_id: string;
  created_at: string;
}

export interface List {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  is_ranked: boolean;
  cover_image_url: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
  // Relations jointes
  profiles?: Profile;
  list_items?: ListItem[];
}

export interface ListItem {
  id: string;
  list_id: string;
  mal_id: number;
  manga_title: string;
  manga_image_url: string | null;
  position: number | null;
  notes: string | null;
  created_at: string;
}

export interface ListLike {
  user_id: string;
  list_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  mal_id: number | null;
  manga_title: string | null;
  manga_image_url: string | null;
  target_user_id: string | null;
  list_id: string | null;
  review_id: string | null;
  score: number | null;
  status: ReadingStatus | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Relations jointes
  profiles?: Profile;
  target_profile?: Profile;
}

// Types pour les formulaires et création
export interface CreateMangaEntryInput {
  mal_id: number;
  title: string;
  title_japanese?: string | null;
  image_url?: string | null;
  status?: ReadingStatus;
  chapters_read?: number;
  total_chapters?: number | null;
  volumes_read?: number;
  total_volumes?: number | null;
  score?: number | null;
  notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_favorite?: boolean;
}

export interface UpdateMangaEntryInput {
  status?: ReadingStatus;
  chapters_read?: number;
  volumes_read?: number;
  score?: number | null;
  notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_favorite?: boolean;
  reread_count?: number;
}

export interface CreateReviewInput {
  mal_id: number;
  manga_title: string;
  manga_image_url?: string | null;
  title?: string | null;
  content: string;
  score?: number | null;
  contains_spoilers?: boolean;
}

export interface CreateListInput {
  name: string;
  description?: string | null;
  is_public?: boolean;
  is_ranked?: boolean;
}

export interface AddListItemInput {
  list_id: string;
  mal_id: number;
  manga_title: string;
  manga_image_url?: string | null;
  position?: number | null;
  notes?: string | null;
}

// Statistiques utilisateur
export interface UserStats {
  total_manga: number;
  reading: number;
  completed: number;
  plan_to_read: number;
  on_hold: number;
  dropped: number;
  total_chapters_read: number;
  total_volumes_read: number;
  mean_score: number | null;
  favorites_count: number;
  reviews_count: number;
  lists_count: number;
  followers_count: number;
  following_count: number;
}

// Labels et couleurs pour les statuts
export const STATUS_LABELS: Record<ReadingStatus, string> = {
  reading: 'En cours',
  completed: 'Terminé',
  plan_to_read: 'À lire',
  on_hold: 'En pause',
  dropped: 'Abandonné',
};

export const STATUS_COLORS: Record<ReadingStatus, string> = {
  reading: 'bg-blue-500',
  completed: 'bg-green-500',
  plan_to_read: 'bg-purple-500',
  on_hold: 'bg-yellow-500',
  dropped: 'bg-red-500',
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  added_manga: 'a ajouté',
  completed_manga: 'a terminé',
  rated_manga: 'a noté',
  reviewed_manga: 'a critiqué',
  created_list: 'a créé la liste',
  updated_list: 'a mis à jour la liste',
  followed_user: 'suit maintenant',
};
