import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Favorite } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Volume2, Copy, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['/api/favorites'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/favorites');
      return await response.json() as Favorite[];
    },
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/favorites/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: 'Favorito eliminado',
        description: 'El favorito se ha eliminado correctamente.'
      });
    },
  });

  const handleCopyMessage = async (favorite: Favorite) => {
    const textToCopy = `--- MENSAJE EN ESPAÑOL ---

${favorite.spanishMessage}


--- MESSAGE IN ENGLISH ---

${favorite.englishMessage}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: 'Copiado',
        description: 'El mensaje se ha copiado al portapapeles.'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar el mensaje.',
        variant: 'destructive'
      });
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h1 className="favorites-title">Plantillas Favoritas</h1>
        <p className="favorites-description">
          Gestiona y reutiliza tus plantillas de mensajes MAYDAY RELAY guardadas
        </p>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner">Cargando favoritos...</div>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.length === 0 ? (
            <Card className="empty-state">
              <CardContent className="pt-6">
                <div className="empty-state-content">
                  <Heart className="empty-state-icon" />
                  <h3>Sin favoritos</h3>
                  <p>No tienes plantillas favoritas guardadas</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            favorites.map((favorite) => (
              <Card key={favorite.id} className="favorite-card">
                <CardHeader>
                  <div className="favorite-card-header">
                    <CardTitle className="favorite-title">{favorite.title}</CardTitle>
                    <div className="favorite-date">
                      <Calendar className="w-4 h-4" />
                      {new Date(favorite.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="favorite-content">
                    <div className="natural-input">
                      <h4>Descripción original:</h4>
                      <p>{favorite.naturalInput}</p>
                    </div>
                    
                    <div className="generated-messages">
                      <div className="message-section">
                        <h4>Español:</h4>
                        <div className="message-text">{favorite.spanishMessage}</div>
                      </div>
                      
                      <div className="message-section">
                        <h4>English:</h4>
                        <div className="message-text">{favorite.englishMessage}</div>
                      </div>
                    </div>
                    
                    <div className="favorite-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyMessage(favorite)}
                        data-testid={`button-copy-favorite-${favorite.id}`}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSpeak(favorite.spanishMessage)}
                        data-testid={`button-speak-favorite-${favorite.id}`}
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        Leer
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteFavoriteMutation.mutate(favorite.id)}
                        disabled={deleteFavoriteMutation.isPending}
                        data-testid={`button-delete-favorite-${favorite.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}