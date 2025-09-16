import os
import json
import datetime
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore

# --- INICIALIZAÇÃO DO FLASK E FIREBASE (como antes) ---
app = Flask(__name__)
service_account_info_json = os.getenv('FIREBASE_SERVICE_ACCOUNT')

if service_account_info_json:
    try:
        service_account_info = json.loads(service_account_info_json)
        cred = credentials.Certificate(service_account_info)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase inicializado com sucesso.")
    except Exception as e:
        print(f"Erro ao inicializar o Firebase: {e}")
        db = None
else:
    print("Variável de ambiente FIREBASE_SERVICE_ACCOUNT não encontrada.")
    db = None
# --- FIM DA INICIALIZAÇÃO ---

@app.route('/api/generate_report', methods=['POST'])
def handle_report_generation():
    if not db:
        return jsonify({"error": "A conexão com o banco de dados falhou."}), 500

    # 1. RECEBER E VALIDAR OS FILTROS
    try:
        filters = request.json
        # Agora vamos aceitar múltiplos clientes
        cliente_ids = filters.get('selectedClienteIds', [])
        anos = filters.get('selectedYears', [])
        # No JS, os meses são 0-11. No Python datetime, são 1-12.
        # Adicionamos +1 para compatibilizar.
        meses = [m + 1 for m in filters.get('selectedMonths', [])]
        
        if not cliente_ids or not anos or not meses:
            return jsonify({"error": "Filtros insuficientes (clientes, anos, meses)."}), 400
            
    except (TypeError, KeyError) as e:
        return jsonify({"error": f"Filtro inválido ou ausente: {e}"}), 400

    print(f"Iniciando busca para Clientes: {cliente_ids}, Anos: {anos}, Meses: {meses}")

    try:
        # 2. BUSCAR DADOS DO FIRESTORE
        records_ref = db.collection('waste_records')
        
        # O Firestore só permite o filtro 'in' em um único campo por query.
        # Então filtramos por cliente primeiro.
        query = records_ref.where('clienteId', 'in', cliente_ids)
        
        docs = query.stream()
        
        # Filtramos o resto (ano e mês) em Python, pois é mais flexível
        filtered_records = []
        for doc in docs:
            record = doc.to_dict()
            # O timestamp no seu exemplo é em milissegundos.
            record_date = datetime.datetime.fromtimestamp(record['timestamp'] / 1000)
            
            if record_date.year in anos and record_date.month in meses:
                 filtered_records.append(record)

        print(f"Encontrados {len(filtered_records)} registros correspondentes aos filtros.")

        # 3. PROCESSAR OS DADOS (Lógica do Dashboard)
        # Replicando a lógica dos 'Summary Cards'
        total_geral_kg = 0
        total_organico_kg = 0
        total_reciclavel_kg = 0
        total_rejeito_kg = 0

        for record in filtered_records:
            peso = record.get('peso', 0)
            waste_type = record.get('wasteType', '').lower()
            
            total_geral_kg += peso
            if 'orgânico' in waste_type:
                total_organico_kg += peso
            elif 'reciclável' in waste_type:
                total_reciclavel_kg += peso
            elif 'rejeito' in waste_type:
                total_rejeito_kg += peso
        
        # Calcula as porcentagens
        p_organico = (total_organico_kg / total_geral_kg * 100) if total_geral_kg > 0 else 0
        p_reciclavel = (total_reciclavel_kg / total_geral_kg * 100) if total_geral_kg > 0 else 0
        p_rejeito = (total_rejeito_kg / total_geral_kg * 100) if total_geral_kg > 0 else 0

        # Monta a estrutura de dados para o relatório
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
            "debug_info": {
                 "records_found": len(filtered_records)
            }
        }
        
        # Por enquanto, vamos retornar esses dados processados como JSON
        # para confirmar que a lógica está correta.
        return jsonify(report_data)

    except Exception as e:
        print(f"Erro durante a busca ou processamento no Firestore: {e}")
        return jsonify({"error": "Ocorreu um erro ao processar os dados do relatório."}), 500