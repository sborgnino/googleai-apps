import { GoogleGenAI, Type } from "@google/genai";
import { WorkoutSession } from "../types";

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const processWorkoutAudio = async (audioBlob: Blob): Promise<Partial<WorkoutSession>> => {
  // Note: process.env.API_KEY is polyfilled in vite.config.ts
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Audio = await blobToBase64(audioBlob);
  const mimeType = audioBlob.type || 'audio/webm';

  // Define the expected output schema strictly
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: "The date of the workout in YYYY-MM-DD format. Defaults to today if not specified."
      },
      exercises: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Standardized name of the exercise in English (e.g., 'Bench Press'). Translate from Spanish/other languages if necessary." },
            sets: { type: Type.NUMBER, description: "Number of sets performed" },
            reps: { type: Type.NUMBER, description: "Number of repetitions per set" },
            weight: { type: Type.NUMBER, description: "Weight used in kg/lbs if mentioned" },
            duration_minutes: { type: Type.NUMBER, description: "Duration in minutes for cardio/timed exercises" }
          },
          required: ["name"]
        }
      },
      notes: { type: Type.STRING, description: "Any additional context regarding intensity, feelings, or specific details." },
      raw_transcription: { type: Type.STRING, description: "Verbatim transcription of the audio in the original spoken language (Spanish/English/etc)." }
    },
    required: ["exercises", "raw_transcription"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `
              You are a professional fitness coach and translator. 
              
              Your task is to extract structured workout data from the provided audio recording.
              
              **CRITICAL INSTRUCTIONS FOR SPANISH/MULTILINGUAL INPUT:**
              1. **Detect Language**: The audio may be in **Spanish**, English, or mixed.
              2. **Transcribe**: Write the **exact** words spoken in the 'raw_transcription' field. If the user speaks Spanish, the transcription MUST be in Spanish. Do NOT translate the transcription.
              3. **Translate & Normalize**: When populating the 'exercises' array, translate exercise names to **English** standard terminology.
                 - "Sentadillas" -> "Squats"
                 - "Press de banca" -> "Bench Press"
                 - "Dominadas" -> "Pull-ups"
                 - "Correr" -> "Running"
              4. **Extract Data**: Identify sets, reps, weight, and duration accurately.
              5. **Defaults**: If date is missing, use ${new Date().toISOString().split('T')[0]}.
              
              Example Input (Spanish): "Hoy hice cinco series de diez sentadillas con 60 kilos."
              Example Output JSON:
              {
                "date": "...",
                "exercises": [{ "name": "Squats", "sets": 5, "reps": 10, "weight": 60 }],
                "raw_transcription": "Hoy hice cinco series de diez sentadillas con 60 kilos."
              }
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a multilingual fitness assistant capable of understanding Spanish and English workout logs perfectly."
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response from AI");

    return JSON.parse(responseText) as Partial<WorkoutSession>;

  } catch (error) {
    console.error("Gemini Processing Error:", error);
    throw error;
  }
};