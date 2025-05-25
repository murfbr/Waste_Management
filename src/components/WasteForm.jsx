// src/components/WasteForm.jsx

import React, { useState, useEffect } from 'react';

// Lista de fallback para subtipos de recicláveis se o cliente não tiver definido os seus próprios
const SUBTIPOS_RECICLAVEIS_FALLBACK = ["Papel", "Vidro", "Metal", "Plástico", "Baterias", "Eletrônicos"];


export default function WasteForm({ onAddWaste, clienteSelecionado }) {
  const [areaLancamento, setAreaLancamento] = useState('');
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [peso, setPeso] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [opcoesArea, setOpcoesArea] = useState([]);
  const [opcoesTipoResiduo, setOpcoesTipoResiduo] = useState([]);

  useEffect(() => {
    console.log('WASTEFORM - useEffect acionado por clienteSelecionado:', clienteSelecionado);

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

      console.log('WASTEFORM - Cliente tem fazSeparacaoReciclaveisCompleta:', clienteSelecionado.fazSeparacaoReciclaveisCompleta);
      console.log('WASTEFORM - Cliente categoriasPrincipaisResiduo (limpas):', categoriasPrincipais);
      console.log('WASTEFORM - Cliente tiposReciclaveisPersonalizados (limpos):', tiposPersonalizadosCliente);

      // Inicia com as categorias principais do cliente
      tiposResiduoDisponiveis = [...categoriasPrincipais];

      if (clienteSelecionado.fazSeparacaoReciclaveisCompleta) {
        let subtiposParaAdicionar = tiposPersonalizadosCliente;
        if (tiposPersonalizadosCliente.length === 0) {
          // Se não há subtipos personalizados, mas ele detalha, usamos o fallback
          subtiposParaAdicionar = SUBTIPOS_RECICLAVEIS_FALLBACK;
          console.log('WASTEFORM - Usando SUBTIPOS_RECICLAVEIS_FALLBACK para detalhamento.');
        }
        // Adiciona os subtipos à lista, garantindo que não haja duplicados
        tiposResiduoDisponiveis = [...new Set([...tiposResiduoDisponiveis, ...subtiposParaAdicionar])];
        console.log('WASTEFORM - Gerou COM detalhamento (principais + subtipos/fallback):', tiposResiduoDisponiveis);
      } else { 
        // Se não detalha recicláveis, tiposResiduoDisponiveis já contém apenas as categoriasPrincipais
        console.log('WASTEFORM - Gerou SEM detalhamento (apenas principais):', tiposResiduoDisponiveis);
      }
      
      setOpcoesTipoResiduo(tiposResiduoDisponiveis.filter(tipo => tipo && tipo.trim() !== ''));
      setSelectedWasteType(''); 

    } else {
      console.log('WASTEFORM - Nenhum cliente selecionado, limpando opções.');
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
    if (!areaLancamento && opcoesArea.length > 0) {
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
      areaLancamento: areaLancamento || (opcoesArea.length === 0 ? "Geral" : "Não especificada"),
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
                key={`type-${tipo}`}
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
                onClick={() => setAreaLancamento(areaOption)}
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
