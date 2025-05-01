import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import axios from 'axios';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface ExecuteRequest {
  message: string;
}

interface Restaurant {
  name: string;
  address: string;
  cuisine: string;
  rating: number;
  priceLevel: string;
  operatingHours: string;
  latitude?: number;
  longitude?: number;
}

interface ExecuteResponse {
  restaurants: Restaurant[];
}

interface LLMCommand {
  action: string;
  parameters: {
    query?: string;
    near?: string;
    price?: string;
    open_now?: boolean;
    min_rating?: number;
    [key: string]: any;
  };
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts a natural language message to a structured JSON command using OpenAI
 */
async function convertMessageToCommand(message: string): Promise<LLMCommand> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500, // Limit token usage
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

    try {
      return JSON.parse(content) as LLMCommand;
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error) {
    console.error('Error converting message to command:', error);
    throw new Error('Failed to convert natural language to structured command');
  }
}

/**
 * Searches for restaurants using the Foursquare Places API based on the provided command
 */
async function searchRestaurants(command: LLMCommand): Promise<Restaurant[]> {
  try {
    const { parameters } = command;
    
    // Ensure the API key is properly formatted
    const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY || '';
    const FOURSQUARE_API_URL = 'https://api.foursquare.com/v3/places/search';
    
    // Build query parameters for Foursquare API
    const params: Record<string, any> = {
      query: parameters.query || 'restaurant',
      categories: '13000', // Category ID for "Restaurants"
      limit: 10,
    };

    // Add location parameter if provided
    if (parameters.near) {
      params.near = parameters.near;
    }

    // Add price level if provided (convert from string to array of integers)
    if (parameters.price) {
      const priceLevel = parseInt(parameters.price, 10);
      if (!isNaN(priceLevel) && priceLevel >= 1 && priceLevel <= 4) {
        params.price = priceLevel;
      }
    }

    // Add open now parameter if provided
    if (parameters.open_now !== undefined) {
      params.open_now = parameters.open_now;
    }

    console.log('Foursquare API request params:', params);
    
    const response = await axios.get(FOURSQUARE_API_URL, {
      params,
      headers: {
        'Accept': 'application/json',
        'Authorization': FOURSQUARE_API_KEY
      },
      timeout: 8000 // 8 second timeout to prevent Vercel's 10s serverless function timeout
    });

    console.log('Foursquare API response status:', response.status);
    console.log('Foursquare API response data:', JSON.stringify(response.data, null, 2));

    // Process and filter results
    let restaurants = [];
    try {
      if (!response.data.results || !Array.isArray(response.data.results)) {
        console.error('Unexpected Foursquare API response format:', response.data);
        return [];
      }
      
      restaurants = response.data.results.map((result: any) => {
        // Extract price level text
        let priceLevel = 'Unknown';
        if (result.price !== undefined) {
          const priceTiers = ['Inexpensive', 'Moderate', 'Expensive', 'Very Expensive'];
          priceLevel = priceTiers[result.price - 1] || 'Unknown';
        }

        // Format address
        const formattedAddress = result.location?.formatted_address || 'Address not available';
        
        // Format hours
        let operatingHours = 'Hours not available';
        if (result.hours?.display) {
          operatingHours = result.hours.display;
        }

        // Extract cuisine/category
        let cuisine = 'Not specified';
        if (result.categories && result.categories.length > 0) {
          cuisine = result.categories[0].name;
        }

        return {
          name: result.name || 'Unknown Restaurant',
          address: formattedAddress,
          cuisine: cuisine,
          rating: result.rating || 0,
          priceLevel: priceLevel,
          operatingHours: operatingHours,
          latitude: result.geocodes?.main?.latitude,
          longitude: result.geocodes?.main?.longitude
        };
      });
    } catch (mapError) {
      console.error('Error processing Foursquare results:', mapError);
      return [];
    }

    // Filter by minimum rating if specified
    if (parameters.min_rating !== undefined) {
      const minRating = parseFloat(parameters.min_rating.toString());
      if (!isNaN(minRating)) {
        restaurants = restaurants.filter((restaurant: Restaurant) => restaurant.rating >= minRating);
      }
    }

    return restaurants;
  } catch (error) {
    console.error('Error searching restaurants:', error);
    throw new Error('Failed to search restaurants');
  }
}

/**
 * Controller for handling the execute endpoint
 * Processes natural language queries, converts them to structured commands,
 * and fetches restaurant data from Foursquare
 */
async function executeQuery(req: express.Request, res: express.Response) {
  // Set a timeout for the entire request
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), 9500); // 9.5 seconds
  });

  try {
    const { message } = req.body as ExecuteRequest;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Race against the timeout
    const result = await Promise.race([
      (async () => {
        // Step 1: Convert natural language to structured command using OpenAI
        console.log('Converting message to command...');
        const command = await convertMessageToCommand(message);
        console.log('Command:', JSON.stringify(command, null, 2));

        // Step 2: Use the command to search for restaurants using Foursquare
        console.log('Searching restaurants...');
        const restaurants = await searchRestaurants(command);
        console.log(`Found ${restaurants.length} restaurants`);

        // Step 3: Return the results
        return {
          restaurants
        } as ExecuteResponse;
      })(),
      timeoutPromise
    ]);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    // Ensure we're returning a valid JSON object
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Routes
app.post('/api/execute', (req, res) => executeQuery(req, res));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Export the serverless handler
export default serverless(app);
