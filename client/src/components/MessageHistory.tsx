import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { MessageHistory, Favorite } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Search, Volume2, Copy, Calendar, History as HistoryIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MessageHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/history', debouncedQuery],
    queryFn: async () => {
      const url = debouncedQuery 
        ? `/api/history?q=${encodeURIComponent(debouncedQuery)}`
        : '/api/history';
      const response = await apiRequest('GET', url);
      return await response.json() as MessageHistory[];
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/history/${id}/favorite`);
      return await response.json() as MessageHistory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      toast({
        title: 'Favorito actualizado',
        description: 'El estado del favorito se ha actualizado correctamente.'
      });
    },
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: async (message: MessageHistory) => {
      const favoriteData = {
        title: `Mensaje del ${new Date(message.createdAt).toLocaleDateString()}`,
        naturalInput: message.naturalInput,
        spanishMessage: message.spanishMessage,
        englishMessage: message.englishMessage,
      };
      const response = await apiRequest('POST', '/api/favorites', favoriteData);
      return await response.json() as Favorite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: 'Guardado en favoritos',
        description: 'El mensaje se ha guardado como favorito.'
      });
    },
  });

  const handleCopyMessage = async (message: MessageHistory) => {
    const textToCopy = `--- MENSAJE EN ESPAÑOL ---

${message.spanishMessage}


--- MESSAGE IN ENGLISH ---

${message.englishMessage}`;
    
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
    <div className="message-history-container">
      <div className="message-history-header">
        <h1 className="message-history-title">Historial de Mensajes</h1>
        <p className="message-history-description">
          Revisa y gestiona todos los mensajes MAYDAY RELAY generados
        </p>
      </div>

      <Card className="search-card">
        <CardContent className="pt-6">
          <div className="search-container">
            <Search className="search-icon" />
            <Input
              placeholder="Buscar en el historial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              data-testid="input-search-history"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner">Cargando historial...</div>
        </div>
      ) : (
        <div className="messages-grid">
          {messages.length === 0 ? (
            <Card className="empty-state">
              <CardContent className="pt-6">
                <div className="empty-state-content">
                  <HistoryIcon className="empty-state-icon" />
                  <h3>Sin mensajes</h3>
                  <p>No se encontraron mensajes en el historial</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <Card key={message.id} className="message-card">
                <CardHeader>
                  <div className="message-card-header">
                    <CardTitle className="message-date">
                      <Calendar className="w-4 h-4" />
                      {new Date(message.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardTitle>
                    {message.isFavorite && (
                      <Badge variant="secondary" className="favorite-badge">
                        <Heart className="w-3 h-3 fill-current" />
                        Favorito
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="message-content">
                    <div className="natural-input">
                      <h4>Descripción original:</h4>
                      <p>{message.naturalInput}</p>
                    </div>
                    
                    <div className="generated-messages">
                      <div className="message-section">
                        <h4>Español:</h4>
                        <div className="message-text">{message.spanishMessage}</div>
                      </div>
                      
                      <div className="message-section">
                        <h4>English:</h4>
                        <div className="message-text">{message.englishMessage}</div>
                      </div>
                    </div>
                    
                    <div className="message-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyMessage(message)}
                        data-testid={`button-copy-${message.id}`}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSpeak(message.spanishMessage)}
                        data-testid={`button-speak-${message.id}`}
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        Leer
                      </Button>
                      
                      <Button
                        variant={message.isFavorite ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleFavoriteMutation.mutate(message.id)}
                        disabled={toggleFavoriteMutation.isPending}
                        data-testid={`button-favorite-${message.id}`}
                      >
                        <Heart className={`w-4 h-4 mr-2 ${message.isFavorite ? 'fill-current' : ''}`} />
                        {message.isFavorite ? 'Quitar' : 'Favorito'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToFavoritesMutation.mutate(message)}
                        disabled={addToFavoritesMutation.isPending}
                        data-testid={`button-save-favorite-${message.id}`}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Guardar plantilla
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