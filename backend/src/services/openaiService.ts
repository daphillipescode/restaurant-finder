import OpenAI from 'openai';
import { LLMCommand } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts a natural language message to a structured JSON command using OpenAI
 */
export async function convertMessageToCommand(message: string): Promise<LLMCommand> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that converts natural language restaurant search queries into structured JSON.
          
          The output should ONLY be valid JSON with no additional text, following this exact format:
          {
            "action": "restaurant_search",
            "parameters": {
              "query": "food type or restaurant name",
              "near": "location",
              "price": "price level (1-4, where 1 is cheapest)",
              "open_now": true/false,
              "min_rating": minimum rating (1-5)
            }
          }
          
          Only include parameters that are explicitly mentioned or can be reasonably inferred from the user's query.
          The "query" parameter should contain the type of food or restaurant name.
          The "near" parameter should contain the location.
          The "price" parameter should be a string representing the price level (1-4).
          The "open_now" parameter should be a boolean.
          The "min_rating" parameter should be a number between 1 and 5.
          
          Return ONLY the JSON with no additional text or explanation.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    return JSON.parse(content) as LLMCommand;
  } catch (error) {
    console.error('Error converting message to command:', error);
    throw new Error('Failed to convert natural language to structured command');
  }
}
