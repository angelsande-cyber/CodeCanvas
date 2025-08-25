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
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B35"/>
                  <stop offset="50%" stopColor="#F7931E"/>
                  <stop offset="100%" stopColor="#FFD23F"/>
                </linearGradient>
                <linearGradient id="center-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff"/>
                  <stop offset="100%" stopColor="#f8f9fa"/>
                </linearGradient>
                <filter id="professional-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>
              
              {/* Outer ring with gradient */}
              <circle cx="50" cy="50" r="45" fill="url(#ring-gradient)" filter="url(#professional-shadow)"/>
              
              {/* Inner center circle */}
              <circle cx="50" cy="50" r="22" fill="url(#center-gradient)"/>
              
              {/* Safety stripes - alternating pattern */}
              <g fill="#ffffff">
                <path d="M 50,5 A 45,45 0 0,1 81.82,18.18 L 66.87,33.13 A 22,22 0 0,0 50,28 Z"/>
                <path d="M 81.82,81.82 A 45,45 0 0,1 50,95 L 50,72 A 22,22 0 0,0 66.87,66.87 Z"/>
                <path d="M 18.18,81.82 A 45,45 0 0,1 5,50 L 28,50 A 22,22 0 0,0 33.13,66.87 Z"/>
                <path d="M 18.18,18.18 A 45,45 0 0,1 50,5 L 50,28 A 22,22 0 0,0 33.13,33.13 Z"/>
              </g>
              
              {/* Rope details */}
              <g stroke="#e9ecef" strokeWidth="1" fill="none">
                <circle cx="50" cy="50" r="34" strokeDasharray="3,2"/>
                <circle cx="50" cy="50" r="37" strokeDasharray="2,1"/>
              </g>
              
              {/* Center hole highlight */}
              <circle cx="50" cy="50" r="22" fill="none" stroke="#dee2e6" strokeWidth="1"/>
              <circle cx="50" cy="50" r="20" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.7"/>
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
