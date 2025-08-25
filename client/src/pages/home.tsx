import { useState } from 'react';
import { GeminiService, type GeneratedMessages } from '@/services/gemini';

export default function Home() {
  const [naturalInput, setNaturalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editableMessages, setEditableMessages] = useState<GeneratedMessages | null>(null);
  const [copyStatus, setCopyStatus] = useState('Copiar Ambos');

  const handleGenerate = async () => {
    if (!naturalInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setEditableMessages(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';
      if (!apiKey) {
        throw new Error('No se ha configurado la clave de API de Gemini. Por favor, configure VITE_GEMINI_API_KEY en las variables de entorno.');
      }

      const geminiService = new GeminiService(apiKey);
      const messages = await geminiService.generateMayдayMessages(naturalInput);
      setEditableMessages(messages);
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Ocurrió un error inesperado al generar el mensaje. Por favor, inténtelo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBoth = async () => {
    if (!editableMessages) return;
    
    const textToCopy = `--- MENSAJE EN ESPAÑOL ---\n\n${editableMessages.es}\n\n\n--- MESSAGE IN ENGLISH ---\n\n${editableMessages.en}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus('¡Copiado!');
      setTimeout(() => {
        setCopyStatus('Copiar Ambos');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopyStatus('Error al copiar');
      setTimeout(() => {
        setCopyStatus('Copiar Ambos');
      }, 2000);
    }
  };

  const handleMessageChange = (lang: 'es' | 'en', value: string) => {
    setEditableMessages(prev => prev ? { ...prev, [lang]: value } : null);
  };

  return (
    <div className="sosgen-container">
      <div className="sosgen-main">
        <header className="sosgen-header">
          <div className="sosgen-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" className="lifebuoy-icon">
              <defs>
                <filter id="drop_shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
                  <feOffset dx="1" dy="1" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.5"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#drop_shadow)">
                <circle cx="12" cy="12" r="10" fill="white"/>
                <path d="M12,2 A10,10 0 0,1 22,12" stroke="#F44336" strokeWidth="4" fill="none"/>
                <path d="M12,22 A10,10 0 0,1 2,12" stroke="#F44336" strokeWidth="4" fill="none"/>
                <path d="M12,2 A10,10 0 0,0 2,12" stroke="white" strokeWidth="4" fill="none"/>
                <path d="M12,22 A10,10 0 0,0 22,12" stroke="white" strokeWidth="4" fill="none"/>
                <circle cx="12" cy="12" r="6" fill="#f0f2f5"/>
                <circle cx="12" cy="12" r="6" stroke="#dee2e6" strokeWidth="0.5" fill="none"/>
                <g stroke="#A0A0A0" strokeWidth="1" fill="none">
                  <path d="M19,12 C 21,10 21,14 19,12"/>
                  <path d="M5,12 C 3,10 3,14 5,12"/>
                  <path d="M12,5 C 10,3 14,3 12,5"/>
                  <path d="M12,19 C 10,21 14,21 12,19"/>
                </g>
              </g>
            </svg>
            <h1 className="sosgen-title">SOSGEN</h1>
          </div>
          <p className="sosgen-description">
            Describa la situación de socorro en lenguaje natural y la IA generará el mensaje para su estación costera.
          </p>
        </header>
        
        <div className="sosgen-card">
          <div className="sosgen-input-group">
            <label htmlFor="naturalInput" className="sosgen-label">
              Información de Socorro
            </label>
            <textarea
              id="naturalInput"
              name="naturalInput"
              rows={8}
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              placeholder="Ej: Desde Coruña Radio, coordinado por MRCC Finisterre: Buque 'Aurora' (MMSI 224123456) con 5 POB tiene una vía de agua en 43°21'N 008°25'W."
              disabled={isLoading}
              className="sosgen-textarea"
              data-testid="input-natural-description"
            />
            <button 
              className="sosgen-button" 
              onClick={handleGenerate} 
              disabled={!naturalInput.trim() || isLoading}
              data-testid="button-generate-message"
            >
              {isLoading ? 'Generando...' : 'Generar Mensaje'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="sosgen-error" data-testid="error-message">
            {error}
          </div>
        )}

        {editableMessages && (
          <div className="sosgen-card">
            <div className="sosgen-message-box">
              <h2 className="sosgen-message-label">Mensaje en Español</h2>
              <textarea 
                className="sosgen-message-content" 
                value={editableMessages.es}
                onChange={(e) => handleMessageChange('es', e.target.value)}
                aria-label="Mensaje editable en Español"
                data-testid="textarea-spanish-message"
              />
              
              <hr className="sosgen-message-separator" />

              <h2 className="sosgen-message-label">Message in English</h2>
              <textarea 
                className="sosgen-message-content" 
                value={editableMessages.en}
                onChange={(e) => handleMessageChange('en', e.target.value)}
                aria-label="Editable message in English"
                data-testid="textarea-english-message"
              />
              <button 
                className="sosgen-copy-button" 
                onClick={handleCopyBoth}
                data-testid="button-copy-both"
              >
                {copyStatus}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
