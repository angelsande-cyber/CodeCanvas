import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';

const App = () => {
  const [naturalInput, setNaturalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editableMessages, setEditableMessages] = useState<{es: string, en: string} | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('Copiar Ambos');

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  const handleGenerate = async () => {
    if (!naturalInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setEditableMessages(null);

    const schema = {
        type: Type.OBJECT,
        properties: {
            stationName: { type: Type.STRING, description: "El nombre completo de la estación de radio costera si se especifica (ej. 'Vigo Radio', 'Finisterre'). Es opcional." },
            mrcc: { type: Type.STRING, description: "El nombre del centro de Salvamento Marítimo o MRCC si se especifica (ej. 'Finisterre', 'Madrid'). Es opcional." },
            spanishDescription: { type: Type.STRING, description: "Una descripción concisa y natural del suceso en español, integrando todos los detalles disponibles (buque, MMSI, POB, posición, peligro, etc.)." },
            englishDescription: { type: Type.STRING, description: "A concise and natural language description of the incident in English, integrating all available details (vessel, MMSI, POB, position, distress, etc.)." }
        },
        required: ["spanishDescription", "englishDescription"]
    };
    
    const prompt = `
Eres un experto operador de radio costera. Tu única tarea es analizar la siguiente descripción de un suceso de socorro y extraer datos para una plantilla fija. Tu respuesta debe ser factual y basarse estrictamente en la información proporcionada.

**Reglas Estrictas:**
1.  **Identifica y Extrae Datos Clave:** Analiza el texto del usuario para encontrar:
    -   El sujeto del socorro (ej. buque, persona, windsurfista).
    -   Nombre del buque.
    -   MMSI.
    -   Indicativo de llamada (Call Sign).
    -   Número de personas a bordo (POB).
    -   Posición (GPS o descriptiva).
    -   Naturaleza del peligro (ej. vía de agua, incendio, en apuros).
2.  **Crea una Descripción Factual y Natural:** Basándote en la información extraída, redacta una descripción concisa y natural del suceso, tanto en español como en inglés. **No listes los datos**, intégralos fluidamente en una o dos frases. La descripción debe ser una reformulación directa de los hechos.
    -   **Ejemplo de integración (Español):** Si el usuario provee "Buque 'Aurora' MMSI 224123456 con 5 POB tiene una vía de agua en 43 21N 008 25W", una buena descripción sería: "Buque 'Aurora' con MMSI 224123456 y 5 personas a bordo, reporta una vía de agua en la posición 43°21'N 008°25'W."
    -   **Ejemplo de integración (Inglés):** "Vessel 'Aurora', MMSI 224123456 with 5 persons on board, reports taking on water in position 43°21'N 008°25'W."
    -   Si faltan datos, crea la mejor descripción posible con la información disponible (ej. "windsurfista en apuros cerca de la Torre de Hércules.").
3.  **Extrae el Nombre de la Estación (Opcional):** Si el usuario especifica el nombre de la estación de radio (ej. "Desde Coruña Radio", "Aquí Finisterre Radio"), extrae el nombre completo tal como se proporciona (ej. "Coruña Radio", "Finisterre"). Si no se menciona, omite este campo.
4.  **Extrae el Nombre del MRCC (Opcional):** Si el usuario menciona el centro de Salvamento Marítimo o MRCC que lleva el caso (ej. "caso coordinado por MRCC Finisterre", "informar a Salvamento Finisterre"), extrae solo el nombre del centro (ej. "Finisterre"). Si no se menciona, omite este campo.
5.  **REGLA CRÍTICA: NO INVENTES INFORMACIÓN.** Solo usa los datos explícitamente proporcionados. No añadas detalles, no hagas suposiciones. Tu salida debe ser una representación fiel y directa de la entrada.

**Texto del usuario:** "${naturalInput}"

Devuelve tu respuesta exclusivamente en formato JSON, siguiendo el esquema proporcionado.
    `;


    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2,
            }
        });

        const resultText = response.text.trim();
        let extractedData;
        try {
            extractedData = JSON.parse(resultText);
        } catch (jsonError) {
            console.error("Failed to parse JSON response from AI:", resultText);
            throw new Error("La respuesta de la IA no tiene un formato válido. Inténtelo de nuevo.");
        }

        const missingFields: string[] = [];
        if (!extractedData.spanishDescription) {
            missingFields.push("descripción en español");
        }
        if (!extractedData.englishDescription) {
            missingFields.push("descripción en inglés");
        }

        if (missingFields.length > 0) {
            throw new Error(`Falta información. La IA no pudo extraer: ${missingFields.join(', ')}. Por favor, sea más específico en su descripción.`);
        }
        
        const spanishDescription = extractedData.spanishDescription;
        const englishDescription = extractedData.englishDescription;
        const rawStationName = extractedData.stationName?.trim();
        const rawMrccName = extractedData.mrcc?.trim();
        
        let fullStationName = '____________________';
        if (rawStationName) {
            if (rawStationName.toLowerCase().includes('radio')) {
                fullStationName = rawStationName;
            } else {
                fullStationName = `${rawStationName} Radio`;
            }
        }

        const utcTime = '____________________';
        const mrcc = rawMrccName || '____________________';
        const infoNumber = '1';

        const finalSpanishMessage = `MAYDAY RELAY (x3)
AQUI ${fullStationName} (x3)
MAYDAY
INFORMACION Nº ${infoNumber} A ${utcTime} UTC.

${spanishDescription}

SE REQUIERE A TODOS LOS BARCOS EN LA ZONA, EXTREMAR LA VIGILANCIA, ASISTIR SI ES NECESARIO, E INFORMAR A SALVAMENTO MARITIMO ${mrcc} O ESTACION RADIO COSTERA MAS PROXIMA.
AQUI ${fullStationName} A ${utcTime} UTC.`;

        const finalEnglishMessage = `MAYDAY RELAY (x3)
THIS IS ${fullStationName} (x3)
MAYDAY
INFORMATION Nº ${infoNumber} AT ${utcTime} UTC.

${englishDescription}

ALL VESSELS IN THE AREA, ARE REQUESTED TO KEEP A SHARP LOOK OUT, ASSIST IF NECESSARY AND MAKE FURTHER REPORTS TO MRCC ${mrcc} OR NEAREST COASTAL RADIO STATION.
THIS IS ${fullStationName} AT ${utcTime} UTC.`;

        setEditableMessages({ 
            es: finalSpanishMessage,
            en: finalEnglishMessage
        });

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

  const handleCopyBoth = () => {
    if (!editableMessages) return;
    const textToCopy = `--- MENSAJE EN ESPAÑOL ---\n\n${editableMessages.es}\n\n\n--- MESSAGE IN ENGLISH ---\n\n${editableMessages.en}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyStatus('¡Copiado!');
        setTimeout(() => {
            setCopyStatus('Copiar Ambos');
        }, 2000);
    });
  };

  const handleMessageChange = (lang: 'es' | 'en', value: string) => {
    setEditableMessages(prev => prev ? { ...prev, [lang]: value } : null);
  };

  return (
    <main>
      <header>
        <div className="title-container">
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
            <h1>SOSGEN</h1>
        </div>
        <p>Describa la situación de socorro en lenguaje natural y la IA generará el mensaje para su estación costera.</p>
      </header>
      
      <div className="form-container">
        <div className="input-group">
            <label htmlFor="naturalInput">Información de Socorro</label>
            <textarea
                id="naturalInput"
                name="naturalInput"
                rows={8}
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                placeholder="Ej: Desde Coruña Radio, coordinado por MRCC Finisterre: Buque 'Aurora' (MMSI 224123456) con 5 POB tiene una vía de agua en 43°21'N 008°25'W."
                disabled={isLoading}
            />
        </div>
        <button className="generate-button" onClick={handleGenerate} disabled={!naturalInput.trim() || isLoading}>
            {isLoading ? 'Generando...' : 'Generar Mensaje'}
        </button>
      </div>
      
      {error && <div className="error-box">{error}</div>}

      {editableMessages && (
        <div className="output-container">
          <div className="message-box">
              <h2 className="message-label">Mensaje en Español</h2>
              <textarea 
                className="message-content" 
                value={editableMessages.es}
                onChange={(e) => handleMessageChange('es', e.target.value)}
                aria-label="Mensaje editable en Español"
                />
              
              <hr className="message-separator" />

              <h2 className="message-label">Message in English</h2>
              <textarea 
                className="message-content" 
                value={editableMessages.en}
                onChange={(e) => handleMessageChange('en', e.target.value)}
                aria-label="Editable message in English"
                />
              <button className="copy-button" onClick={handleCopyBoth}>{copyStatus}</button>
          </div>
        </div>
      )}
    </main>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);