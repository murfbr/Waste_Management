import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import nunjucks from 'nunjucks';
import path from 'path';
import fs from 'fs';
import admin from 'firebase-admin';

// Função auxiliar para logs, para facilitar a visualização
const logStep = (step, data = '') => {
  console.log(`[ETAPA ${step}] - ${new Date().toISOString()} - ${data}`);
};

export default async function handler(req, res) {
    logStep(1, 'Função iniciada.');

    if (req.method !== 'POST') {
        logStep('ERRO', 'Método não permitido.');
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        // --- ETAPA 2: Inicializar o Firebase ---
        logStep(2, 'A inicializar Firebase Admin...');
        if (!admin.apps.length) {
            const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }
        const db = admin.firestore();
        logStep(2, 'Firebase Admin inicializado com sucesso.');

        const { clienteId, ano } = req.body;
        if (!clienteId || !ano) {
            logStep('ERRO', 'clienteId ou ano em falta.');
            return res.status(400).json({ message: 'clienteId e ano são obrigatórios.' });
        }
        logStep(3, `Dados recebidos: clienteId=${clienteId}, ano=${ano}`);

        // --- ETAPA 4: Buscar dados do cliente ---
        logStep(4, `A buscar dados do cliente: ${clienteId}`);
        const clienteDoc = await db.collection('clientes').doc(clienteId).get();
        if (!clienteDoc.exists) {
            logStep('ERRO', `Cliente ${clienteId} não encontrado.`);
            return res.status(404).json({ message: `Cliente com ID ${clienteId} não encontrado.` });
        }
        const clienteData = clienteDoc.data();
        const nomeCliente = clienteData.nome || "Cliente sem nome";
        logStep(4, `Dados do cliente "${nomeCliente}" encontrados.`);

        // --- ETAPA 5: Buscar lançamentos ---
        logStep(5, `A buscar lançamentos para o ano de ${ano}...`);
        const startDate = new Date(`${ano}-01-01T00:00:00Z`).getTime();
        const endDate = new Date(`${parseInt(ano) + 1}-01-01T00:00:00Z`).getTime();
        
        const recordsSnapshot = await db.collectionGroup('wasteRecords')
            .where('clienteId', '==', clienteId)
            .where('timestamp', '>=', startDate)
            .where('timestamp', '<', endDate)
            .get();
        
        const records = recordsSnapshot.docs.map(doc => doc.data());
        logStep(5, `${records.length} lançamentos encontrados.`);

        if (records.length === 0) {
            return res.status(404).json({ message: `Nenhum lançamento encontrado para ${nomeCliente} em ${ano}.` });
        }
        
        // --- ETAPA 6: Processar dados ---
        logStep(6, 'A processar dados para os totais...');
        let pesoTotal = 0;
        records.forEach(rec => {
            pesoTotal += (rec.peso && typeof rec.peso === 'number') ? rec.peso : 0;
        });
        logStep(6, `Processamento concluído. Peso total: ${pesoTotal}`);

        // --- ETAPA 7: Gerar Gráficos ---
        // Desativado por agora para simplificar a depuração
        logStep(7, 'Geração de gráficos desativada para este teste.');
        
        const templateData = {
            cliente_nome: nomeCliente,
            periodo: `Relatório Anual de ${ano}`,
            data_geracao: new Date().toLocaleDateString('pt-BR'),
            peso_total: `${pesoTotal.toFixed(2)} kg`,
            total_lancamentos: records.length,
        };
        
        // --- ETAPA 8: Renderizar HTML ---
        logStep(8, 'A ler o ficheiro de modelo HTML...');
        const templatePath = path.join(process.cwd(), 'api', 'relatorio_modelo.html');
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        logStep(8, 'Modelo lido com sucesso. A renderizar com Nunjucks...');
        const finalHtml = nunjucks.renderString(templateContent, templateData);
        logStep(8, 'HTML renderizado com sucesso.');

        // --- ETAPA 9: Iniciar Puppeteer ---
        logStep(9, 'A iniciar o Puppeteer...');
        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        logStep(9, 'Puppeteer iniciado com sucesso.');

        // --- ETAPA 10: Gerar PDF ---
        logStep(10, 'A abrir nova página e a definir conteúdo...');
        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
        logStep(10, 'Conteúdo definido. A gerar o buffer do PDF...');
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        logStep(10, 'PDF gerado com sucesso. A fechar o navegador...');
        await browser.close();
        logStep(10, 'Navegador fechado.');

        // --- ETAPA FINAL: Enviar Resposta ---
        logStep(11, 'A enviar o PDF para o cliente.');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_${ano}_${nomeCliente.replace(/\s/g, '_')}.pdf`);
        res.status(200).send(pdfBuffer);

    } catch (error) {
        // Se a função falhar em qualquer ponto, este bloco será executado.
        console.error('ERRO DETALHADO NO CaTCH FINAL:', error);
        res.status(500).json({ message: 'Erro interno no servidor.', error: error.message, stack: error.stack });
    }
}