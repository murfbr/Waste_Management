import os
import datetime
from flask import Flask, jsonify
from google.cloud import storage

app = Flask(__name__)

# Inicialização ultra-simplificada
storage_client = storage.Client()
BUCKET_NAME = os.getenv('GCS_BUCKET_NAME')

@app.route('/create-report-job', methods=['POST'])
def create_report_job():
    # A única coisa que este endpoint faz é tentar escrever um arquivo.
    if not BUCKET_NAME:
        return jsonify({"status": "error", "message": "Bucket não configurado."}), 500

    try:
        print(f"--- INICIANDO TESTE DE ESCRITA NO BUCKET: {BUCKET_NAME} ---")

        bucket = storage_client.bucket(BUCKET_NAME)
        file_name = f"teste-de-permissao-{datetime.datetime.now().isoformat()}.txt"
        blob = bucket.blob(file_name)

        blob.upload_from_string(
            "Teste de escrita bem-sucedido.",
            content_type="text/plain"
        )

        print(f"--- SUCESSO! Arquivo '{file_name}' criado. ---")
        return jsonify({
            "status": "success",
            "message": "SUCESSO: O teste de escrita no bucket funcionou. A permissão básica está correta.",
            "file_created": file_name
        }), 200

    except Exception as e:
        # Se falhar aqui, o erro será sobre a permissão de escrita, e não de assinatura.
        print(f"--- FALHA NO TESTE DE ESCRITA: {e} ---")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)), debug=True)