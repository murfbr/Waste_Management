// api/mtr/sp/sp.routes.js
import { Router } from 'express';
// CORREÇÃO: Importando as funções explicitamente para maior clareza.
import {
  handleAuthentication,
  handleGetList,
  handleCreateMtr
} from './sp.controller.js';

const router = Router();

// Rota de autenticação
router.post('/auth', handleAuthentication);

// Rota para buscar listas
router.get('/lists/:listName', handleGetList);

// Rota para criar um novo MTR
router.post('/mtr', handleCreateMtr);

export default router;
