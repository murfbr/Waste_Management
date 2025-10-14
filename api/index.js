import express from 'express';
import cors from 'cors';
import mtrRouter from './mtr/index.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/mtr', mtrRouter);

export default app;