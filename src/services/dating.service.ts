
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, SchemaType } from '@google/genai';

export interface Profile {
  id: string;
  name: string;
  age: number;
  job: string;
  bio: string;
  interests: string[];
  imageUrl: string;
  isAiGeneratedImage?: boolean;
}

export interface ChatMessage {
  sender: 'user' | 'match';
  text: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatingService {
  private ai: GoogleGenAI;
  private modelId = 'gemini-2.5-flash';
  private imageModelId = 'imagen-4.0-generate-001';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  // Generate a batch of text-based profiles quickly (using placeholder images)
  async generateInitialProfiles(count: number): Promise<Profile[]> {
    const prompt = `Generate ${count} distinct dating profiles. 
    Each profile should have: name, age (18-35), job, a short witty bio (max 150 chars), and 3 interests.
    Return JSON only.`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          age: { type: Type.INTEGER },
          job: { type: Type.STRING },
          bio: { type: Type.STRING },
          interests: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "age", "job", "bio", "interests"]
      }
    };

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      const data = JSON.parse(response.text || '[]');
      
      return data.map((p: any, index: number) => ({
        id: crypto.randomUUID(),
        ...p,
        // Use Picsum for instant loading of initial batch
        imageUrl: `https://picsum.photos/seed/${p.name.replace(' ', '') + index}/400/600`,
        isAiGeneratedImage: false
      }));

    } catch (e) {
      console.error('Error generating profiles', e);
      return [];
    }
  }

  // Generate a specific "Dream Match" with Imagen
  async createDreamMatch(description: string): Promise<Profile | null> {
    try {
      // 1. Generate Image
      const imageResponse = await this.ai.models.generateImages({
        model: this.imageModelId,
        prompt: `Portrait of a person matching this description: ${description}. High quality, photorealistic, dating profile photo style, smiling, warm lighting.`,
        config: {
          numberOfImages: 1,
          aspectRatio: '3:4',
          outputMimeType: 'image/jpeg'
        }
      });

      const base64Image = imageResponse.generatedImages?.[0]?.image?.imageBytes;
      if (!base64Image) throw new Error('No image generated');
      
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      // 2. Generate Persona details
      const schema = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          age: { type: Type.INTEGER },
          job: { type: Type.STRING },
          bio: { type: Type.STRING },
          interests: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      };

      const textResponse = await this.ai.models.generateContent({
        model: this.modelId,
        contents: `Create a dating profile persona based on this description: "${description}". Return JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      const details = JSON.parse(textResponse.text || '{}');

      return {
        id: crypto.randomUUID(),
        ...details,
        imageUrl: imageUrl,
        isAiGeneratedImage: true
      };

    } catch (e) {
      console.error('Error creating dream match', e);
      return null;
    }
  }

  async generateChatResponse(match: Profile, history: ChatMessage[], userMessage: string): Promise<string> {
    const historyText = history.map(h => `${h.sender === 'user' ? 'User' : match.name}: ${h.text}`).join('\n');
    
    const prompt = `
    You are roleplaying as ${match.name} on a dating app.
    Your details: Age ${match.age}, Job: ${match.job}.
    Bio: ${match.bio}.
    Interests: ${match.interests.join(', ')}.
    
    Current conversation history:
    ${historyText}
    
    User just said: "${userMessage}"
    
    Reply as ${match.name}. Keep it casual, flirty if appropriate, and short (under 2 sentences). 
    Do not break character. Do not include "User:" or "${match.name}:" in your output. Just the message.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: prompt
      });
      return response.text || '...';
    } catch (e) {
      console.error('Chat error', e);
      return "Sorry, I got distracted! What was that?";
    }
  }
}
