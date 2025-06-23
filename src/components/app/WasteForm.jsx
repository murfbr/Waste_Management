// src/components/WasteForm.jsx

import React, { useState, useEffect, useRef } from 'react';

// Lista de fallback para subtipos de recicláveis se o cliente não tiver definido os seus próprios
const SUBTIPOS_RECICLAVEIS_FALLBACK = ["Papel", "Vidro", "Metal", "Plástico", "Baterias", "Eletrônicos"];

// OBJETO DE CONFIGURAÇÃO DE CORES - Fácil de editar
const wasteTypeColors = {
    // Cores Principais
    'Reciclável':   { bg: '#007bff', text: '#FFFFFF' }, // Um azul mais moderno que o padrão
    'Orgânico':     { bg: '#A52A2A', text: '#FFFFFF' },
    'Rejeito':      { bg: '#808080', text: '#FFFFFF' },
    'Não Reciclável': { bg: '#808080', text: '#FFFFFF' }, // Mapeado para cinza também
    
    // Sub-tipos Recicláveis
    'Papel':        { bg: '#0000FF', text: '#FFFFFF' },
    'Papel/Papelão':{ bg: '#0000FF', text: '#FFFFFF' },
    'Plástico':     { bg: '#FF0000', text: '#FFFFFF' },
    'Vidro':        { bg: '#008000', text: '#FFFFFF' },
    'Metal':        { bg: '#FFFF00', text: '#000000' }, // Texto preto para melhor leitura
    
    // Outros
    'Madeira':      { bg: '#000000', text: '#FFFFFF' },
    'Perigosos':    { bg: '#FFA500', text: '#FFFFFF' },
    'Baterias':     { bg: '#FFA500', text: '#FFFFFF' }, // Mapeado para laranja
    'Eletrônicos':  { bg: '#333333', text: '#FFFFFF' }, // Um cinza escuro para eletrônicos

    // Cor padrão para tipos não mapeados
    'default':      { bg: '#6b7280', text: '#FFFFFF' }
};

export default function WasteForm({ onAddWaste, clienteSelecionado }) {
  const [areaLancamento, setAreaLancamento] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [peso, setPeso] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(''); 

  const [opcoesArea, setOpcoesArea] = useState([]);
  const [opcoesTipoResiduo, setOpcoesTipoResiduo] = useState([]);
  const [opcoesSubtipoReciclavel, setOpcoesSubtipoReciclavel] = useState([]);

  const pesoInputRef = useRef(null);

  useEffect(() => {
    if (clienteSelecionado) {
      const areasCliente = Array.isArray(clienteSelecionado.areasPersonalizadas) ? clienteSelecionado.areasPersonalizadas.filter(a => a && a.trim() !== '') : [];
      setOpcoesArea(areasCliente);

      const categoriasPrincipais = (Array.isArray(clienteSelecionado.categoriasPrincipaisResiduo)
                                      ? clienteSelecionado.categoriasPrincipaisResiduo
                                      : []).filter(cat => cat && cat.trim() !== '');
      setOpcoesTipoResiduo(categoriasPrincipais);

      if (clienteSelecionado.fazSeparacaoReciclaveisCompleta && categoriasPrincipais.includes('Reciclável')) {
        let subtiposParaUsar = (Array.isArray(clienteSelecionado.tiposReciclaveisPersonalizados)
                                  ? clienteSelecionado.tiposReciclaveisPersonalizados
                                  : []).filter(sub => sub && sub.trim() !== '');
        if (subtiposParaUsar.length === 0) {
          subtiposParaUsar = SUBTIPOS_RECICLAVEIS_FALLBACK;
        }
        setOpcoesSubtipoReciclavel(subtiposParaUsar);
      } else {
        setOpcoesSubtipoReciclavel([]);
      }
      
      setAreaLancamento('');
      setSelectedMainCategory('');
      setSelectedSubType('');
      setFormError('');
      setPeso('');

    } else {
      setOpcoesArea([]);
      setOpcoesTipoResiduo([]);
      setOpcoesSubtipoReciclavel([]);
      setAreaLancamento('');
      setSelectedMainCategory('');
      setSelectedSubType('');
      setFormError('');
      setPeso('');
    }
  }, [clienteSelecionado]);

  const clearErrorAfterDelay = () => {
    setTimeout(() => { setFormError(''); }, 3000);
  };
  
  const handleSelectMainCategory = (categoria) => {
    if (selectedMainCategory === categoria) {
        setSelectedMainCategory('');
        setSelectedSubType('');
    } else {
        setSelectedMainCategory(categoria);
        setSelectedSubType('');
    }
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); 

    if (!selectedMainCategory) {
      setFormError('Por favor, selecione um tipo de resíduo.');
      clearErrorAfterDelay();
      return;
    }
    if (selectedMainCategory === 'Reciclável' && opcoesSubtipoReciclavel.length > 0 && !selectedSubType) {
      setFormError('Por favor, especifique o tipo de reciclável.');
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
    const formData = {
      areaLancamento: areaLancamento || (opcoesArea.length === 0 ? "Geral" : "Não especificada"),
      wasteType: selectedMainCategory,
      peso: parsedPeso,
    };
    if (selectedMainCategory === 'Reciclável' && selectedSubType) {
      formData.wasteSubType = selectedSubType;
    }

    const success = await onAddWaste(formData);

    if (success) {
      setSelectedMainCategory('');
      setSelectedSubType('');
      setAreaLancamento('');
      setPeso('');
      setFormError(''); 
      if (pesoInputRef.current) { 
        pesoInputRef.current.focus();
      }
    }
    setSubmitting(false);
  };

  const handlePesoKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (pesoInputRef.current) {
        pesoInputRef.current.blur();
      }
    }
  };

  // Função para gerar o estilo do botão dinamicamente
  const getButtonStyles = (type, isSelected) => {
    const colorTheme = wasteTypeColors[type] || wasteTypeColors['default'];
    
    // Converte a cor HEX para RGB para poder aplicar opacidade
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    };

    const rgbColor = hexToRgb(colorTheme.bg);

    if (!rgbColor) return {}; // Retorna objeto vazio se a cor for inválida

    if (isSelected) {
        return { 
            backgroundColor: `rgba(${rgbColor}, 1)`, // Opacidade total
            color: colorTheme.text,
            borderColor: `rgba(${rgbColor}, 1)` 
        };
    }
    
    // Estilo padrão com opacidade
    return {
        backgroundColor: `rgba(${rgbColor}, 0.7)`, // Opacidade de 70%
        color: colorTheme.text,
        borderColor: `rgba(${rgbColor}, 0.1)` // Borda sutil
    };
  };

  const labelStyle = "block text-sm font-medium text-gray-700 text-center text-lg mb-3";
  const subLabelStyle = "block text-sm font-medium text-gray-600 text-center text-md mb-3";

  if (!clienteSelecionado) {
    return <p className="text-center text-gray-500">Selecione um cliente para iniciar o lançamento.</p>;
  }
  
  const showSubTypesSection = selectedMainCategory === 'Reciclável' && opcoesSubtipoReciclavel.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campo de Peso */}
      <div className="text-center">
        <label htmlFor="peso" className="sr-only">Peso Total (kg):</label>
        <div className="flex items-baseline justify-center">
            <input
                ref={pesoInputRef} type="text" inputMode="decimal" id="peso" value={peso}
                onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]{0,2}$/.test(val) || val === "") { setPeso(val); }
                    if (formError) setFormError('');
                }}
                onKeyDown={handlePesoKeyDown} required placeholder="0,00"
                className="w-auto max-w-[200px] p-2 border-2 border-gray-300 rounded-xl text-7xl font-bold text-center text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            />
            <span className="text-4xl font-semibold text-gray-600 ml-2">kg</span>
        </div>
      </div>

      {/* Seção de Tipos de Resíduo */}
      {opcoesTipoResiduo.length > 0 ? (
        <div>
          <label className={labelStyle}>Tipo de Resíduo*</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {opcoesTipoResiduo.map((tipo) => (
              <button
                key={`type-${tipo}`} type="button" onClick={() => handleSelectMainCategory(tipo)}
                style={getButtonStyles(tipo, selectedMainCategory === tipo)}
                className={`flex items-center justify-center w-full p-4 border-2 rounded-xl text-base font-bold transition-all duration-200 ease-in-out focus:outline-none ring-2 ring-offset-2 
                    ${selectedMainCategory === tipo 
                        ? 'ring-gray-800 shadow-lg' 
                        : 'ring-transparent hover:scale-105 hover:shadow-md'
                    }`}
              >
                {tipo}
              </button>
            ))}
          </div>

          {showSubTypesSection && (
             <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-300">
              <label className={subLabelStyle}>Especifique o Reciclável*</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {opcoesSubtipoReciclavel.map((subtipo) => (
                  <button
                    key={`subtype-${subtipo}`} type="button" onClick={() => setSelectedSubType(subtipo)}
                    style={getButtonStyles(subtipo, selectedSubType === subtipo)}
                    className={`flex items-center justify-center w-full p-4 border-2 rounded-xl text-base font-bold transition-all duration-200 ease-in-out focus:outline-none ring-2 ring-offset-2
                        ${selectedSubType === subtipo
                            ? 'ring-gray-800 shadow-lg'
                            : 'ring-transparent hover:scale-105 hover:shadow-md'
                        }`}
                  >
                    {subtipo}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500">Este cliente não possui tipos de resíduo válidos para lançamento.</p>
      )}

      {/* Seção de Áreas de Lançamento */}
      {opcoesArea.length > 0 && (
        <div>
          <label className={labelStyle}>Área de Lançamento*</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {opcoesArea.map((areaOption) => (
              <button
                key={`area-${areaOption}`} type="button"
                onClick={() => { setAreaLancamento(areaOption); if (formError) setFormError(''); }}
                className={`flex items-center justify-center w-full p-4 border-2 rounded-xl text-base font-semibold transition-all duration-150 ease-in-out focus:outline-none ring-2 ring-offset-2
                    ${areaLancamento === areaOption
                        ? 'bg-teal-600 text-white border-teal-600 ring-teal-500 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
              >
                {areaOption}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem de Erro e Botão de Submissão */}
      {formError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
          {formError}
        </div>
      )}
      <div className="pt-2">
        <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-4 px-6 rounded-xl shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
            disabled={submitting || !peso || !selectedMainCategory || (!areaLancamento && opcoesArea.length > 0) || (showSubTypesSection && !selectedSubType)}
        >
            {submitting ? 'A Registar...' : 'Registar Pesagem'}
        </button>
      </div>
    </form>
  );
}
