// Request and response types
export interface ExecuteRequest {
  message: string;
}

export interface Restaurant {
  name: string;
  address: string;
  cuisine: string;
  rating: number;
  priceLevel: string;
  operatingHours: string;
  latitude?: number;
  longitude?: number;
}

export interface ExecuteResponse {
  restaurants: Restaurant[];
}

// LLM types
export interface LLMCommand {
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
