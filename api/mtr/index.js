import { Router } from 'express';
import spRoutes from './sp/sp.routes.js';

const router = Router();

router.use('/sp', spRoutes);

export default router;