import { GoogleGenAI, Type, Modality } from "@google/genai";

// Initialize Gemini AI Client
// Note: API Key is assumed to be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
