import os
import json
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore

# Inicializa o aplicativo Flask
app = Flask(__name__)

# --- INICIALIZAÇÃO DO FIREBASE ---
# Pega o conteúdo da variável de ambiente que criamos na Vercel.
service_account_info_json = os.getenv('FIREBASE_SERVICE_ACCOUNT')

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
        print("Firebase inicializado com sucesso.")
    except Exception as e:
        print(f"Erro ao inicializar o Firebase: {e}")
        db = None
else:
    print("Variável de ambiente FIREBASE_SERVICE_ACCOUNT não encontrada.")
    db = None
# --- FIM DA INICIALIZAÇÃO DO FIREBASE ---


# Define a rota principal da nossa API.
# A Vercel direcionará requisições para /api/generate_report para esta função.
# O "methods=['POST']" significa que esta rota só aceita requisições do tipo POST,
# que é o método que usaremos para enviar os filtros do front-end.
@app.route('/api/generate_report', methods=['POST'])
def handle_report_generation():
    # Verifica se a conexão com o Firestore foi bem-sucedida.
    if not db:
        return jsonify({"error": "A conexão com o banco de dados falhou."}), 500

    # Pega os dados (filtros) que o front-end enviou na requisição.
    # Por enquanto, vamos apenas recebê-los e devolvê-los para teste.
    filters = request.json

    print(f"Filtros recebidos: {filters}")

    # --- LÓGICA DE BUSCA E PROCESSAMENTO (será implementada a seguir) ---
    # Aqui é onde vamos buscar os dados do Firestore usando os 'filters'
    # e processá-los para gerar o relatório.

    # Resposta de teste para confirmar que a API está funcionando.
    return jsonify({
        "message": "API está funcionando! Filtros recebidos com sucesso.",
        "received_filters": filters
    })

# Esta linha é usada para testes locais, não afeta a Vercel.
if __name__ == "__main__":
    app.run(debug=True)