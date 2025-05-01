import axios from 'axios';
import { LLMCommand, Restaurant } from '../types';
import dotenv from 'dotenv';

dotenv.config();

// Ensure the API key is properly formatted
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY || '';
const FOURSQUARE_API_URL = 'https://api.foursquare.com/v3/places/search';

/**
 * Searches for restaurants using the Foursquare Places API based on the provided command
 */
export async function searchRestaurants(command: LLMCommand): Promise<Restaurant[]> {
  try {
    const { parameters } = command;
    
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
      }
    });

    console.log('Foursquare API response status:', response.status);
    console.log('Foursquare API response data:', JSON.stringify(response.data, null, 2));

    // Process and filter results
    let restaurants = response.data.results.map((result: any) => {
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
        name: result.name,
        address: formattedAddress,
        cuisine: cuisine,
        rating: result.rating || 0,
        priceLevel: priceLevel,
        operatingHours: operatingHours,
        latitude: result.geocodes?.main?.latitude,
        longitude: result.geocodes?.main?.longitude
      };
    });

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
