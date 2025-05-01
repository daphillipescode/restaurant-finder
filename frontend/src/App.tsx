import { useState } from 'react';
import './App.css';

// Define types for our application
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

function App() {
  const [message, setMessage] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch restaurants');
      }

      const data = await response.json();
      setRestaurants(data.restaurants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render stars for ratings
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div className="stars">
        {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`}>★</span>)}
        {halfStar && <span>½</span>}
        {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`}>☆</span>)}
        <span className="rating-number">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header>
        <h1>Restaurant Finder</h1>
        <p className="subtitle">Powered by AI</p>
      </header>

      <main>
        <section className="search-section">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Find me a cheap sushi restaurant in downtown Los Angeles that's open now and has at least a 4-star rating."
                aria-label="Search query"
                rows={3}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </form>
        </section>

        <section className="results-section">
          {loading ? (
            <div className="loading">Searching for restaurants...</div>
          ) : restaurants.length > 0 ? (
            <div className="results-container">
              <h2>Search Results</h2>
              <div className="restaurant-list">
                {restaurants.map((restaurant, index) => (
                  <div key={index} className="restaurant-card">
                    <h3>{restaurant.name}</h3>
                    <div className="restaurant-details">
                      <p><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                      <div><strong>Rating:</strong> {renderStars(restaurant.rating)}</div>
                      <p><strong>Price:</strong> {restaurant.priceLevel}</p>
                      <p><strong>Address:</strong> {restaurant.address}</p>
                      <p><strong>Hours:</strong> {restaurant.operatingHours}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !loading && message.trim() !== '' ? (
            <div className="results-container">
              <h2>No Restaurants Found</h2>
              <p className="no-results">No restaurants matching your criteria were found. Please try a different search.</p>
            </div>
          ) : null}
        </section>
      </main>

      <footer>
        <p>Restaurant data provided by Foursquare Places API</p>
      </footer>
    </div>
  );
}

export default App;
