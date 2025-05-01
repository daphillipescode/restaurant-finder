import express, { Router, Request, Response } from 'express';
import { executeQuery } from '../controllers/executeController';

const router: Router = express.Router();

// POST /api/execute - Execute a natural language query
router.post('/execute', (req: Request, res: Response) => executeQuery(req, res));

export default router;
