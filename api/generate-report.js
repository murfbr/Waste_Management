import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import nunjucks from 'nunjucks';
import path from 'path';
import fs from 'fs'; // Importamos o módulo 'fs' para ler ficheiros
import admin from 'firebase-admin';

// --- CONFIGURAÇÃO DO FIREBASE ADMIN ---
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error.message);
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}
const db = admin.firestore();

// --- FUNÇÃO AUXILIAR PARA GERAR GRÁFICOS ---
async function generateChartAsBase64(chartConfig) {
    const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&backgroundColor=white&width=500&height=300`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Falha ao gerar o gráfico.');
    const imageBuffer = await response.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
}

// --- FUNÇÃO PRINCIPAL DO RELATÓRIO ---
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido.' });

    try {
        const { clienteId, ano } = req.body;
        if (!clienteId || !ano) return res.status(400).json({ message: 'clienteId e ano são obrigatórios.' });

        const clienteDoc = await db.collection('clientes').doc(clienteId).get();
        if (!clienteDoc.exists) return res.status(404).json({ message: `Cliente com ID ${clienteId} não encontrado.` });
        const clienteData = clienteDoc.data();
        const nomeCliente = clienteData.nome || "Cliente sem nome";

        const recordsSnapshot = await db.collectionGroup('wasteRecords')
            .where('clienteId', '==', clienteId)
            .where('timestamp', '>=', new Date(`${ano}-01-01T00:00:00Z`).getTime())
            .where('timestamp', '<', new Date(`${parseInt(ano) + 1}-01-01T00:00:00Z`).getTime())
            .get();
        
        const records = recordsSnapshot.docs.map(doc => doc.data());
        if (records.length === 0) return res.status(404).json({ message: `Nenhum lançamento encontrado para ${nomeCliente} em ${ano}.` });
        
        let pesoTotal = 0;
        const totalPorTipo = {};
        const totalPorArea = {};
        records.forEach(rec => {
            const peso = rec.peso && typeof rec.peso === 'number' ? rec.peso : 0;
            pesoTotal += peso;
            if (rec.wasteType) totalPorTipo[rec.wasteType] = (totalPorTipo[rec.wasteType] || 0) + peso;
            if (rec.areaLancamento) totalPorArea[rec.areaLancamento] = (totalPorArea[rec.areaLancamento] || 0) + peso;
        });

        const graficoTipoConfig = { type: 'pie', data: { labels: Object.keys(totalPorTipo), datasets: [{ data: Object.values(totalPorTipo) }] }, options: { title: { display: true, text: 'Distribuição por Tipo de Resíduo' } } };
        const graficoTipoBase64 = await generateChartAsBase64(graficoTipoConfig);
        const graficoAreaConfig = { type: 'bar', data: { labels: Object.keys(totalPorArea), datasets: [{ label: 'Peso (kg)', data: Object.values(totalPorArea) }] }, options: { title: { display: true, text: 'Geração por Área de Lançamento' } } };
        const graficoAreaBase64 = await generateChartAsBase64(graficoAreaConfig);
        
        const templateData = {
            cliente_nome: nomeCliente,
            periodo: `Relatório Anual de ${ano}`,
            data_geracao: new Date().toLocaleDateString('pt-BR'),
            peso_total: `${pesoTotal.toFixed(2)} kg`,
            total_lancamentos: records.length,
            grafico_distribuicao_tipo: graficoTipoBase64,
            grafico_distribuicao_area: graficoAreaBase64,
        };
        
        // =======================================================
        // ALTERAÇÃO CRÍTICA: LER O FICHEIRO MANUALMENTE
        // =======================================================
        // Construímos o caminho para o ficheiro de forma segura
        const templatePath = path.join(process.cwd(), 'api', 'relatorio_modelo.html');
        // Lemos o conteúdo do ficheiro
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        // Renderizamos o conteúdo em vez de pedir ao Nunjucks para encontrar o ficheiro
        const finalHtml = nunjucks.renderString(templateContent, templateData);
        // =======================================================
        
        const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: chromium.headless });
        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_${ano}_${nomeCliente.replace(/\s/g, '_')}.pdf`);
        res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error('ERRO GERAL NA FUNÇÃO:', error);
        res.status(500).json({ message: 'Erro interno no servidor.', error: error.message });
    }
}