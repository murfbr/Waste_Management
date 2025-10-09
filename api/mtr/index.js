// Este é o conteúdo de api/mtr/index.js

import { Router } from 'express';
import spRoutes from './sp/sp.routes.js'; // Importa as rotas de SP

const router = Router();

// Quando uma requisição chegar em /api/mtr/sp, ela será direcionada
// para o arquivo de rotas de São Paulo.
router.use('/sp', spRoutes);

// Futuramente, poderíamos adicionar:
// import rjRoutes from './rj/rj.routes.js';
// router.use('/rj', rjRoutes);

export default router;