// api/index.js
import express from 'express';
import cors from 'cors';
import mtrRouter from './mtr/index.js';

const app = express();

// Middlewares essenciais
app.use(cors());
app.use(express.json());

// Rota principal da API de MTR
// A Vercel irá reescrever /api/(.*) para este arquivo,
// e o express irá rotear a partir daqui.
app.use('/api/mtr', mtrRouter);

// A Vercel irá gerenciar o servidor, então apenas exportamos o app.
// A linha app.listen() é removida para a compatibilidade com a Vercel.
export default app;

