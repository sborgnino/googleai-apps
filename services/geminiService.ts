import { GoogleGenAI, Type } from "@google/genai";
import { Exercise, WorkoutSession } from "../types";

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
            name: { type: Type.STRING, description: "Standardized name of the exercise in English (e.g., 'Bench Press'). Translate if necessary." },
            sets: { type: Type.NUMBER, description: "Number of sets performed" },
            reps: { type: Type.NUMBER, description: "Number of repetitions per set" },
            weight: { type: Type.NUMBER, description: "Weight used in kg/lbs if mentioned" },
            duration_minutes: { type: Type.NUMBER, description: "Duration in minutes for cardio/timed exercises" }
          },
          required: ["name"]
        }
      },
      notes: { type: Type.STRING, description: "Any additional context regarding intensity, feelings, or specific details." },
      raw_transcription: { type: Type.STRING, description: "Verbatim transcription of the audio in the spoken language (e.g., Spanish)." }
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
              Analyze the audio recording of a workout session.
              
              Steps:
              1. Transcribe the spoken audio exactly as it is heard in the 'raw_transcription' field. Support English, Spanish, and other common languages.
              2. Extract the exercises, sets, reps, weights, and durations into the 'exercises' array.
              3. Normalize exercise names to English. For example, if the user says "Sentadillas", map it to "Squats". If "Press de Banca", map to "Bench Press".
              4. If the date is not mentioned, use ${new Date().toISOString().split('T')[0]}.
              
              Be accurate with numbers. Handle casual speech like "couple of sets of 10" (implies 2 sets).
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are an expert fitness coach and linguist capable of understanding workout logs in multiple languages, especially Spanish and English."
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