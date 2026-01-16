-- MangaTrack Database Schema
-- Application de suivi de mangas (style Letterboxd)

-- =====================================================
-- TABLE: profiles (extension de auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  favorite_genres TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche de profils
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- =====================================================
-- TABLE: manga_entries (suivi de lecture)
-- =====================================================
CREATE TYPE reading_status AS ENUM ('reading', 'completed', 'plan_to_read', 'on_hold', 'dropped');

CREATE TABLE IF NOT EXISTS public.manga_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mal_id INTEGER NOT NULL, -- MyAnimeList ID
  title VARCHAR(500) NOT NULL,
  title_japanese VARCHAR(500),
  image_url TEXT,
  status reading_status NOT NULL DEFAULT 'plan_to_read',
  chapters_read INTEGER DEFAULT 0,
  total_chapters INTEGER,
  volumes_read INTEGER DEFAULT 0,
  total_volumes INTEGER,
  score DECIMAL(3,1) CHECK (score >= 0 AND score <= 10),
  notes TEXT,
  start_date DATE,
  end_date DATE,
  is_favorite BOOLEAN DEFAULT false,
  reread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unique: un utilisateur ne peut avoir qu'une entrée par manga
  UNIQUE(user_id, mal_id)
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_manga_entries_user_id ON public.manga_entries(user_id);
CREATE INDEX idx_manga_entries_mal_id ON public.manga_entries(mal_id);
CREATE INDEX idx_manga_entries_status ON public.manga_entries(status);
CREATE INDEX idx_manga_entries_score ON public.manga_entries(score);

-- =====================================================
-- TABLE: reviews (critiques de mangas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mal_id INTEGER NOT NULL,
  manga_title VARCHAR(500) NOT NULL,
  manga_image_url TEXT,
  title VARCHAR(200),
  content TEXT NOT NULL,
  score DECIMAL(3,1) CHECK (score >= 0 AND score <= 10),
  contains_spoilers BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un utilisateur peut écrire une seule critique par manga
  UNIQUE(user_id, mal_id)
);

-- Index pour critiques
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_mal_id ON public.reviews(mal_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- =====================================================
-- TABLE: review_likes (likes sur les critiques)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.review_likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, review_id)
);

-- =====================================================
-- TABLE: lists (listes personnalisées)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  is_ranked BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lists_user_id ON public.lists(user_id);

-- =====================================================
-- TABLE: list_items (mangas dans les listes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  mal_id INTEGER NOT NULL,
  manga_title VARCHAR(500) NOT NULL,
  manga_image_url TEXT,
  position INTEGER, -- Pour les listes classées
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(list_id, mal_id)
);

CREATE INDEX idx_list_items_list_id ON public.list_items(list_id);

-- =====================================================
-- TABLE: list_likes (likes sur les listes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.list_likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, list_id)
);

-- =====================================================
-- TABLE: follows (système de follow)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),

  -- Empêcher de se suivre soi-même
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- =====================================================
-- TABLE: activities (fil d'activité)
-- =====================================================
CREATE TYPE activity_type AS ENUM (
  'added_manga',
  'completed_manga',
  'rated_manga',
  'reviewed_manga',
  'created_list',
  'updated_list',
  'followed_user'
);

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  mal_id INTEGER, -- Pour les activités liées à un manga
  manga_title VARCHAR(500),
  manga_image_url TEXT,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Pour les follows
  list_id UUID REFERENCES public.lists(id) ON DELETE SET NULL, -- Pour les listes
  review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL, -- Pour les critiques
  score DECIMAL(3,1), -- Pour les notes
  status reading_status, -- Pour les changements de statut
  metadata JSONB, -- Données additionnelles
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_activities_type ON public.activities(activity_type);

-- =====================================================
-- TRIGGERS: Mise à jour automatique de updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manga_entries_updated_at
  BEFORE UPDATE ON public.manga_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Création automatique de profil à l'inscription
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TRIGGER: Mise à jour du compteur de likes (reviews)
-- =====================================================
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews SET likes_count = likes_count - 1 WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_likes
  AFTER INSERT OR DELETE ON public.review_likes
  FOR EACH ROW EXECUTE FUNCTION update_review_likes_count();

-- =====================================================
-- TRIGGER: Mise à jour du compteur de likes (lists)
-- =====================================================
CREATE OR REPLACE FUNCTION update_list_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lists SET likes_count = likes_count + 1 WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lists SET likes_count = likes_count - 1 WHERE id = OLD.list_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_list_likes
  AFTER INSERT OR DELETE ON public.list_likes
  FOR EACH ROW EXECUTE FUNCTION update_list_likes_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Profiles publics lisibles par tous" ON public.profiles
  FOR SELECT USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent modifier leur profil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies pour manga_entries
CREATE POLICY "Lecture propre entrées ou profils publics" ON public.manga_entries
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_public = true)
  );

CREATE POLICY "Utilisateurs peuvent gérer leurs entrées" ON public.manga_entries
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour reviews
CREATE POLICY "Reviews lisibles par tous" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Utilisateurs peuvent gérer leurs reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour review_likes
CREATE POLICY "Likes reviews lisibles par tous" ON public.review_likes
  FOR SELECT USING (true);

CREATE POLICY "Utilisateurs peuvent liker" ON public.review_likes
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour lists
CREATE POLICY "Listes publiques lisibles par tous" ON public.lists
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Utilisateurs peuvent gérer leurs listes" ON public.lists
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour list_items
CREATE POLICY "Items de listes publiques lisibles" ON public.list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE id = list_id AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Propriétaires peuvent gérer les items" ON public.list_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.lists WHERE id = list_id AND user_id = auth.uid())
  );

-- Policies pour list_likes
CREATE POLICY "Likes listes lisibles par tous" ON public.list_likes
  FOR SELECT USING (true);

CREATE POLICY "Utilisateurs peuvent liker listes" ON public.list_likes
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour follows
CREATE POLICY "Follows lisibles par tous" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Utilisateurs peuvent follow/unfollow" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);

-- Policies pour activities
CREATE POLICY "Activities des profils publics lisibles" ON public.activities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_public = true)
    OR user_id = auth.uid()
  );

CREATE POLICY "Utilisateurs peuvent créer leurs activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
