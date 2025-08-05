// src/pages/app/PaginaGlossario.jsx
// Versão com a identidade visual aplicada e layout corrigido.
// CORREÇÃO: Agrupamento de letras acentuadas (A/Á, O/Ó) corrigido.
// FEATURE: Renderização de texto em negrito a partir da sintaxe **texto**.

import React, { useMemo } from 'react';

// Dados do glossário (inalterados)
const glossarioData = [
    { term: `Adubo`, definition: `Produto resultante da **compostagem**, rico em nutrientes, utilizado para melhorar a qualidade do solo e promover o crescimento saudável das plantas.` },
    { term: `API (Application Programming Interface)`, definition: `Conjunto de regras e protocolos que permite a comunicação entre diferentes softwares. É o que conecta o sistema Ctrl+Waste a plataformas externas, como o **INEA** ou sistemas de **ESG**.` },
    { term: `Área de geração de resíduos`, definition: `Local ou setor específico onde os **resíduos** são gerados, como cozinha, recepção, manutenção, entre outros. Essa informação ajuda a identificar onde há mais desperdício e planejar melhorias.` },
    { term: `Armazenamento Temporário`, definition: `Espaço provisório onde os **resíduos** ficam guardados até serem coletados para tratamento ou **destinação final**.\n\n*Exemplos: contêineres, baias ou galpões de resíduos.*` },
    { term: `Aterro Sanitário`, definition: `Instalação para disposição final de **resíduos sólidos** com controle ambiental. Apesar de regulamentado, é o último recurso na **hierarquia Lixo Zero**, pois impede o reaproveitamento dos materiais.` },
    { term: `Balança`, definition: `Equipamento usado para medir o peso dos **resíduos** antes de registrá-los no sistema Ctrl+Waste. Pode ser de chão ou de mão, dependendo do volume e do espaço disponível.` },
    { term: `Biometanização`, definition: `Processo em que microrganismos decompõem **resíduos orgânicos** em ambiente sem oxigênio, produzindo **biogás** e biofertilizante.` },
    { term: `CDF (Certificado de Destinação Final)`, definition: `Documento que comprova a **destinação adequada** de um resíduo. É emitido pela empresa que realiza o tratamento ou reaproveitamento, quando “dá baixa” no **MTR**.` },
    { term: `Chorume`, definition: `Líquido escuro e poluente gerado na decomposição de **resíduos orgânicos** em **aterros sanitários**. Pode contaminar solo e água se não for tratado.` },
    { term: `Ciclo de Vida`, definition: `Etapas pelas quais um produto passa desde a extração da **matéria-prima**, produção, uso, até o descarte. No Ctrl+Waste, considerar o ciclo de vida ajuda a identificar onde há mais desperdício e como promover a **reciclagem**, **reutilização** ou **regeneração**.` },
    { term: `Coleta Seletiva`, definition: `Processo de recolhimento dos **resíduos sólidos** previamente **separados** por tipo: **recicláveis**, **orgânicos** e **rejeitos**.` },
    { term: `Compensação Ambiental`, definition: `Ações adotadas para equilibrar impactos ambientais causados por uma atividade. Pode incluir a compra de **créditos de reciclagem** ou o apoio a **cooperativas**.` },
    { term: `Compostagem`, definition: `Transformação de **resíduos orgânicos** em **adubo** por meio da decomposição natural feita por microrganismos.` },
    { term: `Composição de resíduos`, definition: `Proporção de cada tipo de **resíduo** gerado (reciclável, orgânico e rejeito) em um local ou período.` },
    { term: `Compliance`, definition: `Conjunto de práticas para garantir que uma empresa siga leis, normas e políticas internas. No contexto do Ctrl+Waste, envolve o uso correto do **MTR**, **CDF**, e o cumprimento das exigências de **órgãos ambientais**.` },
    { term: `Conscientização`, definition: `Processo de educação e sensibilização sobre a importância de atitudes sustentáveis, como a **separação correta dos resíduos** e a redução do desperdício.` },
    { term: `Controle de Dados`, definition: `Processo de registrar, organizar, armazenar e utilizar informações de forma segura e eficiente. No Ctrl+Waste, o controle de dados é essencial para gerar **indicadores**, acompanhar **metas**, garantir **compliance** e otimizar a **gestão de resíduos**.` },
    { term: `Cooperativas de Reciclagem`, definition: `Associações de trabalhadores que coletam, separam e comercializam materiais e **resíduos recicláveis**, promovendo inclusão social e geração de renda.` },
    { term: `Crédito de Reciclagem`, definition: `Comprovação de que uma empresa contribuiu com a **destinação adequada** de **resíduos recicláveis**, muitas vezes por meio de **cooperativas** ou recicladoras certificadas.` },
    { term: `Ctrl+Waste (Plataforma)`, definition: `Sistema digital para registrar, monitorar e analisar dados de **resíduos sólidos** em empresas. Atua na interface entre a **área operacional** e a **gestão estratégica**, otimizando decisões e reduzindo desperdícios.` },
    { term: `Dashboard de Resíduos`, definition: `Painel visual com gráficos e indicadores sobre o desempenho da empresa em relação à **gestão de resíduos**, como volume, composição e **taxa de desvio de aterro**.` },
    { term: `Dados`, definition: `Informações geradas a partir do registro de **pesagens** e classificações de **resíduos** no Ctrl+Waste. Servem como base para relatórios, decisões estratégicas e comprovações legais.` },
    { term: `Destinação Correta de Resíduos`, definition: `Encaminhamento dos **resíduos** para locais onde terão tratamento ou reaproveitamento adequado: **reuso**, **reciclagem**, **compostagem**, ou, em último caso, **aterro**.` },
    { term: `Destinação Final de Resíduos`, definition: `Última etapa do ciclo dos **resíduos**, onde eles são descartados, reciclados, compostados ou incinerados, conforme sua natureza e potencial de reaproveitamento.` },
    { term: `Destinador de Resíduos`, definition: `Empresa especializada em tratar, reaproveitar ou dar o destino final aos **resíduos sólidos** gerados por outras organizações.` },
    { term: `Desperdício`, definition: `Perda de materiais ou recursos que poderiam ser reaproveitados ou evitados, como sobras de alimentos ou embalagens descartadas incorretamente.` },
    { term: `Diretrizes`, definition: `Conjunto de orientações que orientam as ações e decisões de uma organização. Na **gestão de resíduos**, envolvem metas, rotinas operacionais e critérios de classificação.` },
    { term: `Dispositivo Móvel`, definition: `Celular ou tablet usado para registrar as **pesagens** e classificações de **resíduos** diretamente na área de geração, com acesso ao sistema Ctrl+Waste.` },
    { term: `Economia Circular`, definition: `Modelo que prioriza o uso eficiente de recursos, reduzindo desperdícios e reaproveitando materiais ao longo de todo o ciclo produtivo.` },
    { term: `Educação Ambiental`, definition: `Ações e estratégias voltadas para informar e engajar pessoas na **preservação ambiental** e na **gestão eficiente de resíduos**.` },
    { term: `ESG (Environmental, Social and Governance)`, definition: `Conjunto de critérios que avaliam o compromisso de uma empresa com práticas sustentáveis, sociais e de governança. O Ctrl+Waste gera dados úteis para esses relatórios.` },
    { term: `Fardo`, definition: `Bloco compacto de **materiais recicláveis** prensados, facilitando transporte e comercialização.` },
    { term: `Função`, definition: `Papel que um processo ou setor cumpre dentro de um sistema, como a **separação de resíduos**, o **monitoramento**, ou a **análise de dados** no Ctrl+Waste.` },
    { term: `Gás Metano (CH₄)`, definition: `Gás inflamável gerado na decomposição de **resíduos orgânicos** em locais sem oxigênio, como aterros. É parte do **biogás**, com alto potencial energético, mas também contribui para o aquecimento global.` },
    { term: `Gestão`, definition: `Administração estratégica dos recursos, processos e equipes com foco em **eficiência**, redução de perdas e alcance de objetivos.` },
    { term: `Gestão de Resíduos`, definition: `Conjunto de ações para planejar, executar e monitorar todas as etapas relacionadas aos **resíduos sólidos**, desde a geração até a **destinação final**.` },
    { term: `Gestão Eficiente de Resíduos`, definition: `Atuação focada em reduzir desperdícios, controlar custos e aumentar o reaproveitamento, com apoio de dados e tecnologia, como o Ctrl+Waste.` },
    { term: `Gerador de Resíduos`, definition: `Empresa que produz **resíduos sólidos** em suas atividades e é responsável por seu correto manejo.` },
    { term: `Hierarquia Lixo Zero`, definition: `Sequência de prioridades na **gestão de resíduos**: **recusar**, **reduzir**, **reutilizar**, **reciclar/compostar** e, por fim, **destinar rejeitos ao aterro**.` },
    { term: `Indicador`, definition: `Métrica usada para medir desempenhos. Na **gestão de resíduos**, consideramos o volume gerado, taxa de reciclagem ou **taxa de desvio de aterro**.` },
    { term: `INEA (Instituto Estadual do Ambiente)`, definition: `Órgão do Rio de Janeiro responsável por fiscalizar, licenciar e monitorar atividades com impacto ambiental. Também gerencia a plataforma que realiza a emissão de **MTRs**.` },
    { term: `Incineração`, definition: `Processo que queima **resíduos sólidos** a altas temperaturas, reduzindo seu volume. É uma opção de **destinação final**, mas não é a mais sustentável.` },
    { term: `Indústria de Reciclagem`, definition: `Empresas que transformam **resíduos recicláveis** em nova **matéria-prima** ou produtos.` },
    { term: `Infraestrutura`, definition: `Conjunto de equipamentos, espaços e sistemas necessários para realizar a **gestão de resíduos** de forma eficiente.\n\n*Exemplos: baias, prensas, balanças, containers e softwares.*` },
    { term: `Input de Dados`, definition: `Inserção de informações no sistema Ctrl+Waste, como peso, tipo e local de geração dos **resíduos**. Esses dados alimentam os **dashboards** e relatórios.` },
    { term: `Integração`, definition: `Capacidade do sistema Ctrl+Waste de se conectar com outras plataformas e processos, como **ESG**, **órgãos ambientais** ou ferramentas internas do cliente.` },
    { term: `Liderança`, definition: `Papel das pessoas que tomam decisões estratégicas e influenciam equipes a adotar práticas sustentáveis. No contexto do Ctrl+Waste, lideranças são fundamentais para garantir a implementação eficaz da **gestão de resíduos**.` },
    { term: `Lixo Zero (Zero Waste)`, definition: `Filosofia que busca repensar o ciclo de vida dos produtos, priorizando a **reutilização**, **reciclagem** e **compostagem**, evitando o envio a aterros ou incineração.` },
    { term: `Local de Geração de Resíduos`, definition: `Endereço ou unidade onde os **resíduos** são gerados e registrados no sistema. Pode haver múltiplos locais em empresas com filiais independentes.` },
    { term: `Logística`, definition: `Planejamento e execução do transporte de **resíduos** da origem até o **destino final**, incluindo coleta, armazenamento temporário e roteiros de entrega.` },
    { term: `Logística Reversa`, definition: `Processo que permite o retorno de produtos ou **resíduos** à cadeia produtiva, para reaproveitamento, reciclagem ou descarte correto.` },
    { term: `Matéria-prima`, definition: `Material base utilizado para produzir bens. Muitos **resíduos recicláveis** podem voltar a ser **matéria-prima** quando encaminhados à **indústria de reciclagem**.` },
    { term: `Meta`, definition: `Objetivo quantificável que orienta o desempenho da empresa em relação a qualquer tema, inclusive **gestão de resíduos**, como reduzir 30% do volume de **rejeitos** em 6 meses.` },
    { term: `Metodologia`, definition: `Conjunto de práticas, rotinas e processos que orientam o uso do Ctrl+Waste e a **gestão eficiente de resíduos** nas empresas.` },
    { term: `Monitoramento`, definition: `Acompanhamento contínuo e sistemático das atividades relacionadas à **gestão de resíduos**, como geração, **volume**, separação e **destinação**. O Ctrl+Waste permite o monitoramento automatizado em tempo real, fornecendo dados para decisões mais rápidas e eficientes.` },
    { term: `MTR (Manifesto de Transporte de Resíduos)`, definition: `Documento obrigatório que registra o transporte de **resíduos sólidos** da origem até a **destinação final**, emitido pelo sistema do **SINIR**.` },
    { term: `Objetivo`, definition: `O que se espera alcançar com determinada ação ou plano. No Ctrl+Waste, é comum estabelecer objetivos como aumentar a taxa de **reciclagem**, reduzir o volume de **rejeitos** ou otimizar a operação.` },
    { term: `Órgão Ambiental`, definition: `Instituição pública responsável por fiscalizar, licenciar e regular atividades com impacto ambiental, como o **INEA**, **CETESB** e **IBAMA**.` },
    { term: `Operação`, definition: `Conjunto das atividades diárias da equipe que atua diretamente na **gestão de resíduos**, como a **pesagem**, separação, armazenamento e registro no sistema.` },
    { term: `Passivos Ambientais`, definition: `Danos ou riscos ambientais acumulados por atividades que não tiveram **gestão adequada de resíduos**.\n\n*Exemplos: contaminação do solo, emissão de gases ou acúmulo de rejeitos em locais inadequados.*` },
    { term: `Plataforma (Ctrl+Waste)`, definition: `Sistema digital de **gestão de resíduos** baseado em SaaS (software como serviço), que automatiza registros, gera dados estratégicos e promove a **sustentabilidade.**` },
    { term: `PNRS (Política Nacional de Resíduos Sólidos)`, definition: `Lei nº 12.305/2010 que estabelece diretrizes para o gerenciamento de **resíduos sólidos** no Brasil.` },
    { term: `Políticas e Normas Ambientais`, definition: `Regras, leis e diretrizes criadas para regular o uso de recursos naturais e a **gestão de resíduos** nas organizações e no setor público.` },
    { term: `Poluição por Plásticos`, definition: `Contaminação do meio ambiente causada pelo descarte inadequado de resíduos plásticos, que demoram centenas de anos para se decompor.` },
    { term: `Prensa`, definition: `Equipamento utilizado para compactar **materiais recicláveis**, formando **fardos** e facilitando o transporte.` },
    { term: `Preservação Ambiental`, definition: `Conjunto de ações voltadas à proteção dos recursos naturais e à redução de impactos negativos, como o descarte incorreto de **resíduos**.` },
    { term: `Processos`, definition: `Etapas e rotinas operacionais que compõem a **gestão de resíduos**, como separação, **pesagem**, emissão de **MTRs**, entre outros.` },
    { term: `Reaproveitamento`, definition: `Uso de **resíduos** em novos processos produtivos, com ou sem transformação, evitando o desperdício de recursos.` },
    { term: `Reciclagem`, definition: `Transformação dos **resíduos recicláveis** em novas matérias-primas ou produtos, reduzindo a extração de recursos naturais.` },
    { term: `Recuperação de Materiais`, definition: `Processo que visa reaproveitar componentes ou insumos dos **resíduos**, reduzindo desperdícios e mantendo os materiais na cadeia produtiva.` },
    { term: `Recursos`, definition: `Todos os elementos (humanos, naturais, econômicos e tecnológicos) utilizados em uma organização. A **gestão eficiente de resíduos** depende da boa administração desses recursos.` },
    { term: `Recursos Ambientais`, definition: `Bens naturais como água, ar, solo, flora e fauna. Sua preservação é um dos principais objetivos da **gestão de resíduos**.` },
    { term: `Recursos Econômicos`, definition: `Investimentos financeiros e bens de valor utilizados pela empresa para operar e atingir metas, incluindo economia gerada pela **otimização da gestão de resíduos**.` },
    { term: `Redução, Reutilização, Reciclagem, Recusar, Repensar, Reparar, Reintegrar, Responsabilizar, Regenerar`, definition: `Os **9 Rs da Economia Circular**, que orientam ações para minimizar a geração de **resíduos** e maximizar seu aproveitamento.\n\n1. **Recusar**: evitar o consumo desnecessário.\n2. **Reduzir**: diminuir o volume de resíduos gerados.\n3. **Reutilizar**: usar novamente o mesmo material.\n4. **Reciclar**: transformar em nova matéria-prima.\n5. **Reparar**: consertar itens danificados.\n6. **Repensar**: revisar padrões de consumo e produção.\n7. **Reintegrar**: devolver materiais ao ciclo produtivo.\n8. **Responsabilizar**: assumir deveres com o meio ambiente.\n9. **Regenerar**: restaurar ecossistemas impactados.` },
    { term: `Rejeitos`, definition: `**Resíduos** que não podem ser reaproveitados nem reciclados. Devem ser encaminhados a **aterros sanitários**.` },
    { term: `Resíduos Orgânicos`, definition: `**Resíduos** de origem biológica, como alimentos, folhas e resíduos de jardim, que podem ser transformados em **adubo**.` },
    { term: `Resíduo Perigoso`, definition: `Tipo de **resíduo** que apresenta riscos à saúde ou ao meio ambiente, como os inflamáveis e tóxicos.` },
    { term: `Resíduos Recicláveis`, definition: `**Resíduos sólidos** que podem ser reaproveitados por meio da **reciclagem**, como papel, plástico, vidro e metal.` },
    { term: `Responsabilidade Corporativa`, definition: `Compromisso das empresas com práticas éticas, sustentáveis e transparentes. No contexto da **gestão de resíduos**, significa cuidar do descarte correto, reduzir impactos ambientais, atender normas legais e colaborar com a **economia circular**.` },
    { term: `Reutilização`, definition: `Ato de reaproveitar um item sem transformá-lo industrialmente.\n\n*Exemplo: usar pote de vidro como recipiente para mantimentos.*` },
    { term: `Separação de Resíduos`, definition: `Divisão dos **resíduos** no momento da geração, em categorias como **orgânicos**, **recicláveis** e **rejeitos**. É o primeiro passo para o reaproveitamento.` },
    { term: `SINIR (Sistema Nacional de Informações sobre a Gestão dos Resíduos Sólidos)`, definition: `Plataforma do governo federal que acompanha dados da **gestão de resíduos** em todo o país.` },
    { term: `Sistema`, definition: `Conjunto de partes interligadas que trabalham para alcançar um **objetivo comum**. No Ctrl+Waste, o sistema é composto por usuários, dados, dashboards, APIs e dispositivos móveis.` },
    { term: `Sustentabilidade`, definition: `Capacidade de atender às necessidades atuais sem comprometer as futuras gerações. Envolve a redução de desperdícios, uso responsável de recursos e **gestão eficiente dos resíduos**.` },
    { term: `Taxa de Desvio de Aterro`, definition: `Percentual de **resíduos** que não foram enviados para **aterro sanitário**, sendo reaproveitados por **reciclagem**, **compostagem** ou outras soluções.` },
    { term: `Tecnologia Intuitiva`, definition: `Soluções digitais de fácil compreensão e uso, mesmo para quem não tem experiência técnica. No Ctrl+Waste, o app foi desenhado para ser usado por diferentes perfis de usuários.` },
    { term: `Tipo de Resíduo (orgânico, reciclável, rejeito)`, definition: `Classificação que determina o destino e tratamento dos resíduos:\n\n- **Orgânico**: restos de comida, folhas, etc.\n- **Reciclável**: papel, plástico, metal, vidro.\n- **Rejeito**: contaminado, misturado, não reciclável.` },
    { term: `Transportador de Resíduos`, definition: `Empresa ou pessoa responsável por levar os **resíduos** do ponto de geração até o local de **destinação** ou **tratamento**.` },
    { term: `Tratamento Adequado de Resíduos`, definition: `Conjunto de processos aplicados aos **resíduos sólidos** para reduzir seus impactos antes da **destinação final**. Pode envolver **reciclagem**, **compostagem**, **biometanização** ou **incineração**, dependendo do tipo de resíduo. O tratamento adequado é uma etapa essencial para garantir **sustentabilidade** e **compliance** ambiental.` },
    { term: `Usuário Gerencial`, definition: `Perfil do sistema Ctrl+Waste com acesso a relatórios, metas e **dashboards**, voltado para gestores e responsáveis por decisões estratégicas.` },
    { term: `Usuário Operacional`, definition: `Perfil do sistema Ctrl+Waste responsável por registrar as **pesagens** de **resíduos** e garantir que os dados estejam atualizados no app.` },
    { term: `Valor`, definition: `Importância atribuída a algo. Pode ser financeira, ambiental, social ou simbólica, como o valor de manter um ambiente limpo ou cumprir metas de ESG.` },
    { term: `Valor Ambiental`, definition: `Benefício gerado para o meio ambiente por uma ação, como evitar a contaminação de um rio ou reduzir o envio de resíduos ao aterro.` },
    { term: `Vida Útil de Resíduos`, definition: `Tempo em que um item ou **material** ainda pode ser reaproveitado antes de se tornar **rejeito**. Aumentar essa vida útil é parte da **economia circular**.` },
    { term: `Volume de Resíduos`, definition: `Quantidade de **resíduos sólidos** gerada em determinado período, geralmente medida em quilos ou toneladas. No Ctrl+Waste, o volume é registrado em cada **pesagem**, permitindo análises e comparação entre setores, períodos ou unidades.` },
];


// Componente para cada item do glossário, com a lógica para renderizar negrito.
const GlossarioItem = ({ term, definition }) => {
  // Função para transformar a sintaxe **texto** em JSX <strong/>
  const formatDefinition = (text) => {
    // Divide o texto pelo delimitador **
    const parts = text.split('**');
    
    // Mapeia as partes: as ímpares ficam em negrito, as pares são texto normal.
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="py-6 border-b border-early-frost/70">
        <dt>
            <p className="font-lexend text-acao font-medium text-abundant-green">{term}</p>
        </dt>
        <dd className="mt-2 font-comfortaa text-corpo text-rich-soil whitespace-pre-line">
            {formatDefinition(definition)}
        </dd>
    </div>
  );
};

export default function PaginaGlossario() {
  // A lógica para agrupar e ordenar os dados foi corrigida aqui.
  const groupedData = useMemo(() => {
    const sortedData = [...glossarioData].sort((a, b) =>
      a.term.localeCompare(b.term, 'pt-BR')
    );
    
    return sortedData.reduce((acc, item) => {
      const firstLetter = item.term[0]
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(item);
      return acc;
    }, {});
  }, []);

  const availableLetters = Object.keys(groupedData);

  return (
    <div className="font-comfortaa">
        <div className="bg-white p-6 sm:p-12 rounded-2xl shadow-2xl max-w-7xl mx-auto">
            <h1 className="font-lexend text-titulo text-blue-coral text-center">Glossário de Resíduos</h1>
            <p className="mt-4 text-corpo text-exotic-plume text-center max-w-3xl mx-auto">
                Uma lista de termos essenciais para entender a gestão de resíduos sólidos e o universo Lixo Zero.
            </p>

            <nav className="mt-12 sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 border-b-2 border-early-frost">
                <ul className="flex justify-center flex-wrap gap-3 sm:gap-4">
                    {availableLetters.map(letter => (
                        <li key={letter}>
                            <a 
                                href={`#letra-${letter}`}
                                className="w-10 h-10 flex items-center justify-center font-lexend text-sm font-bold text-blue-coral bg-blue-coral/10 rounded-full hover:bg-apricot-orange hover:text-white transition-all duration-300 ease-in-out transform hover:scale-110"
                            >
                                {letter}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="mt-8">
                <dl>
                    {availableLetters.map(letter => (
                        <div key={letter} id={`letra-${letter}`} className="pt-12 -mt-8 scroll-mt-24">
                            <h2 className="font-lexend text-subtitulo text-apricot-orange border-b-2 border-golden-orange/40 pb-2 mb-6">
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