import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# O endereço da nossa fábrica no Google Cloud Run que acabamos de publicar.
FACTORY_URL = "https://report-service-5675939765.us-east1.run.app/create-report-job"

@app.route('/api/generate_report', methods=['POST'])
def handle_report_generation():
    """
    Esta função agora atua como um proxy. Ela recebe a requisição do front-end
    e a repassa de forma segura para o nosso serviço de geração de relatórios.
    """
    # 1. Pega os filtros do corpo da requisição original (enviada pelo seu app React)
    filters = request.json
    
    if not filters:
        return jsonify({"error": "Corpo da requisição está vazio."}), 400

    try:
        print(f"Encaminhando pedido para a fábrica: {FACTORY_URL}")
        
        # 2. Faz uma nova requisição POST para a URL da nossa fábrica,
        # repassando exatamente os mesmos filtros.
        # O timeout de 300 segundos (5 minutos) garante que a fábrica tenha tempo de processar.
        response = requests.post(FACTORY_URL, json=filters, timeout=300)
        
        # 3. Força a verificação de erro na resposta da fábrica.
        # Se a fábrica retornou um erro (ex: status 500), isso vai gerar uma exceção.
        response.raise_for_status()
        
        # 4. Se tudo deu certo na fábrica, ela nos devolve um JSON com o 'downloadUrl'.
        # Nós simplesmente repassamos essa resposta de volta para o front-end.
        factory_data = response.json()
        print(f"Fábrica respondeu com sucesso: {factory_data}")
        
        return jsonify(factory_data), 200

    except requests.exceptions.HTTPError as http_err:
        # Se a fábrica retornou um erro HTTP (4xx ou 5xx)
        print(f"Erro HTTP da fábrica: {http_err.response.status_code} - {http_err.response.text}")
        return jsonify({
            "error": "O serviço de geração de relatórios retornou um erro.",
            "details": http_err.response.text
        }), http_err.response.status_code
        
    except requests.exceptions.RequestException as req_err:
        # Se houve um erro de conexão com a fábrica (ex: timeout)
        print(f"Erro de conexão com a fábrica: {req_err}")
        return jsonify({"error": "Não foi possível conectar ao serviço de geração de relatórios."}), 502 # Bad Gateway
        
    except Exception as e:
        print(f"Erro inesperado no proxy: {e}")
        return jsonify({"error": "Um erro inesperado ocorreu."}), 500