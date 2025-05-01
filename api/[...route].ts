import serverless from 'serverless-http';
import { app } from '../backend/src/index';

// Export the serverless handler
export default serverless(app);
