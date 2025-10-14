import app from './index.js';

// LOG DE DEPURAÇÃO (BACK-END - PONTO DE ENTRADA MÁXIMO)
// Este middleware será executado para TODA E QUALQUER requisição que chegar ao servidor.
app.use((req, res, next) => {
  console.log(`\n--- [INÍCIO DA REQUISIÇÃO] ---`);
  console.log(`[Servidor Local] Requisição recebida: ${req.method} ${req.originalUrl}`);
  console.log(`[Servidor Local] Headers:`, JSON.stringify(req.headers, null, 2));
  next(); // Continua para o próximo middleware ou rota
});


const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor da API rodando localmente em http://localhost:${PORT}`);
  console.log('Use "Ctrl + C" para parar o servidor.');
});