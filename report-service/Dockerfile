# Versão final e validada do Dockerfile
FROM python:3.9-bullseye

ENV PYTHONUNBUFFERED True
WORKDIR /app

COPY requirements.txt .

# Instala o wkhtmltopdf e as dependências Python
RUN apt-get update && \
    apt-get install -y wkhtmltopdf --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--timeout", "300", "main:app"]