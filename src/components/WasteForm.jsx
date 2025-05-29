// src/components/WasteForm.jsx

import React, { useState, useEffect, useRef } from 'react'; // Adicionado useRef

// Lista de fallback para subtipos de recicláveis se o cliente não tiver definido os seus próprios
const SUBTIPOS_RECICLAVEIS_FALLBACK = ["Papel", "Vidro", "Metal", "Plástico", "Baterias", "Eletrônicos"];


export default function WasteForm({ onAddWaste, clienteSelecionado }) {
  const [areaLancamento, setAreaLancamento] = useState('');
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [peso, setPeso] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(''); // Novo estado para erros do formulário

  const [opcoesArea, setOpcoesArea] = useState([]);
  const [opcoesTipoResiduo, setOpcoesTipoResiduo] = useState([]);

  const pesoInputRef = useRef(null); // Ref para o campo de peso

  useEffect(() => {
    // console.log('WASTEFORM - useEffect acionado por clienteSelecionado:', clienteSelecionado);

    if (clienteSelecionado) {
      const areasCliente = Array.isArray(clienteSelecionado.areasPersonalizadas) ? clienteSelecionado.areasPersonalizadas.filter(a => a && a.trim() !== '') : [];
      setOpcoesArea(areasCliente);
      setAreaLancamento('');

      let tiposResiduoDisponiveis = [];
      const categoriasPrincipais = (Array.isArray(clienteSelecionado.categoriasPrincipaisResiduo)
                                      ? clienteSelecionado.categoriasPrincipaisResiduo
                                      : []).filter(cat => cat && cat.trim() !== '');

      const tiposPersonalizadosCliente = (Array.isArray(clienteSelecionado.tiposReciclaveisPersonalizados)
                                      ? clienteSelecionado.tiposReciclaveisPersonalizados
                                      : []).filter(sub => sub && sub.trim() !== '');

      // console.log('WASTEFORM - Cliente tem fazSeparacaoReciclaveisCompleta:', clienteSelecionado.fazSeparacaoReciclaveisCompleta);
      // console.log('WASTEFORM - Cliente categoriasPrincipaisResiduo (limpas):', categoriasPrincipais);
      // console.log('WASTEFORM - Cliente tiposReciclaveisPersonalizados (limpos):', tiposPersonalizadosCliente);

      tiposResiduoDisponiveis = [...categoriasPrincipais];

      if (clienteSelecionado.fazSeparacaoReciclaveisCompleta) {
        let subtiposParaAdicionar = tiposPersonalizadosCliente;
        if (tiposPersonalizadosCliente.length === 0) {
          subtiposParaAdicionar = SUBTIPOS_RECICLAVEIS_FALLBACK;
          // console.log('WASTEFORM - Usando SUBTIPOS_RECICLAVEIS_FALLBACK para detalhamento.');
        }
        tiposResiduoDisponiveis = [...new Set([...tiposResiduoDisponiveis, ...subtiposParaAdicionar])];
        // console.log('WASTEFORM - Gerou COM detalhamento (principais + subtipos/fallback):', tiposResiduoDisponiveis);
      } else {
        // console.log('WASTEFORM - Gerou SEM detalhamento (apenas principais):', tiposResiduoDisponiveis);
      }

      setOpcoesTipoResiduo(tiposResiduoDisponiveis.filter(tipo => tipo && tipo.trim() !== ''));
      setSelectedWasteType('');

    } else {
      // console.log('WASTEFORM - Nenhum cliente selecionado, limpando opções.');
      setOpcoesArea([]);
      setAreaLancamento('');
      setOpcoesTipoResiduo([]);
      setSelectedWasteType('');
    }
    setFormError(''); // Limpa erros ao mudar de cliente
  }, [clienteSelecionado]);

  const clearErrorAfterDelay = () => {
    setTimeout(() => {
      setFormError('');
    }, 3000); // Limpa o erro após 3 segundos
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); // Limpa erros anteriores

    if (!selectedWasteType) {
      setFormError('Por favor, selecione um tipo de resíduo.');
      clearErrorAfterDelay();
      return;
    }
    if (!areaLancamento && opcoesArea.length > 0) {
      setFormError('Por favor, selecione uma área de lançamento.');
      clearErrorAfterDelay();
      return;
    }

    const pesoString = String(peso).replace(',', '.');
    const parsedPeso = parseFloat(pesoString);
    if (isNaN(parsedPeso) || parsedPeso <= 0) {
      setFormError('Por favor, insira um peso válido.');
      clearErrorAfterDelay();
      return;
    }

    setSubmitting(true);
    const success = await onAddWaste({
      areaLancamento: areaLancamento || (opcoesArea.length === 0 ? "Geral" : "Não especificada"),
      wasteType: selectedWasteType,
      peso: parsedPeso,
    });

    if (success) {
      setSelectedWasteType('');
      setAreaLancamento('');
      setPeso('');
      setFormError(''); // Garante que não haja erros após sucesso
      if (pesoInputRef.current) { // Tenta focar no campo de peso novamente para facilitar múltiplos lançamentos
        pesoInputRef.current.focus();
      }
    } else {
      // Se onAddWaste retornar false, pode indicar um erro no servidor
      // A PaginaLancamento já mostra uma mensagem global via showMessage
      // Mas podemos adicionar um erro local se necessário, embora possa ser redundante.
      // setFormError('Falha ao registrar. Verifique a mensagem acima.');
      // clearErrorAfterDelay();
    }
    setSubmitting(false);
  };

  const handlePesoKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Previne o comportamento padrão do Enter (que poderia ser submeter o formulário de forma inesperada)
      if (pesoInputRef.current) {
        pesoInputRef.current.blur(); // Remove o foco do campo, o que deve fechar o teclado
      }
      // Opcional: se quiser que o Enter no campo de peso também tente submeter o formulário:
      // handleSubmit(new Event('submit', { cancelable: true })); // Simula um evento de submit
      // No entanto, o blur() pode ser suficiente e o usuário pode clicar no botão de registrar.
    }
  };

  const labelStyle = "block text-sm font-medium text-gray-700 text-center text-lg mb-3";

  if (!clienteSelecionado) {
    return <p className="text-center text-gray-500">Selecione um cliente para iniciar o lançamento.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campo de Peso */}
      <div className="text-center">
        <label htmlFor="peso" className="sr-only">Peso Total (kg):</label>
        <div className="flex items-baseline justify-center">
            <input
                ref={pesoInputRef} // Adicionada a ref
                type="text"
                inputMode="decimal" // Sugere teclado numérico/decimal
                id="peso"
                value={peso}
                onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]{0,2}$/.test(val) || val === "") {
                        setPeso(val);
                    }
                    if (formError) setFormError(''); // Limpa erro ao digitar
                }}
                onKeyDown={handlePesoKeyDown} // Adicionado manipulador de Enter
                required
                placeholder="0,00"
                className="w-auto max-w-[200px] p-2 border-2 border-gray-300 rounded-xl text-7xl font-bold text-center text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            />
            <span className="text-4xl font-semibold text-gray-600 ml-2">kg</span>
        </div>
      </div>

      {/* Botões para Tipo de Resíduo (Dinâmicos) */}
      {opcoesTipoResiduo.length > 0 ? (
        <div>
          <label className={labelStyle}>Tipo de Resíduo*</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {opcoesTipoResiduo.map((tipo) => (
              <button
                key={`type-${tipo}`}
                type="button"
                onClick={() => {
                  setSelectedWasteType(tipo);
                  if (formError) setFormError(''); // Limpa erro ao selecionar
                }}
                className={`
                    flex items-center justify-center w-full p-4 border-2 rounded-xl
                    text-base font-semibold transition-all duration-150 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${selectedWasteType === tipo
                        ? 'bg-indigo-600 text-white border-indigo-600 ring-indigo-500 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }
                `}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">Este cliente não possui tipos de resíduo válidos configurados para lançamento.</p>
      )}

      {/* Botões para Área de Lançamento (Dinâmicos) */}
      {opcoesArea.length > 0 ? (
        <div>
          <label className={labelStyle}>Área de Lançamento*</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {opcoesArea.map((areaOption) => (
              <button
                key={`area-${areaOption}`}
                type="button"
                onClick={() => {
                  setAreaLancamento(areaOption);
                  if (formError) setFormError(''); // Limpa erro ao selecionar
                }}
                className={`
                    flex items-center justify-center w-full p-4 border-2 rounded-xl
                    text-base font-semibold transition-all duration-150 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${areaLancamento === areaOption
                        ? 'bg-indigo-600 text-white border-indigo-600 ring-indigo-500 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }
                `}
              >
                {areaOption}
              </button>
            ))}
          </div>
        </div>
      ) : clienteSelecionado && (!clienteSelecionado.areasPersonalizadas || clienteSelecionado.areasPersonalizadas.length === 0) ? (
         <p className="text-center text-sm text-gray-500 mt-4">Este cliente não possui áreas de lançamento configuradas. O lançamento será registado como área "Geral".</p>
      ) : null}


      {/* Área de Mensagem de Erro do Formulário */}
      {formError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
          {formError}
        </div>
      )}

      {/* Botão de Submissão */}
      <div className="pt-2">
        <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-4 px-6 rounded-xl shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
            disabled={submitting || !selectedWasteType || (!areaLancamento && opcoesArea.length > 0) || !peso }
        >
            {submitting ? 'A Registar...' : 'Registar Pesagem'}
        </button>
      </div>
    </form>
  );
}
