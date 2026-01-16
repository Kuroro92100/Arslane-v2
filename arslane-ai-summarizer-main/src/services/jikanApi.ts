// Service API Jikan (MyAnimeList)
// Documentation: https://docs.api.jikan.moe/

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Types pour l'API Jikan
export interface JikanManga {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: string;
  chapters: number | null;
  volumes: number | null;
  status: string;
  publishing: boolean;
  published: {
    from: string | null;
    to: string | null;
    prop: {
      from: { day: number; month: number; year: number };
      to: { day: number; month: number; year: number };
    };
    string: string;
  };
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  authors: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  serializations: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  genres: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  explicit_genres: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  themes: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  demographics: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface JikanSearchResponse {
  pagination: JikanPagination;
  data: JikanManga[];
}

export interface JikanMangaResponse {
  data: JikanManga;
}

export interface JikanCharacter {
  mal_id: number;
  url: string;
  images: {
    jpg: { image_url: string };
    webp: { image_url: string };
  };
  name: string;
  role: string;
}

export interface JikanRecommendation {
  entry: {
    mal_id: number;
    url: string;
    images: {
      jpg: { image_url: string; large_image_url: string };
      webp: { image_url: string; large_image_url: string };
    };
    title: string;
  };
  votes: number;
}

// Gestion du rate limiting (3 requêtes/seconde max pour Jikan)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 350; // 350ms entre les requêtes

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  const response = await fetch(url);

  if (response.status === 429) {
    // Rate limited, attendre et réessayer
    await new Promise(resolve => setTimeout(resolve, 1000));
    return rateLimitedFetch(url);
  }

  return response;
}

// Rechercher des mangas
export async function searchManga(
  query: string,
  page: number = 1,
  limit: number = 24,
  filters?: {
    type?: 'manga' | 'novel' | 'lightnovel' | 'oneshot' | 'doujin' | 'manhwa' | 'manhua';
    status?: 'publishing' | 'complete' | 'hiatus' | 'discontinued' | 'upcoming';
    orderBy?: 'title' | 'score' | 'popularity' | 'rank' | 'chapters' | 'volumes' | 'favorites';
    sort?: 'asc' | 'desc';
    genres?: number[];
    sfw?: boolean;
  }
): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString(),
    sfw: (filters?.sfw ?? true).toString(),
  });

  if (filters?.type) params.append('type', filters.type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.orderBy) params.append('order_by', filters.orderBy);
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.genres?.length) params.append('genres', filters.genres.join(','));

  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga?${params}`);

  if (!response.ok) {
    throw new Error(`Erreur API Jikan: ${response.status}`);
  }

  return response.json();
}

// Obtenir les détails d'un manga
export async function getMangaById(malId: number): Promise<JikanManga> {
  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga/${malId}`);

  if (!response.ok) {
    throw new Error(`Manga non trouvé: ${malId}`);
  }

  const data: JikanMangaResponse = await response.json();
  return data.data;
}

// Obtenir les détails complets d'un manga
export async function getMangaFullById(malId: number): Promise<JikanManga & { relations?: unknown[]; external?: unknown[] }> {
  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga/${malId}/full`);

  if (!response.ok) {
    throw new Error(`Manga non trouvé: ${malId}`);
  }

  const data = await response.json();
  return data.data;
}

// Obtenir les personnages d'un manga
export async function getMangaCharacters(malId: number): Promise<JikanCharacter[]> {
  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga/${malId}/characters`);

  if (!response.ok) {
    throw new Error(`Personnages non trouvés pour: ${malId}`);
  }

  const data = await response.json();
  return data.data;
}

// Obtenir les recommandations pour un manga
export async function getMangaRecommendations(malId: number): Promise<JikanRecommendation[]> {
  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga/${malId}/recommendations`);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.data;
}

// Obtenir les mangas populaires
export async function getTopManga(
  page: number = 1,
  limit: number = 24,
  filter?: 'publishing' | 'upcoming' | 'bypopularity' | 'favorite'
): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filter) params.append('filter', filter);

  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/top/manga?${params}`);

  if (!response.ok) {
    throw new Error(`Erreur API Jikan: ${response.status}`);
  }

  return response.json();
}

// Obtenir les mangas par genre
export async function getMangaByGenre(
  genreId: number,
  page: number = 1,
  limit: number = 24
): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    genres: genreId.toString(),
    page: page.toString(),
    limit: limit.toString(),
    sfw: 'true',
  });

  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga?${params}`);

  if (!response.ok) {
    throw new Error(`Erreur API Jikan: ${response.status}`);
  }

  return response.json();
}

// Obtenir la liste des genres
export async function getMangaGenres(): Promise<Array<{ mal_id: number; name: string; count: number }>> {
  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/genres/manga`);

  if (!response.ok) {
    throw new Error(`Erreur API Jikan: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// Obtenir les mangas récemment sortis
export async function getRecentManga(page: number = 1, limit: number = 24): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    order_by: 'start_date',
    sort: 'desc',
    sfw: 'true',
  });

  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga?${params}`);

  if (!response.ok) {
    throw new Error(`Erreur API Jikan: ${response.status}`);
  }

  return response.json();
}

// Obtenir des mangas aléatoires
export async function getRandomManga(): Promise<JikanManga> {
  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/random/manga`);

  if (!response.ok) {
    throw new Error(`Erreur API Jikan: ${response.status}`);
  }

  const data: JikanMangaResponse = await response.json();
  return data.data;
}

// Recherche avancée de mangas en cours de publication
export async function getPublishingManga(page: number = 1, limit: number = 24): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'publishing',
    order_by: 'popularity',
    sort: 'asc',
    sfw: 'true',
  });

  const response = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga?${params}`);

  if (!response.ok) {
    throw new Error(`Erreur API Jikan: ${response.status}`);
  }

  return response.json();
}

// Mapper les données Jikan vers notre format simplifié
export function mapJikanMangaToSimple(manga: JikanManga) {
  return {
    mal_id: manga.mal_id,
    title: manga.title,
    title_japanese: manga.title_japanese,
    image_url: manga.images.jpg.large_image_url || manga.images.jpg.image_url,
    synopsis: manga.synopsis,
    score: manga.score,
    chapters: manga.chapters,
    volumes: manga.volumes,
    status: manga.status,
    publishing: manga.publishing,
    genres: manga.genres.map(g => g.name),
    authors: manga.authors.map(a => a.name),
    type: manga.type,
    rank: manga.rank,
    popularity: manga.popularity,
    members: manga.members,
  };
}
