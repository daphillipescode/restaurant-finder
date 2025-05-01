# LLM-Driven Restaurant Finder

A full-stack application that uses natural language processing to search for restaurants based on user queries. The application converts natural language into structured commands using OpenAI, then uses those commands to search for restaurants via the Foursquare Places API.

## Features

- Natural language input for restaurant searches
- AI-powered conversion of queries to structured commands
- Integration with Foursquare Places API for restaurant data
- Display of restaurant details including name, address, cuisine, rating, price level, and operating hours

## Tech Stack

- **Frontend**: React with TypeScript, Vite
- **Backend**: Node.js with TypeScript, Express
- **APIs**: OpenAI API, Foursquare Places API

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API keys for OpenAI and Foursquare Places API

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd restaurant-finder
```

### 2. Set up environment variables

Create a `.env` file in the `backend` directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
FOURSQUARE_API_KEY=your_foursquare_api_key
PORT=3000
```

### 3. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Build and run the application

#### Backend

```bash
cd backend
npm run dev
```

The backend server will run on http://localhost:3000.

#### Frontend

```bash
cd frontend
npm run dev
```

The frontend development server will run on http://localhost:5173.

## Usage

1. Open your browser and navigate to http://localhost:5173
2. Enter a natural language query in the search box, such as:
   - "Find me a sushi restaurant in New York"
   - "I want to eat Italian food in San Francisco with moderate pricing"
   - "Show me the best Mexican restaurants in Chicago that are open late"
3. Click the "Search" button to see the results

## API Endpoints

- `POST /api/execute` - Execute a natural language query
  - Request body: `{ "message": "your natural language query" }`
  - Response: `{ "restaurants": [...] }`

## Deployment

### Deploying to Vercel

This project is configured to be deployed as a monorepo on Vercel, with both the frontend and backend in a single deployment.

#### Prerequisites for Deployment

- A Vercel account
- Git repository (GitHub, GitLab, or Bitbucket)

#### Steps to Deploy

1. Push your code to a Git repository

2. Set up environment variables in Vercel:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `FOURSQUARE_API_KEY` - Your Foursquare API key

3. Import your repository in the Vercel dashboard:
   - Go to https://vercel.com/new
   - Select your Git provider and repository
   - Vercel will automatically detect the monorepo structure
   - Click "Deploy"

#### How It Works

The project includes the following files for Vercel deployment:

- `vercel.json` - Configuration for the monorepo setup
- `api/[...route].ts` - Serverless function that wraps the Express app

The deployment works as follows:

1. The frontend is built as a static site using Vite
2. The backend Express app is converted to a serverless function
3. API requests to `/api/*` are routed to the serverless function
4. All other requests are served from the static frontend build

#### Testing Your Deployment

After deployment, you can test your application by:

1. Visiting your Vercel deployment URL
2. Entering a natural language query in the search box
3. Verifying that the API responds with restaurant results

## Implementation Details

### Backend

The backend uses Express.js with TypeScript to create a RESTful API. The main endpoint is `/api/execute`, which takes a natural language message and processes it in the following steps:

1. The message is sent to OpenAI's API to convert it into a structured JSON command.
2. The structured command is used to query the Foursquare Places API for restaurant data.
3. The restaurant data is processed and returned to the frontend.

### Frontend

The frontend is built with React and TypeScript using Vite as the build tool. It consists of a simple UI with a search input, submit button, and results area. The results are displayed as cards with restaurant information.
