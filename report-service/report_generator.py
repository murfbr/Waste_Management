import os
import datetime
import jinja2
import pdfkit
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

class ReportGenerator:
    def __init__(self, templates_dir: str = "templates", output_dir: str = "output"):
        self.base_dir = Path(__file__).parent
        self.templates_dir = self.base_dir / templates_dir
        self.static_dir = self.base_dir / "static"
        self.output_dir = Path("/tmp") / output_dir
        
        self.templates_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
        
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=True
        )
        self.pdf_options = {
            'page-size': 'A4', 'margin-top': '0.75in', 'margin-right': '0.75in',
            'margin-bottom': '0.75in', 'margin-left': '0.75in', 'encoding': "UTF-8",
            'no-outline': None, 'enable-local-file-access': None
        }

    def create_report(self, template_name: str, data: dict, output_filename: str) -> str:
        # A CORREÇÃO ESTÁ AQUI: Usamos o caminho absoluto do diretório static
        # para garantir que o wkhtmltopdf o encontre dentro do container.
        data['static_url'] = f"file://{self.static_dir.resolve()}/"
        data['data_geracao'] = datetime.datetime.now().strftime('%d/%m/%Y %H:%M')
        
        template = self.jinja_env.get_template(template_name)
        html_content = template.render(data)
        pdf_path = self.output_dir / output_filename
        
        try:
            # Passamos o CSS explicitamente como uma opção para maior robustez
            css_path = self.static_dir / 'css' / 'report_styles.css'
            pdfkit.from_string(html_content, str(pdf_path), options=self.pdf_options, css=str(css_path))
            print(f"Relatório gerado com sucesso em: {pdf_path}")
            return str(pdf_path)
        except Exception as e:
            print(f"Erro ao gerar PDF com pdfkit: {e}")
            raise