import os
import json
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage

# Importa a nossa classe de geração de relatórios do arquivo vizinho
from report_generator import ReportGenerator

# --- INICIALIZAÇÃO DO SERVIÇO ---
app = Flask(__name__)
CORS(app) # Habilita o CORS

# Carrega as credenciais de forma explícita da variável de ambiente
credentials_json_str = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
if not credentials_json_str:
    raise RuntimeError("A variável de ambiente GOOGLE_APPLICATION_CREDENTIALS_JSON não está definida.")

credentials_info = json.loads(credentials_json_str)
cred = credentials.Certificate(credentials_info)

firebase_admin.initialize_app(cred)
storage_client = storage.Client(credentials=cred)
db = firestore.client()

BUCKET_NAME = os.getenv('GCS_BUCKET_NAME')

@app.route('/create-report-job', methods=['POST'])
def create_report_job():
    if not BUCKET_NAME:
        return jsonify({"status": "error", "message": "Bucket não configurado."}), 500

    filters = request.json
    cliente_ids = filters.get('selectedClienteIds', [])
    anos = filters.get('selectedYears', [])
    meses_js = filters.get('selectedMonths', [])
    meses_py = [m + 1 for m in meses_js]

    try:
        # --- LÓGICA COMPLETA DE GERAÇÃO DE RELATÓRIO ---
        cliente_docs = db.collection('clientes').where('__name__', 'in', cliente_ids).stream()
        primeiro_cliente_data = next(iter({doc.id: doc.to_dict() for doc in cliente_docs}.values()), {})
        cliente_nome = primeiro_cliente_data.get('nome', 'Cliente')

        query = db.collection_group('wasteRecords').where('clienteId', 'in', cliente_ids)
        docs = list(query.stream())
        
        filtered_records = [
            doc.to_dict() for doc in docs 
            if datetime.datetime.fromtimestamp(doc.to_dict()['timestamp'] / 1000).year in anos and 
               datetime.datetime.fromtimestamp(doc.to_dict()['timestamp'] / 1000).month in meses_py
        ]
        
        total_geral_kg = sum(rec.get('peso', 0) for rec in filtered_records)
        total_organico_kg = sum(rec.get('peso', 0) for rec in filtered_records if 'orgânico' in rec.get('wasteType', '').lower())
        total_reciclavel_kg = sum(rec.get('peso', 0) for rec in filtered_records if 'reciclável' in rec.get('wasteType', '').lower())
        total_rejeito_kg = sum(rec.get('peso', 0) for rec in filtered_records if 'rejeito' in rec.get('wasteType', '').lower())
        
        dados_para_template = {
            'cliente_nome': cliente_nome, 'empresa_nome': 'CtrlWaste', 'periodo': f"{meses_js[0]+1}/{anos[0]}",
            'resumo_executivo': f"Relatório de geração de resíduos para {cliente_nome} no período selecionado.",
            'indicadores_principais': [
                {'nome': 'Total de Resíduos', 'valor': f'{total_geral_kg:.2f} Kg', 'variacao': f'{len(filtered_records)} registros'},
                {'nome': 'Orgânico', 'valor': f'{(total_organico_kg/total_geral_kg*100):.2f}%' if total_geral_kg > 0 else '0.00%', 'variacao': f'{total_organico_kg:.2f} Kg'},
                {'nome': 'Reciclável', 'valor': f'{(total_reciclavel_kg/total_geral_kg*100):.2f}%' if total_geral_kg > 0 else '0.00%', 'variacao': f'{total_reciclavel_kg:.2f} Kg'},
                {'nome': 'Rejeito', 'valor': f'{(total_rejeito_kg/total_geral_kg*100):.2f}%' if total_geral_kg > 0 else '0.00%', 'variacao': f'{total_rejeito_kg:.2f} Kg'}
            ],
            'receita_total': f"{total_geral_kg:.2f} Kg", 'crescimento_geral': " ", 'margem_lucro': " ", 'satisfacao_cliente': " ",
            'grafico_principal': None, 'destaques': [], 'dados_tabela': None, 'analise': '', 'recomendacoes': [], 'proximos_passos': []
        }

        generator = ReportGenerator()
        nome_arquivo_pdf = f"relatorio_{cliente_nome.replace(' ', '_')}_{datetime.date.today()}.pdf"
        caminho_pdf_local = generator.create_report(
            template_name='relatorio_executivo.html', data=dados_para_template, output_filename=nome_arquivo_pdf
        )
        
        bucket = storage_client.bucket(BUCKET_NAME)
        nome_arquivo_nuvem = f"reports/{nome_arquivo_pdf}"
        blob = bucket.blob(nome_arquivo_nuvem)
        blob.upload_from_filename(caminho_pdf_local, content_type='application/pdf')
        
        download_url = blob.generate_signed_url(version="v4", expiration=datetime.timedelta(hours=1), method="GET")
        
        return jsonify({ "status": "success", "downloadUrl": download_url }), 200

    except Exception as e:
        print(f"ERRO CRÍTICO DURANTE A GERAÇÃO DO RELATÓRIO: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/', methods=['GET'])
def health_check():
    return "Report service is healthy and running.", 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)), debug=True)