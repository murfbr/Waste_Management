// src/components/WasteForm.jsx

import React, { useState, useEffect } from 'react';

export default function WasteForm({ onAddWaste, clienteSelecionado }) {
  const [areaLancamento, setAreaLancamento] = useState('');
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [peso, setPeso] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [opcoesArea, setOpcoesArea] = useState([]);
  const [opcoesTipoResiduo, setOpcoesTipoResiduo] = useState([]);

  useEffect(() => {
    if (clienteSelecionado) {
      const areasCliente = Array.isArray(clienteSelecionado.areasPersonalizadas) ? clienteSelecionado.areasPersonalizadas.filter(a => a && a.trim() !== '') : [];
      setOpcoesArea(areasCliente);
      // Não seleciona a primeira área por padrão para botões, para forçar uma escolha clara
      setAreaLancamento(''); 

      let tiposResiduoDisponiveis = [];
      if (clienteSelecionado.fazSeparacaoReciclaveisCompleta && Array.isArray(clienteSelecionado.tiposReciclaveisPersonalizados) && clienteSelecionado.tiposReciclaveisPersonalizados.length > 0) {
        const categoriasPrincipaisSemReciclavelDetalhado = (Array.isArray(clienteSelecionado.categoriasPrincipaisResiduo) ? clienteSelecionado.categoriasPrincipaisResiduo : []).filter(
            cat => cat.toLowerCase() !== 'reciclável' && cat.toLowerCase() !== 'reciclaveis'
        );
        tiposResiduoDisponiveis = [...new Set([...categoriasPrincipaisSemReciclavelDetalhado, ...clienteSelecionado.tiposReciclaveisPersonalizados])];
      } else if (Array.isArray(clienteSelecionado.categoriasPrincipaisResiduo)) {
        tiposResiduoDisponiveis = clienteSelecionado.categoriasPrincipaisResiduo;
      }
      
      tiposResiduoDisponiveis = tiposResiduoDisponiveis.filter(tipo => tipo && tipo.trim() !== '');
      setOpcoesTipoResiduo(tiposResiduoDisponiveis);
      setSelectedWasteType('');
    } else {
      setOpcoesArea([]);
      setAreaLancamento('');
      setOpcoesTipoResiduo([]);
      setSelectedWasteType('');
    }
  }, [clienteSelecionado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWasteType) {
      alert('Por favor, selecione um tipo de resíduo.');
      return;
    }
    if (!areaLancamento && opcoesArea.length > 0) { // Só exige área se houver opções e nenhuma selecionada
      alert('Por favor, selecione uma área de lançamento.');
      return;
    }
    
    const pesoString = String(peso).replace(',', '.');
    const parsedPeso = parseFloat(pesoString);
    if (isNaN(parsedPeso) || parsedPeso <= 0) {
      alert('Por favor, insira um peso válido.');
      return;
    }

    setSubmitting(true);
    const success = await onAddWaste({
      areaLancamento: areaLancamento || (opcoesArea.length === 0 ? "Geral" : "Não especificada"), // Se não há opções, pode ser "Geral"
      wasteType: selectedWasteType,
      peso: parsedPeso,
    });

    if (success) {
      setSelectedWasteType('');
      setAreaLancamento(''); 
      setPeso('');
    }
    setSubmitting(false);
  };

  const labelStyle = "block text-sm font-medium text-gray-700 text-center text-lg mb-3"; // Ajustado mb-3 para consistência
  
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
                type="text"
                inputMode="decimal"
                id="peso"
                value={peso}
                onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]{0,2}$/.test(val) || val === "") {
                        setPeso(val);
                    }
                }}
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
                key={`type-${tipo}`} // Adicionado prefixo para evitar conflito de key com áreas
                type="button"
                onClick={() => setSelectedWasteType(tipo)}
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
        <p className="text-center text-gray-500">Este cliente não possui tipos de resíduo configurados para lançamento.</p>
      )}

      {/* Botões para Área de Lançamento (Dinâmicos) */}
      {opcoesArea.length > 0 ? (
        <div>
          <label className={labelStyle}>Área de Lançamento*</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {opcoesArea.map((areaOption) => (
              <button
                key={`area-${areaOption}`} // Adicionado prefixo
                type="button"
                onClick={() => setAreaLancamento(areaOption)}
                className={`
                    flex items-center justify-center w-full p-4 border-2 rounded-xl 
                    text-base font-semibold transition-all duration-150 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${areaLancamento === areaOption
                        ? 'bg-indigo-600 text-white border-indigo-600 ring-indigo-500 shadow-lg' // Estilo selecionado
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400' // Estilo padrão
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
