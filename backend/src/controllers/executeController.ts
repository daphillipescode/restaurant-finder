import { Request, Response } from 'express';
import { convertMessageToCommand } from '../services/openaiService';
import { searchRestaurants } from '../services/foursquareService';
import { ExecuteRequest, ExecuteResponse } from '../types';

/**
 * Controller for handling the execute endpoint
 * Processes natural language queries, converts them to structured commands,
 * and fetches restaurant data from Foursquare
 */
export async function executeQuery(req: Request, res: Response) {
  try {
    const { message } = req.body as ExecuteRequest;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Step 1: Convert natural language to structured command using OpenAI
    console.log('Converting message to command...');
    const command = await convertMessageToCommand(message);
    console.log('Command:', JSON.stringify(command, null, 2));

    // Step 2: Use the command to search for restaurants using Foursquare
    console.log('Searching restaurants...');
    const restaurants = await searchRestaurants(command);
    console.log(`Found ${restaurants.length} restaurants`);

    // Step 3: Return the results
    const response: ExecuteResponse = {
      restaurants
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error executing query:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
