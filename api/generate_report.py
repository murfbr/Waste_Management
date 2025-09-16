import os
import json
import datetime
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore

# Inicializa o aplicativo Flask
app = Flask(__name__)

# --- INICIALIZAÇÃO DO FIREBASE COM COMENTÁRIOS DETALHADOS ---
# Pega o conteúdo da variável de ambiente que criamos na Vercel.
service_account_info_json = os.getenv('FIREBASE_SERVICE_ACCOUNT')
db = None # Define db como None inicialmente para podermos verificar a conexão

# Verifica se a variável de ambiente foi carregada corretamente.
if service_account_info_json:
    try:
        # Converte o texto JSON da variável de ambiente para um dicionário Python.
        service_account_info = json.loads(service_account_info_json)
        # Usa o dicionário para criar as credenciais.
        cred = credentials.Certificate(service_account_info)
        
        # Inicializa o app do Firebase, mas somente se ainda não foi inicializado.
        # Isso é importante para evitar erros em ambientes serverless.
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        
        # Pega uma referência para o banco de dados Firestore.
        db = firestore.client()
    except Exception as e:
        print(f"ERRO DE INICIALIZAÇÃO DO FIREBASE: {e}")
else:
    print("Variável de ambiente FIREBASE_SERVICE_ACCOUNT não encontrada.")
# --- FIM DA INICIALIZAÇÃO ---


# Define a rota principal da nossa API.
# A Vercel direcionará requisições para /api/generate_report para esta função.
# O "methods=['POST']" significa que esta rota só aceita requisições do tipo POST,
# que é o método que usaremos para enviar os filtros do front-end.
@app.route('/api/generate_report', methods=['POST'])
def handle_report_generation():
    if not db:
        return jsonify({"error": "A conexão com o banco de dados falhou."}), 500

    # Pega os dados (filtros) que o front-end enviou na requisição.
    filters = request.json
    cliente_ids = filters.get('selectedClienteIds', [])
    anos = filters.get('selectedYears', [])
    # No JS, os meses são 0-11. No Python datetime, são 1-12.
    # Adicionamos +1 para compatibilizar.
    meses = [m + 1 for m in filters.get('selectedMonths', [])]
    
    # --- INÍCIO DOS LOGS DE DEBUG ---
    print("--- INÍCIO DA EXECUÇÃO ---")
    print(f"Filtros Recebidos: Clientes={cliente_ids}, Anos={anos}, Meses={meses}")
    # --- FIM DOS LOGS DE DEBUG ---

    try:
        query = db.collection_group('wasteRecords').where('clienteId', 'in', cliente_ids)
        
        # Convertemos o resultado para uma lista para podermos inspecionar
        docs = list(query.stream())
        
        # --- LOG DE DEBUG 1 ---
        print(f"LOG 1: Firestore retornou {len(docs)} documentos para o(s) cliente(s) selecionado(s) (ANTES da filtragem de data).")

        filtered_records = []
        
        # --- LOG DE DEBUG 2 ---
        print("LOG 2: Verificando cada documento contra os filtros de data...")
        for doc in docs:
            record = doc.to_dict()
            timestamp = record.get('timestamp', 0)
            record_date = datetime.datetime.fromtimestamp(timestamp / 1000)
            
            # Mostrar a data de cada registro que está sendo verificado.
            print(f"  - Verificando registro com data: {record_date.strftime('%Y-%m-%d')}")
            
            if record_date.year in anos and record_date.month in meses:
                 filtered_records.append(record)
                 # --- LOG DE DEBUG 3 ---
                 print(f"    --> ACEITO! Este registro está no período desejado.")

        # --- LOG DE DEBUG 4 ---
        print(f"LOG 4: Total de registros APÓS a filtragem de data: {len(filtered_records)}")

        # --- PROCESSAMENTO (idêntico ao da versão de debug anterior) ---
        total_geral_kg = sum(rec.get('peso', 0) for rec in filtered_records)
        total_organico_kg = sum(rec.get('peso', 0) for rec in filtered_records if 'orgânico' in rec.get('wasteType', '').lower())
        total_reciclavel_kg = sum(rec.get('peso', 0) for rec in filtered_records if 'reciclável' in rec.get('wasteType', '').lower())
        total_rejeito_kg = sum(rec.get('peso', 0) for rec in filtered_records if 'rejeito' in rec.get('wasteType', '').lower())
        
        p_organico = (total_organico_kg / total_geral_kg * 100) if total_geral_kg > 0 else 0
        p_reciclavel = (total_reciclavel_kg / total_geral_kg * 100) if total_geral_kg > 0 else 0
        p_rejeito = (total_rejeito_kg / total_geral_kg * 100) if total_geral_kg > 0 else 0

        report_data = {
            "visao_geral": {
                "total_residuos": f"{total_geral_kg:.2f} Kg",
                "organico_kg": f"{total_organico_kg:.2f} Kg",
                "organico_percent": f"{p_organico:.2f}%",
                "reciclavel_kg": f"{total_reciclavel_kg:.2f} Kg",
                "reciclavel_percent": f"{p_reciclavel:.2f}%",
                "rejeito_kg": f"{total_rejeito_kg:.2f} Kg",
                "rejeito_percent": f"{p_rejeito:.2f}%"
            },
            "debug_info": { "records_found": len(filtered_records) }
        }
        
        print("--- FIM DA EXECUÇÃO ---")
        return jsonify(report_data)

    except Exception as e:
        print(f"ERRO DURANTE EXECUÇÃO: {e}")
        return jsonify({"error": "Ocorreu um erro ao processar os dados."}), 500