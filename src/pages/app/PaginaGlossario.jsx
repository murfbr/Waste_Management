// src/pages/app/PaginaGlossario.jsx

import React, { useMemo } from 'react';

const glossarioData = [
    { term: "Resíduos Sólidos", definition: "Materiais descartados nas atividades humanas que, após seu uso, não têm mais utilidade imediata. Incluem resíduos domésticos, industriais, comerciais, hospitalares, entre outros." },
    { term: "Lixo Zero (Zero Waste)", definition: "Filosofia que busca repensar o ciclo de vida dos produtos, com o objetivo de reduzir ao máximo a geração de resíduos, priorizando a reutilização, reciclagem e compostagem, evitando o envio de materiais para aterros ou incineração." },
    { term: "Coleta Seletiva", definition: "Sistema de recolhimento de resíduos previamente separados por tipo (recicláveis como papel, plástico, metal, vidro; orgânicos como restos de alimentos, plantas; rejeitos como papel higiênico, materiais misturados e engordurados, etc.), facilitando o reaproveitamento e a reciclagem." },
    { term: "Armazenamento Temporário", definition: "Espaço destinado à guarda provisória de resíduos até que sejam coletados para transporte, tratamento ou destinação final. Exemplos: contêineres, galpões, baias de resíduos em empresas ou condomínios." },
    { term: "Reciclagem", definition: "Processo de transformação de resíduos em novos produtos ou matérias-primas, reduzindo o consumo de recursos naturais e a geração de lixo." },
    { term: "Reutilização", definition: "Ato de reaproveitar materiais ou produtos sem que passem por processos industriais, prolongando sua vida útil e evitando o descarte precoce." },
    { term: "Reaproveitamento", definition: "Uso de resíduos ou materiais descartados em novos processos produtivos ou aplicações, com ou sem transformação, evitando o desperdício de recursos." },
    { term: "Prensa", definition: "Equipamento utilizado para compactar e formar fardos de resíduos recicláveis, como papel, plástico e alumínio, reduzindo seu volume e facilitando o armazenamento e transporte." },
    { term: "Fardo", definition: "Bloco compacto de materiais recicláveis prensados, geralmente envolto por fitas ou arames, pronto para transporte ou comercialização." },
    { term: "Indústria Recicladora", definition: "Empresa responsável por transformar materiais recicláveis em novas matérias-primas ou produtos, reinserindo-os na cadeia produtiva. Exemplo: indústria que transforma garrafas PET em fibras têxteis." },
    { term: "Crédito de Reciclagem", definition: "Instrumento que comprova a compensação ambiental pela destinação correta de resíduos recicláveis, gerado por cooperativas ou operadores de reciclagem e adquirido por empresas para cumprir metas legais ou voluntárias." },
    { term: "Compostagem", definition: "Processo biológico de decomposição da matéria orgânica (restos de alimentos, folhas, etc.) transformando-a em adubo natural, rico em nutrientes." },
    { term: "Biometanização", definition: "Processo de decomposição anaeróbica (sem oxigênio) da matéria orgânica por microrganismos, resultando na produção de biogás (principalmente metano) e biofertilizante." },
    { term: "Materiais Recicláveis", definition: "Resíduos que podem ser reaproveitados como matéria-prima para novos produtos. Exemplos: papel, plástico, vidro, metal." },
    { term: "Materiais Orgânicos", definition: "Resíduos de origem biológica que podem ser transformados em adubo por compostagem. Exemplos: restos de alimentos, folhas secas, borra de café, papel toalha." },
    { term: "Rejeitos", definition: "Resíduos que não podem ser reciclados nem compostados, devendo ser enviados a aterros sanitários. Exemplos: fraldas, papel higiênico, esponjas usadas, louça de cerâmica." },
    { term: "Resíduo para Energia (Waste-to-Energy)", definition: "Tecnologia que converte resíduos sólidos em energia térmica, elétrica ou combustível, por meio de processos como incineração, gaseificação ou digestão anaeróbrica." },
    { term: "Aterro Sanitário", definition: "Local projetado para o descarte final de resíduos sólidos de forma controlada, com medidas para minimizar impactos ambientais e à saúde pública." },
    { term: "Chorume", definition: "Líquido escuro e altamente poluente resultante da decomposição de resíduos orgânicos em aterros sanitários, podendo contaminar o solo e a água se não for tratado adequadamente." },
    { term: "Gás Metano (CH₄)", definition: "Gás inflamável gerado na decomposição anaeróbica da matéria orgânica. É um dos principais componentes do biogás e um potente gás de efeito estufa." },
    { term: "Logística Reversa", definition: "Conjunto de ações destinadas a viabilizar a coleta e a restituição de resíduos sólidos ao setor empresarial gerador, para reaproveitamento, reciclagem ou descarte ambientalmente adequado." },
    { term: "Economia Circular", definition: "Modelo econômico que busca manter os recursos em uso pelo maior tempo possível, extraindo o máximo valor deles enquanto estão em uso, e recuperando e regenerando produtos e materiais ao fim de sua vida útil." },
    { term: "Poluição por Plásticos", definition: "Contaminação do meio ambiente, especialmente oceanos e rios, por resíduos plásticos que demoram centenas de anos para se decompor e causam danos à fauna e flora." },
    { term: "Educação Ambiental", definition: "Processo de conscientização e sensibilização da população sobre a importância da preservação ambiental e da gestão adequada dos resíduos." },
    { term: "Gerador de Resíduos", definition: "Pessoa física ou jurídica que, em razão de suas atividades, produz resíduos sólidos, sendo responsável por sua gestão adequada." },
    { term: "Resíduo Perigoso", definition: "Resíduo que, por suas características (inflamável, tóxico, corrosivo, etc.), apresenta riscos à saúde pública ou ao meio ambiente." },
    { term: "PNRS (Política Nacional de Resíduos Sólidos)", definition: "Lei brasileira (Lei nº 12.305/2010) que estabelece diretrizes para a gestão integrada e o gerenciamento de resíduos sólidos, incluindo metas de redução, reutilização, reciclagem e disposição final ambientalmente adequada." },
    { term: "Transportador de Resíduos", definition: "Pessoa física ou jurídica responsável pelo transporte de resíduos sólidos do local de geração até o local de tratamento, armazenamento temporário ou destinação final. Deve operar conforme normas ambientais e de segurança, garantindo que os resíduos não causem danos ao meio ambiente ou à saúde pública durante o trajeto." },
    { term: "Destinador de Resíduos", definition: "Pessoa física ou jurídica que realiza a destinação final ambientalmente adequada dos resíduos sólidos, por meio de processos como reciclagem, compostagem, incineração, coprocessamento ou disposição em aterros sanitários licenciados. É responsável por garantir que os resíduos sejam tratados de forma segura e conforme a legislação vigente." },
    { term: "MTR (Manifesto de Transporte de Resíduos)", definition: "Documento obrigatório que acompanha o transporte de resíduos sólidos desde a origem até a destinação final. Ele registra informações sobre o gerador, o transportador, o tipo de resíduo e o destinador, garantindo a rastreabilidade e a conformidade ambiental do processo. No Brasil, é regulamentado pelo Sistema Nacional de Informações sobre a Gestão dos Resíduos Sólidos (SINIR)." },
    { term: "CDF (Certificado de Destinação Final)", definition: "Documento emitido pelo destinador de resíduos que comprova a destinação ambientalmente adequada dos resíduos recebidos, atrelado ao MTR. Serve como prova legal de que o resíduo foi tratado, reciclado, coprocessado ou disposto corretamente, sendo essencial para o controle e a prestação de contas do gerador." },
    { term: "Órgão Ambiental", definition: "Entidade pública responsável por implementar, fiscalizar e fazer cumprir as políticas e normas ambientais em âmbito municipal, estadual ou federal. No Brasil, os principais órgãos incluem o IBAMA (Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis), os órgãos estaduais de meio ambiente (como o INEA no Rio de Janeiro) e as secretarias municipais. Esses órgãos têm a função de licenciar atividades potencialmente poluidoras, monitorar o cumprimento da legislação ambiental, aplicar sanções e promover a educação ambiental." },
    { term: "SINIR (Sistema Nacional de Informações sobre a Gestão dos Resíduos Sólidos)", definition: "Plataforma do governo federal brasileiro que reúne, organiza e disponibiliza dados sobre a gestão de resíduos sólidos no país. O SINIR permite o monitoramento da geração, transporte e destinação de resíduos, sendo uma ferramenta essencial para a implementação da Política Nacional de Resíduos Sólidos (PNRS). Ele também é responsável pela emissão do MTR (Manifesto de Transporte de Resíduos)." },
    { term: "INEA (Instituto Estadual do Ambiente)", definition: "Órgão ambiental do estado do Rio de Janeiro, vinculado à Secretaria de Estado do Ambiente e Sustentabilidade. O INEA é responsável pelo licenciamento ambiental, fiscalização, monitoramento e execução de políticas públicas voltadas à proteção e recuperação do meio ambiente no estado. Atua também na gestão de recursos hídricos, unidades de conservação e controle da poluição." },
    { term: "CETESB (Companhia Ambiental do Estado de São Paulo)", definition: "Órgão vinculado à Secretaria de Meio Ambiente, Infraestrutura e Logística do Estado de São Paulo, responsável pelo controle, fiscalização, monitoramento e licenciamento ambiental no estado. A CETESB atua na prevenção e controle da poluição, na gestão da qualidade do ar, da água e do solo, além de fornecer suporte técnico e emitir pareceres ambientais. É o equivalente ao INEA no estado do Rio de Janeiro." }
];

const GlossarioItem = ({ term, definition }) => (
    <div className="py-6 border-b border-gray-200">
        <dt>
            <p className="text-lg leading-6 font-medium text-gray-900">{term}</p>
        </dt>
        <dd className="mt-2 text-base text-gray-500">{definition}</dd>
    </div>
);

export default function PaginaGlossario() {
  // --- MELHORIA 1: Ordenar e agrupar os dados ---
  const groupedData = useMemo(() => {
    // Ordena os dados alfabeticamente pelo termo
    const sortedData = [...glossarioData].sort((a, b) => a.term.localeCompare(b.term));

    // Agrupa os dados pela primeira letra do termo
    return sortedData.reduce((acc, item) => {
      const firstLetter = item.term[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(item);
      return acc;
    }, {});
  }, []); // O array vazio [] significa que isso só será calculado uma vez

  // Pega as letras disponíveis para criar o menu de navegação
  const availableLetters = Object.keys(groupedData);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-800 text-center">Glossário de Resíduos</h1>
            <p className="mt-4 text-lg text-gray-600 text-center max-w-3xl mx-auto">
                Uma lista de termos essenciais para entender a gestão de resíduos sólidos e o universo Lixo Zero.
            </p>

            {/* --- MELHORIA 2: Menu de navegação por letra --- */}
            <nav className="mt-12 sticky top-0 bg-white py-4 z-10 border-b-2 border-gray-200">
                <ul className="flex justify-center flex-wrap gap-x-3 gap-y-2">
                    {availableLetters.map(letter => (
                        <li key={letter}>
                            <a 
                                href={`#letra-${letter}`}
                                className="block w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-500 bg-gray-100 rounded-full hover:bg-indigo-500 hover:text-white transition-colors duration-200"
                            >
                                {letter}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="mt-8">
                <dl>
                    {/* --- MELHORIA 3: Renderização em seções agrupadas --- */}
                    {availableLetters.map(letter => (
                        <div key={letter} id={`letra-${letter}`} className="pt-8 -mt-8"> {/* Padding e margem negativa para o scroll */}
                            <h2 className="text-3xl font-bold text-indigo-600 border-b-2 border-indigo-200 pb-2 mb-4">
                                {letter}
                            </h2>
                            <div className="space-y-4">
                                {groupedData[letter].map((item) => (
                                    <GlossarioItem key={item.term} term={item.term} definition={item.definition} />
                                ))}
                            </div>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    </div>
  );
}
