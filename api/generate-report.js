import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import nunjucks from 'nunjucks';
import path from 'path';
import admin from 'firebase-admin';

// --- CONFIGURAÇÃO DO FIREBASE ADMIN ---
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error.message);
  }
}
const db = admin.firestore();

// --- CONFIGURAÇÃO DO NUNJUCKS ---
const templateDir = path.resolve(process.cwd(), 'pages/api'); // ou 'src/pages/api' se for o caso
nunjucks.configure(templateDir, { autoescape: true });


// --- FUNÇÃO PRINCIPAL DO RELATÓRIO ---
export default async function handler(req, res) {
    // =======================================================
    // VALIDAÇÃO DA ETAPA 2: VERIFICAR SE OS DADOS CHEGARAM
    // =======================================================
    console.log("===================================");
    console.log("API /api/generate-report foi chamada!");
    console.log("Método da Requisição:", req.method);
    console.log("Dados recebidos do frontend:", req.body);
    console.log("===================================");
    // =======================================================

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const { clienteId, ano, nomeCliente } = req.body;
        if (!clienteId || !ano) {
            return res.status(400).json({ message: 'clienteId e ano são obrigatórios.' });
        }
        
        // Por enquanto, vamos devolver uma resposta simples para confirmar
        // que recebemos os dados, em vez de gerar o PDF completo.
        
        // NOTA: A lógica de buscar no banco, gerar gráficos e o PDF está temporariamente
        // desativada abaixo. Vamos reativá-la na próxima etapa.

        /*
        // [LÓGICA DO PDF DESATIVADA TEMPORARIAMENTE]
        const templateData = {
            cliente_nome: nomeCliente || "Cliente Teste",
            periodo: `Ano de ${ano}`,
            vendas_total: '1234 kg',
            grafico_categorias: null, // Sem gráfico por enquanto
        };
        const finalHtml = nunjucks.render('relatorio_vendas.html', templateData);
        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio_teste.pdf');
        res.status(200).send(pdfBuffer);
        */
        
        // RESPOSTA TEMPORÁRIA PARA TESTE
        res.status(200).json({ 
            message: "API recebeu os dados com sucesso!",
            dados_recebidos: req.body 
        });


    } catch (error) {
        console.error('ERRO GERAL NA FUNÇÃO:', error);
        res.status(500).json({ message: 'Erro interno no servidor.', error: error.message });
    }
}