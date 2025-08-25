import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { GeneratedMessagesResponse } from '@shared/schema';

type GeneratedMessages = GeneratedMessagesResponse;

export default function Home() {
  const [naturalInput, setNaturalInput] = useState('');
  const [editableMessages, setEditableMessages] = useState<GeneratedMessages | null>(null);
  const [copyStatus, setCopyStatus] = useState('Copiar Ambos');
  const spanishTextareaRef = useRef<HTMLTextAreaElement>(null);
  const englishTextareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  useEffect(() => {
    if (editableMessages) {
      setTimeout(() => {
        if (spanishTextareaRef.current) autoResize(spanishTextareaRef.current);
        if (englishTextareaRef.current) autoResize(englishTextareaRef.current);
      }, 100);
    }
  }, [editableMessages]);

  const generateMessageMutation = useMutation({
    mutationFn: async (naturalInput: string) => {
      const response = await apiRequest('POST', '/api/generate-message', { naturalInput });
      return await response.json() as GeneratedMessages;
    },
    onSuccess: (data) => {
      setEditableMessages(data);
    },
    onError: (error: any) => {
      console.error('Error generating message:', error);
    },
  });

  const handleGenerate = async () => {
    if (!naturalInput.trim()) return;
    generateMessageMutation.mutate(naturalInput);
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

  const handleMessageChange = (lang: 'es' | 'en', value: string, textarea?: HTMLTextAreaElement) => {
    setEditableMessages(prev => prev ? { ...prev, [lang]: value } : null);
    if (textarea) {
      setTimeout(() => autoResize(textarea), 0);
    }
  };

  return (
    <div className="sosgen-container">
      <div className="sosgen-main">
        <header className="sosgen-header">
          <div className="sosgen-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 100 100" className="lifebuoy-icon">
              <defs>
                <filter id="clean-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#425563" floodOpacity="0.2"/>
                </filter>
              </defs>
              
              {/* Outer ring - main structure */}
              <circle cx="50" cy="50" r="44" fill="#009ca6" stroke="#425563" strokeWidth="2" filter="url(#clean-shadow)"/>
              
              {/* Inner center hole */}
              <circle cx="50" cy="50" r="20" fill="#ffffff" stroke="#425563" strokeWidth="2"/>
              
              {/* Safety sections - alternating colors */}
              <g fill="#64a70b">
                <path d="M 50,6 A 44,44 0 0,1 81.11,18.89 L 64.14,35.86 A 20,20 0 0,0 50,30 Z"/>
                <path d="M 81.11,81.11 A 44,44 0 0,1 50,94 L 50,70 A 20,20 0 0,0 64.14,64.14 Z"/>
              </g>
              
              <g fill="#ffffff">
                <path d="M 18.89,81.11 A 44,44 0 0,1 6,50 L 30,50 A 20,20 0 0,0 35.86,64.14 Z"/>
                <path d="M 18.89,18.89 A 44,44 0 0,1 50,6 L 50,30 A 20,20 0 0,0 35.86,35.86 Z"/>
              </g>
              
              {/* Section dividers */}
              <g stroke="#425563" strokeWidth="2" fill="none">
                <line x1="50" y1="6" x2="50" y2="30"/>
                <line x1="94" y1="50" x2="70" y2="50"/>
                <line x1="50" y1="94" x2="50" y2="70"/>
                <line x1="6" y1="50" x2="30" y2="50"/>
              </g>
              
              {/* Center reinforcement ring */}
              <circle cx="50" cy="50" r="20" fill="none" stroke="#425563" strokeWidth="2"/>
            </svg>
            <h1 className="sosgen-title">SOSGEN</h1>
          </div>
          <p className="sosgen-description">
            Convierte descripciones de emergencias marítimas en mensajes MAYDAY RELAY estandarizados para comunicaciones radio costeras oficiales.
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
              disabled={generateMessageMutation.isPending}
              className="sosgen-textarea"
              data-testid="input-natural-description"
            />
            <button 
              className="sosgen-button" 
              onClick={handleGenerate} 
              disabled={!naturalInput.trim() || generateMessageMutation.isPending}
              data-testid="button-generate-message"
            >
              {generateMessageMutation.isPending ? 'Generando...' : 'Generar Mensaje'}
            </button>
          </div>
        </div>
        
        {generateMessageMutation.error && (
          <div className="sosgen-error" data-testid="error-message">
            {generateMessageMutation.error instanceof Error 
              ? generateMessageMutation.error.message 
              : 'Ocurrió un error inesperado al generar el mensaje. Por favor, inténtelo de nuevo.'
            }
          </div>
        )}

        {editableMessages && (
          <div className="sosgen-card">
            <div className="sosgen-message-box">
              <h2 className="sosgen-message-label">Mensaje en Español</h2>
              <textarea 
                ref={spanishTextareaRef}
                className="sosgen-message-content" 
                value={editableMessages.es}
                onChange={(e) => handleMessageChange('es', e.target.value, e.target)}
                aria-label="Mensaje editable en Español"
                data-testid="textarea-spanish-message"
              />
              
              <hr className="sosgen-message-separator" />

              <h2 className="sosgen-message-label">Message in English</h2>
              <textarea 
                ref={englishTextareaRef}
                className="sosgen-message-content" 
                value={editableMessages.en}
                onChange={(e) => handleMessageChange('en', e.target.value, e.target)}
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
