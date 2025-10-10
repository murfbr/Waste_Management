import { Router } from 'express';
import {
  handleAuthentication,
  handleGetList,
  handleCreateMtr,
  handleSyncAllLists
} from './sp.controller.js';

const router = Router();

router.post('/auth', handleAuthentication);
router.get('/lists/:listName', handleGetList); // GET para buscar
router.post('/mtr', handleCreateMtr);
router.post('/sync', handleSyncAllLists);

export default router;