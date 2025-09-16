import os
import jinja2
import pdfkit
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from datetime import datetime
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

class ReportGenerator:
    """
    Classe para gerar relatórios em PDF a partir de templates HTML e dados dinâmicos.
    """
    def __init__(self, templates_dir: str = "templates", output_dir: str = "output"):
        """
        Inicializa o gerador de relatórios.
        
        Args:
            templates_dir: Diretório contendo os templates HTML, relativo à pasta 'api'.
            output_dir: Diretório onde os PDFs serão salvos no ambiente temporário.
        """
        # O 'base_dir' é a pasta 'api', que é o diretório pai da pasta 'src'
        self.base_dir = Path(__file__).parent.parent
        
        # Os caminhos para templates e static agora são calculados a partir da pasta 'api'
        self.templates_dir = self.base_dir / templates_dir
        self.static_dir = self.base_dir / "static"
        
        # IMPORTANTE: A Vercel só permite escrever arquivos na pasta /tmp.
        # Estamos ajustando o output_dir para usar este diretório temporário.
        self.output_dir = Path("/tmp") / output_dir
        
        # Criar diretórios se não existirem
        self.templates_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
        
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=True
        )
        self.pdf_options = {
            'page-size': 'A4',
            'margin-top': '0.75in',
            'margin-right': '0.75in',
            'margin-bottom': '0.75in',
            'margin-left': '0.75in',
            'encoding': "UTF-8",
            'no-outline': None,
            'enable-local-file-access': None
        }

    def create_report(self, template_name: str, data: dict, output_filename: str) -> str:
        """
        Renderiza um template HTML com os dados e o converte para PDF.
        """
        # Adiciona a data de geração e o caminho para arquivos estáticos aos dados do template
        data['data_geracao'] = datetime.now().strftime('%d/%m/%Y %H:%M')
        data['static_url'] = f"file://{self.static_dir.resolve()}"

        template = self.jinja_env.get_template(template_name)
        html_content = template.render(data)
        
        pdf_path = self.output_dir / output_filename
        
        try:
            pdfkit.from_string(html_content, str(pdf_path), options=self.pdf_options)
            print(f"Relatório gerado com sucesso em: {pdf_path}")
            return str(pdf_path)
        except Exception as e:
            print(f"Erro ao gerar PDF com pdfkit: {e}")
            raise