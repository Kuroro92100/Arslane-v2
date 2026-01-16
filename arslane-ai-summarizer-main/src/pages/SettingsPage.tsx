import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Lock, Globe, Palette, Save } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

const AVAILABLE_GENRES = [
  'Action', 'Aventure', 'Comédie', 'Drame', 'Fantaisie', 'Horreur',
  'Mystère', 'Romance', 'Sci-Fi', 'Tranche de vie', 'Sports', 'Surnaturel',
  'Psychologique', 'Thriller', 'Seinen', 'Shonen', 'Shojo', 'Josei',
];

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    is_public: true,
    favorite_genres: [] as string[],
  });

  // Initialiser le formulaire avec les données du profil
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        is_public: profile.is_public ?? true,
        favorite_genres: profile.favorite_genres || [],
      });
    }
  }, [profile]);

  // Rediriger si non connecté
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync(formData);
  };

  const toggleGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      favorite_genres: prev.favorite_genres.includes(genre)
        ? prev.favorite_genres.filter((g) => g !== genre)
        : [...prev.favorite_genres, genre],
    }));
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Gérez votre compte et vos préférences</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Palette className="h-4 w-4" />
              Préférences
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Lock className="h-4 w-4" />
              Confidentialité
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du profil</CardTitle>
                  <CardDescription>
                    Ces informations seront visibles sur votre profil public
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {profile?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Photo de profil</p>
                      <p className="text-sm text-muted-foreground">
                        Connectez-vous avec Google pour utiliser votre avatar
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Username */}
                  <div className="grid gap-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="votre_nom"
                    />
                    <p className="text-sm text-muted-foreground">
                      Votre identifiant unique (lettres, chiffres, underscores)
                    </p>
                  </div>

                  {/* Display name */}
                  <div className="grid gap-2">
                    <Label htmlFor="display_name">Nom affiché</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) =>
                        setFormData({ ...formData, display_name: e.target.value })
                      }
                      placeholder="Votre nom"
                    />
                    <p className="text-sm text-muted-foreground">
                      Le nom qui sera affiché sur votre profil
                    </p>
                  </div>

                  {/* Bio */}
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Parlez-nous de vous..."
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      Une courte description de vous (max 500 caractères)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Genres favoris</CardTitle>
                  <CardDescription>
                    Sélectionnez vos genres de manga préférés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_GENRES.map((genre) => (
                      <Badge
                        key={genre}
                        variant={
                          formData.favorite_genres.includes(genre)
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => toggleGenre(genre)}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Ces genres seront affichés sur votre profil
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Confidentialité</CardTitle>
                  <CardDescription>
                    Contrôlez qui peut voir vos informations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <Label>Profil public</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tout le monde peut voir votre profil, bibliothèque et activité
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_public}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_public: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Compte</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Email : {user?.email}
                    </p>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleSignOut}
                    >
                      Se déconnecter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </Tabs>
      </main>
    </div>
  );
}
