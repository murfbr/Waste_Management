// functions/src/ineaService.ts

import fetch from "node-fetch";

// Define as URLs base da API do INEA para fácil manutenção.
// Usar uma variável de ambiente para alternar entre os dois seria o ideal em produção.
const API_HOMOLOGACAO = "http://200.20.53.4:8090/api";
const API_PRODUCAO = "http://mtr.inea.rj.gov.br/api";

/**
 * Classe de serviço para abstrair e centralizar toda a comunicação
 * com a API do Web Service MTR do INEA.
 * Atua como um "Adaptador" entre a lógica de negócio do SaaS e os
 * detalhes de implementação da API externa.
 */
export class IneaService {
    private login: string;
    private senha: string;
    private cnpj: string;
    private codUnidade: string;
    private apiUrl: string;

    /**
     * Inicializa o serviço com as credenciais necessárias para uma entidade (cliente).
     * @param login CPF do usuário responsável no sistema MTR.
     * @param senha Senha de acesso ao sistema MTR.
     * @param cnpj CNPJ ou CPF da unidade que está realizando a operação.
     * @param codUnidade Código da unidade no sistema MTR.
     * @param useProducao Define se a API de produção deve ser usada. Padrão é `false` (usa homologação).
     */
    constructor(login: string, senha: string, cnpj: string, codUnidade: string, useProducao = false) {
        this.login = login;
        this.senha = senha;
        this.cnpj = cnpj;
        this.codUnidade = codUnidade;
        this.apiUrl = useProducao ? API_PRODUCAO : API_HOMOLOGACAO;

        // LOG: Confirma a inicialização do serviço e o ambiente alvo.
        console.log(`[IneaService] Serviço inicializado para o CNPJ: ${this.cnpj}. API Alvo: ${this.apiUrl}`);
    }

    // --- MÉTODOS PÚBLICOS (Interface clara para o resto do seu app) ---

    /**
     * Testa a conexão com a API do INEA buscando a lista de classes de resíduos.
     * É um método simples e eficaz para validar as credenciais.
     * @returns Uma promessa que resolve com os dados da resposta da API.
     */
    public async testConnection(): Promise<any> {
        // LOG: Indica qual ação está sendo executada.
        console.log(`[IneaService] Executando: testConnection`);
        const endpoint = `${this.apiUrl}/retornaListaClasse/${this.login}/${this.senha}/${this.cnpj}/${this.codUnidade}`;
        return this.postRequest(endpoint);
    }

    /**
     * Busca a lista completa de resíduos (códigos IBAMA) disponíveis no INEA.
     * @returns Uma promessa que resolve com a lista de resíduos.
     */
    public async getResiduos(): Promise<any> {
        // LOG: Indica qual ação está sendo executada.
        console.log(`[IneaService] Executando: getResiduos`);
        const endpoint = `${this.apiUrl}/retornaListaResiduo/${this.login}/${this.senha}/${this.cnpj}/${this.codUnidade}`;
        return this.postRequest(endpoint);
    }

    /**
     * Gera um ou mais MTRs em um único lote.
     * @param mtrSaaSData Um array de objetos, onde cada objeto contém os dados de um MTR no formato do SEU sistema.
     * @returns Uma promessa que resolve com a resposta da API, contendo os números dos MTRs criados.
     */
    public async createMtrInLot(mtrSaaSData: any[]): Promise<any> {
        // LOG: Indica qual ação está sendo executada.
        console.log(`[IneaService] Executando: createMtrInLot`);
        const endpoint = `${this.apiUrl}/salvarManifestoLote`;
        
        // O serviço faz a "tradução" dos dados internos do SaaS para o formato exigido pelo INEA.
        const ineaPayload = this.mapSaaSDataToIneaPayload(mtrSaaSData);
        
        return this.postRequest(endpoint, ineaPayload);
    }

    // --- MÉTODOS PRIVADOS (Detalhes de implementação que ficam "escondidos") ---

    /**
     * Mapeia os dados do seu SaaS para o formato JSON complexo exigido pelo endpoint 'salvarManifestoLote' do INEA.
     * @param saasData Um array com os dados brutos dos MTRs a serem criados.
     * @returns O objeto de payload pronto para ser enviado como corpo da requisição.
     */
    private mapSaaSDataToIneaPayload(saasData: any[]): object {
        // LOG: Mostra os dados brutos que o método recebeu para mapear.
        console.log("[IneaService] Mapeando dados do SaaS para o payload do INEA. Dados recebidos:", JSON.stringify(saasData, null, 2));

        const manifestos = saasData.map(item => {
            return {
                "cnpDestinador": item.destinadorCnpj,
                "codUnidadeDestinador": item.destinadorCodUnidade,
                "cnpTransportador": item.transportadorCnpj,
                "codUnidadeTransportador": item.transportadorCodUnidade,
                "seuCodigoReferencia": item.nossoCodigo,
                "manifObservacao": item.observacao,
                "manifGeradorNomeResponsavel": item.responsavelNome,
                "manifGeradorCargoResponsavel": item.responsavelCargo,
                "manifTransportadorNomeMotorista": item.motoristaNome,
                "manifTransportadorPlacaVeiculo": item.veiculoPlaca,
                "manifTransportadorDataExpedicao": item.dataExpedicao,
                "itemManifestoJSONs": item.residuos.map((residuo: any) => ({
                    "quantidade": residuo.quantidade,
                    "residuo": residuo.codigoIbama,
                    "codigoAcondicionamento": residuo.codAcondicionamento,
                    "codigoClasse": residuo.codClasse,
                    "codigoTecnologia": residuo.codTecnologia,
                    "codigoTipoEstado": residuo.codEstadoFisico,
                    "codigoUnidade": residuo.codUnidadeMedida,
                    "manifestoltemObservacao": residuo.observacaoItem || "",
                }))
            };
        });

        const payload = {
            login: this.login,
            senha: this.senha,
            cnp: this.cnpj, 
            codUnidade: parseInt(this.codUnidade, 10),
            manifestoJSONDtos: manifestos,
        };

        // LOG: Mostra o payload final que será enviado para a API. Essencial para depuração.
        console.log("[IneaService] Payload final montado para envio:", JSON.stringify(payload, null, 2));

        return payload;
    }
    
    /**
     * Função auxiliar genérica para realizar requisições POST para a API do INEA.
     * Centraliza a lógica de fetch, tratamento de headers e erros de resposta.
     * @param endpoint A URL completa do endpoint a ser chamado.
     * @param body O corpo da requisição (opcional). Se fornecido, será convertido para JSON.
     * @returns Uma promessa que resolve com a resposta da API em formato JSON.
     */
    private async postRequest(endpoint: string, body: object | null = null): Promise<any> {
        const options: { method: string; headers: any; body?: string } = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        // LOG: Registra a tentativa de chamada à API.
        console.log(`[IneaService] Realizando POST para: ${endpoint}`);
        if (body) {
            // Não logamos o corpo aqui para evitar duplicar o log do método de mapeamento,
            // que já é bem detalhado. Apenas confirmamos que um corpo está sendo enviado.
            console.log(`[IneaService] ... com corpo de dados.`);
        }

        try {
            const response = await fetch(endpoint, options);

            if (!response.ok) {
                const errorBody = await response.text();
                // LOG: Erro detalhado da API.
                console.error(`[IneaService] ERRO na chamada para a API INEA. Endpoint: ${endpoint}, Status: ${response.status}, Resposta: ${errorBody}`);
                throw new Error(`A API do INEA retornou um erro: ${response.status} - ${response.statusText}. Detalhes: ${errorBody}`);
            }
            
            const responseData = await response.json();
            // LOG: Sucesso na chamada, mostrando a resposta recebida.
            console.log(`[IneaService] Sucesso na chamada para ${endpoint}. Resposta recebida:`, JSON.stringify(responseData, null, 2));
            return responseData;

        } catch (error) {
            // LOG: Erro de rede ou outro erro inesperado.
            console.error("[IneaService] ERRO DE CONEXÃO ou falha na requisição fetch.", error);
            throw error;
        }
    }
}
