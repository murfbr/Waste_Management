import os
import json
import datetime
from flask import Flask, request, jsonify, send_file
import firebase_admin
from firebase_admin import credentials, firestore

# Adiciona o diretório 'src' ao path para que possamos importar o ReportGenerator
import sys
# O '..' foi removido, pois 'src' agora é uma subpasta de 'api'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))
from report_generator import ReportGenerator

# --- INICIALIZAÇÃO (sem alterações) ---
app = Flask(__name__)
service_account_info_json = os.getenv('FIREBASE_SERVICE_ACCOUNT')
db = None
if service_account_info_json:
    try:
        service_account_info = json.loads(service_account_info_json)
        cred = credentials.Certificate(service_account_info)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db = firestore.client()
    except Exception as e:
        print(f"ERRO DE INICIALIZAÇÃO DO FIREBASE: {e}")

@app.route('/api/generate_report', methods=['POST'])
def handle_report_generation():
    if not db:
        return "A conexão com o banco de dados falhou.", 500

    filters = request.json
    cliente_ids = filters.get('selectedClienteIds', [])
    anos = filters.get('selectedYears', [])
    meses_js = filters.get('selectedMonths', [])
    meses_py = [m + 1 for m in meses_js]

    try:
        # --- PASSO 1: BUSCAR DADOS DOS CLIENTES ---
        cliente_docs = db.collection('clientes').where('__name__', 'in', cliente_ids).stream()
        clientes_data = {doc.id: doc.to_dict() for doc in cliente_docs}
        primeiro_cliente_data = next(iter(clientes_data.values()), {})
        cliente_nome = primeiro_cliente_data.get('nome', 'Cliente')

        # --- PASSO 2: BUSCAR DADOS DE RESÍDUOS ---
        query = db.collection_group('wasteRecords').where('clienteId', 'in', cliente_ids)
        docs = list(query.stream())
        
        filtered_records = []
        for doc in docs:
            record = doc.to_dict()
            record_date = datetime.datetime.fromtimestamp(record['timestamp'] / 1000)
            if record_date.year in anos and record_date.month in meses_py:
                 filtered_records.append(record)

        # --- PASSO 3: PROCESSAR DADOS ---
        total_geral_kg = sum(rec.get('peso', 0) for rec in filtered_records)
        total_organico_kg = sum(rec.get('peso', 0) for rec in filtered_records if 'orgânico' in rec.get('wasteType', '').lower())
        total_reciclavel_kg = sum(rec.get('peso', 0) for rec in filtered_records if 'reciclável' in rec.get('wasteType', '').lower())
        total_rejeito_kg = sum(rec.get('peso', 0) for rec in filtered_records if 'rejeito' in rec.get('wasteType', '').lower())
        
        # --- PASSO 4: ESTRUTURAR DADOS PARA O TEMPLATE ---
        dados_para_template = {
            'cliente_nome': cliente_nome,
            'empresa_nome': 'CtrlWaste',
            'periodo': f"{meses_js[0]+1}/{anos[0]} a {meses_js[-1]+1}/{anos[-1]}",
            'resumo_executivo': f"Este relatório apresenta a visão consolidada da geração de resíduos para {cliente_nome} durante o período selecionado, detalhando a composição e os totais gerados.",
            'receita_total': f"{total_geral_kg:.2f} Kg",
            'crescimento_geral': f"{((total_organico_kg+total_reciclavel_kg)/total_geral_kg*100):.2f}%" if total_geral_kg > 0 else "0.00%",
            'margem_lucro': f"{(total_reciclavel_kg/total_geral_kg*100):.2f}%" if total_geral_kg > 0 else "0.00%",
            'satisfacao_cliente': f"{(total_rejeito_kg/total_geral_kg*100):.2f}%" if total_geral_kg > 0 else "0.00%",
            'indicadores_principais': [
                {'nome': 'Total de Resíduos', 'valor': f'{total_geral_kg:.2f} Kg', 'variacao': ''},
                {'nome': '% Orgânico', 'valor': f'{(total_organico_kg/total_geral_kg*100):.2f}%' if total_geral_kg > 0 else '0.00%', 'variacao': f'{total_organico_kg:.2f} Kg'},
                {'nome': '% Reciclável', 'valor': f'{(total_reciclavel_kg/total_geral_kg*100):.2f}%' if total_geral_kg > 0 else '0.00%', 'variacao': f'{total_reciclavel_kg:.2f} Kg'},
                {'nome': '% Rejeito', 'valor': f'{(total_rejeito_kg/total_geral_kg*100):.2f}%' if total_geral_kg > 0 else '0.00%', 'variacao': f'{total_rejeito_kg:.2f} Kg'}
            ],
            'grafico_principal': None, 'destaques': [], 'dados_tabela': None, 'analise': '', 'recomendacoes': [], 'proximos_passos': []
        }

        # --- PASSO 5: GERAR E RETORNAR O PDF ---
        generator = ReportGenerator(templates_dir="templates", output_dir="output")
        nome_arquivo = f"relatorio_{cliente_nome.replace(' ', '_')}_{datetime.date.today()}.pdf"
        
        caminho_pdf = generator.create_report(
            template_name='relatorio_executivo.html',
            data=dados_para_template,
            output_filename=nome_arquivo
        )
        
        return send_file(caminho_pdf, mimetype='application/pdf', as_attachment=True, download_name=nome_arquivo)

    except Exception as e:
        print(f"ERRO DURANTE EXECUÇÃO: {e}")
        return f"Ocorreu um erro ao gerar o relatório: {e}", 500