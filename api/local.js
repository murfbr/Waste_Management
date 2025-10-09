// api/local.js

// Este arquivo serve APENAS para o desenvolvimento local.
// Ele importa o nosso servidor principal (preparado para a Vercel)
// e o inicia em uma porta específica para podermos testar na nossa máquina.

import app from './index.js';

const PORT = 3001; // Porta do nosso back-end local

app.listen(PORT, () => {
  console.log(`🚀 Servidor da API rodando localmente em http://localhost:${PORT}`);
  console.log('Use "Ctrl + C" para parar o servidor.');
});
