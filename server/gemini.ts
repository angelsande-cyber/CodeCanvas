import { GoogleGenAI, Type } from '@google/genai';

export interface ExtractedData {
  stationName?: string;
  mrcc?: string;
  spanishDescription: string;
  englishDescription: string;
}

export interface GeneratedMessages {
  es: string;
  en: string;
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateMayдayMessages(naturalInput: string): Promise<GeneratedMessages> {
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
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2,
        }
      });

      const resultText = response.text?.trim() || '';
      let extractedData: ExtractedData;
      
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

      return { 
        es: finalSpanishMessage,
        en: finalEnglishMessage
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Ocurrió un error inesperado al generar el mensaje. Por favor, inténtelo de nuevo.");
      }
    }
  }
}