import { GoogleGenAI, Type, Modality } from "@google/genai";

// Inicialização segura do cliente Gemini para evitar crashes no arranque se a API Key faltar
const getAIClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("API Key do Gemini não configurada. Por favor, adicione a variável GEMINI_API_KEY no seu ficheiro .env");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper to strip the Data URI prefix to get raw base64
 */
const cleanBase64 = (dataUri: string): string => {
  return dataUri.split(',')[1] || dataUri;
};

/**
 * Analyzes an image and suggests funny meme captions using Gemini 3 Pro Preview.
 */
export const generateMagicCaptions = async (imageBase64: string): Promise<string[]> => {
  try {
    const ai = getAIClient();
    const cleanData = cleanBase64(imageBase64);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG/JPEG, the API is flexible
              data: cleanData
            }
          },
          {
            text: "Analyze this image and generate 5 funny, viral, short meme captions that would fit well on this image. The captions should be punchy. Return ONLY a JSON array of strings."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const captions = JSON.parse(jsonText);
    return Array.isArray(captions) ? captions : [];
  } catch (error) {
    console.error("Error generating captions:", error);
    throw error;
  }
};

/**
 * Edits an image based on a text prompt using Gemini 2.5 Flash Image (Nano Banana).
 */
export const editMemeImage = async (imageBase64: string, prompt: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const cleanData = cleanBase64(imageBase64);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanData
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE]
      }
    });

    // Extract the generated image from the response
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    
    throw new Error("No image data returned from Gemini.");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Generates an AI pre-diagnosis response based on a problem description.
 */
export const getAIPrediagnosis = async (description: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Tu és um Assistente de Suporte Técnico Inteligente da InfoConnect (um sistema de gestão de suporte informático). O teu objetivo é fornecer um pré-diagnóstico amigável, técnico e útil para um cliente que descreveu o seguinte problema no seu equipamento:
"${description}"
Fornece:
1. Uma breve explicação do que poderá estar a causar o problema.
2. Uma lista de 3 a 4 verificações simples e seguras que o utilizador pode fazer em casa (ex: cabos, reiniciar, etc.).
3. Uma recomendação clara sobre se deve ou não abrir um ticket de reparação na InfoConnect.
Escreve em português de Portugal (pt-PT).`
    });
    return response.text || "De momento não foi possível processar o diagnóstico. Por favor tente mais tarde.";
  } catch (error) {
    console.error("Error generating pre-diagnosis:", error);
    throw error;
  }
};
