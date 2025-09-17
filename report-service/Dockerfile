# -------------------------------------------------------------------------------------
# INSTRUÇÕES DE MONTAGEM (VERSÃO 5 - A VERSÃO FINAL)
# -------------------------------------------------------------------------------------

# Passo 1: A MUDANÇA CRUCIAL
# Trocamos a base 'slim' pela 'bullseye', uma versão do Debian
# que é 100% compatível com as dependências do wkhtmltopdf.
FROM python:3.9-bullseye

# Passos 2-4 (sem alterações)
ENV PYTHONUNBUFFERED True
WORKDIR /app
COPY requirements.txt .

# Passo 5: Simplificamos a instalação
# Agora que estamos no ambiente correto, não precisamos mais do 'wget' manual.
# Podemos instalar o wkhtmltopdf diretamente do 'catálogo' do Bullseye.
RUN apt-get update && \
    apt-get install -y wkhtmltopdf --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir -r requirements.txt

# Passos 6 e 7 (sem alterações)
COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--timeout", "300", "main:app"]