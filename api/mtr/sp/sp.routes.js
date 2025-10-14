// api/mtr/sp/sp.routes.js

import { Router } from 'express';
import {
  handleAuthentication,
  handleGetList,
  handleCreateMtr,
  handleSyncAllLists,
  handleGetDestinadores // <-- Adicionado aqui na importação
} from './sp.controller.js';

const router = Router();

router.post('/auth', handleAuthentication);
router.get('/lists/:listName', handleGetList); // GET para buscar
router.post('/mtr', handleCreateMtr);
router.post('/sync', handleSyncAllLists);

// --- NOVA ROTA ADICIONADA ---
// Rota para o front-end buscar a lista de todos os destinadores.
router.get('/data/destinadores', handleGetDestinadores);

export default router;