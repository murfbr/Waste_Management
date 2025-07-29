// src/components/app/WasteForm.jsx

import React, { useState, useEffect, useRef, useContext } from 'react';
import AuthContext from '../../context/AuthContext'; 
import { addPendingRecord } from '../../services/offlineSyncService';

const SUBTIPOS_RECICLAVEIS_FALLBACK = ["Papel", "Vidro", "Metal", "Plástico", "Baterias", "Eletrônicos"];
const SUBTIPOS_ORGANICOS_FALLBACK = ["Pré-serviço", "Pós-serviço"];

const wasteTypeColors = {
    'Reciclável':   { bg: '#3f7fff', text: '#FFFFFF' },
    'Orgânico':     { bg: '#704729', text: '#FFFFFF' },
    'Rejeito':      { bg: '#757575', text: '#FFFFFF' },
    'Não Reciclável': { bg: '#808080', text: '#FFFFFF' },
    'Papel':        { bg: '#0000FF', text: '#FFFFFF' },
    'Papel/Papelão':{ bg: '#0000FF', text: '#FFFFFF' },
    'Plástico':     { bg: '#FF0000', text: '#FFFFFF' },
    'Vidro':        { bg: '#008000', text: '#FFFFFF' },
    'Metal':        { bg: '#FFFF00', text: '#000000' },
    'Madeira':      { bg: '#000000', text: '#FFFFFF' },
    'Perigosos':    { bg: '#FFA500', text: '#FFFFFF' },
    'Baterias':     { bg: '#FFA500', text: '#FFFFFF' },
    'Eletrônicos':  { bg: '#333333', text: '#FFFFFF' },
    'Pré-serviço':  { bg: '#d4a373', text: '#FFFFFF' },
    'Pós-serviço':  { bg: '#6f4e37', text: '#FFFFFF' },
    'default':      { bg: '#6b7280', text: '#FFFFFF' }
};

export default function WasteForm({ clienteSelecionado, onLimitExceeded, onSuccessfulSubmit }) { 
  const { currentUser, appId } = useContext(AuthContext);

  const [areaLancamento, setAreaLancamento] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubType, setSelectedSubType] = useState('');
  const [peso, setPeso] = useState(0); 

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [opcoesArea, setOpcoesArea] = useState([]);
  const [opcoesTipoResiduo, setOpcoesTipoResiduo] = useState([]);
  const [opcoesSubtipoReciclavel, setOpcoesSubtipoReciclavel] = useState([]);
  const [opcoesSubtipoOrganico, setOpcoesSubtipoOrganico] = useState([]);

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
        let subtipos = clienteSelecionado.tiposReciclaveisPersonalizados || [];
        if (subtipos.length === 0) subtipos = SUBTIPOS_RECICLAVEIS_FALLBACK;
        setOpcoesSubtipoReciclavel(subtipos.filter(Boolean));
      } else {
        setOpcoesSubtipoReciclavel([]);
      }

      if (clienteSelecionado.fazSeparacaoOrganicosCompleta && categoriasPrincipais.includes('Orgânico')) {
        let subtipos = clienteSelecionado.tiposOrganicosPersonalizados || [];
        if (subtipos.length === 0) subtipos = SUBTIPOS_ORGANICOS_FALLBACK;
        setOpcoesSubtipoOrganico(subtipos.filter(Boolean));
      } else {
        setOpcoesSubtipoOrganico([]);
      }
      
      setAreaLancamento('');
      setSelectedMainCategory('');
      setSelectedSubType('');
      setFormError('');
      setFormSuccess('');
      setPeso(0);

    } else {
      setOpcoesArea([]);
      setOpcoesTipoResiduo([]);
      setOpcoesSubtipoReciclavel([]);
      setOpcoesSubtipoOrganico([]);
      setAreaLancamento('');
      setSelectedMainCategory('');
      setSelectedSubType('');
      setFormError('');
      setFormSuccess('');
      setPeso(0);
    }
  }, [clienteSelecionado]);

  const formatPesoForDisplay = (valor) => {
    const valorString = String(valor).padStart(3, '0');
    const inteiro = valorString.slice(0, -2);
    const decimal = valorString.slice(-2);
    return `${inteiro},${decimal}`;
  };

  const clearMessagesAfterDelay = () => {
    setTimeout(() => { 
        setFormError(''); 
        setFormSuccess('');
    }, 4000);
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
    if (formSuccess) setFormSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); 
    setFormSuccess('');

    if (!selectedMainCategory) {
      setFormError('Por favor, selecione um tipo de resíduo.');
      clearMessagesAfterDelay();
      return;
    }
    if (selectedMainCategory === 'Reciclável' && opcoesSubtipoReciclavel.length > 0 && !selectedSubType) {
      setFormError('Por favor, especifique o tipo de reciclável.');
      clearMessagesAfterDelay();
      return;
    }
    if (selectedMainCategory === 'Orgânico' && opcoesSubtipoOrganico.length > 0 && !selectedSubType) {
      setFormError('Por favor, especifique o tipo de orgânico.');
      clearMessagesAfterDelay();
      return;
    }
    if (!areaLancamento && opcoesArea.length > 0) {
      setFormError('Por favor, selecione uma área de lançamento.');
      clearMessagesAfterDelay();
      return;
    }
    
    const parsedPeso = peso / 100;
    if (isNaN(parsedPeso) || parsedPeso <= 0) {
      setFormError('Por favor, insira um peso válido.');
      clearMessagesAfterDelay();
      return;
    }

    setSubmitting(true);

    const contratoAplicavel = (clienteSelecionado.contratosColeta || []).find(c => 
        c.tiposResiduoColetados?.includes(selectedMainCategory)
    );

    const recordData = {
      areaLancamento: areaLancamento || (opcoesArea.length === 0 ? "Geral" : "Não especificada"),
      wasteType: selectedMainCategory,
      peso: parsedPeso,
      clienteId: clienteSelecionado.id,
      empresaColetaId: contratoAplicavel?.empresaColetaId || null,
      timestamp: Date.now(),
      userId: currentUser.uid,
      userEmail: currentUser.email,
      appId: appId || 'default-app-id'
    };

    let categoriaParaVerificarLimite = selectedMainCategory;
    let tipoParaExibir = selectedMainCategory;

    if (selectedSubType) {
      recordData.wasteSubType = selectedSubType;
      tipoParaExibir = `${selectedMainCategory} (${selectedSubType})`;
      categoriaParaVerificarLimite = selectedMainCategory;
    }

    const limites = clienteSelecionado.limitesPorResiduo || {};
    const limiteDaCategoria = limites[categoriaParaVerificarLimite] || 0;

    if (limiteDaCategoria > 0 && parsedPeso > limiteDaCategoria) {
        onLimitExceeded({
            ...recordData,
            wasteType: tipoParaExibir,
            limite: limiteDaCategoria,
        });
        setSubmitting(false);
        return;
    }
    
    const result = await addPendingRecord(recordData);

    if (result.success) {
      setFormSuccess(result.message);
      if (onSuccessfulSubmit) onSuccessfulSubmit();
      
      setSelectedMainCategory('');
      setSelectedSubType('');
      setAreaLancamento('');
      setPeso(0);
      if (pesoInputRef.current) { 
        pesoInputRef.current.focus();
      }
    } else {
      setFormError(result.message);
    }
    
    setSubmitting(false);
    clearMessagesAfterDelay();
  };

  const handlePesoKeyDown = (e) => {
    e.preventDefault();
    
    if (formError) setFormError('');
    if (formSuccess) setFormSuccess('');

    const key = e.key;

    if (!isNaN(key) && key !== ' ') {
        const numero = parseInt(key, 10);
        setPeso(prev => (prev * 10 + numero) % 1000000); 
    } 
    else if (key === 'Backspace') {
        setPeso(prev => Math.floor(prev / 10));
    }
    else if (key === 'Enter') {
        handleSubmit(e);
    }
  };

  const getButtonStyles = (type, isSelected) => {
    const colorTheme = wasteTypeColors[type] || wasteTypeColors['default'];
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    };
    const rgbColor = hexToRgb(colorTheme.bg);
    if (!rgbColor) return {};
    if (isSelected) {
        return { 
            backgroundColor: `rgba(${rgbColor}, 1)`,
            color: colorTheme.text,
            borderColor: `rgba(${rgbColor}, 1)` 
        };
    }
    return {
        backgroundColor: `rgba(${rgbColor}, 0.7)`,
        color: colorTheme.text,
        borderColor: `rgba(${rgbColor}, 0.1)`
    };
  };

  const labelStyle = "block text-sm font-medium text-gray-700 text-center text-lg mb-3";
  const subLabelStyle = "block text-sm font-medium text-gray-600 text-center text-md mb-3";

  if (!clienteSelecionado) {
    return <p className="text-center text-gray-500">Selecione um cliente para iniciar o lançamento.</p>;
  }
  
  const showRecyclableSubTypes = selectedMainCategory === 'Reciclável' && opcoesSubtipoReciclavel.length > 0;
  const showOrganicSubTypes = selectedMainCategory === 'Orgânico' && opcoesSubtipoOrganico.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <label htmlFor="peso" className="sr-only">Peso Total (kg):</label>
        <div className="flex items-baseline justify-center">
            <input
                ref={pesoInputRef} 
                type="text" 
                inputMode="numeric" 
                id="peso" 
                value={formatPesoForDisplay(peso)}
                onKeyDown={handlePesoKeyDown}
                className="w-auto max-w-[200px] p-2 border-2 border-gray-300 rounded-xl text-7xl font-bold text-center text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            />
            <span className="text-4xl font-semibold text-gray-600 ml-2">kg</span>
        </div>
      </div>

      {opcoesTipoResiduo.length > 0 ? (
        <div>
          <label className={labelStyle}>Tipo de Resíduo*</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {opcoesTipoResiduo.map((tipo) => (
              <button
                key={`type-${tipo}`} type="button" onClick={() => handleSelectMainCategory(tipo)}
                style={getButtonStyles(tipo, selectedMainCategory === tipo)}
                className={`relative flex items-center justify-center w-full p-4 border-2 rounded-xl text-base font-bold transition-all duration-200 ease-in-out focus:outline-none ring-2 ring-offset-2 
                    ${selectedMainCategory === tipo 
                        ? 'ring-gray-800 shadow-lg' 
                        : 'ring-transparent hover:scale-[1.02] hover:shadow-md hover:z-10'
                    }`}
              >
                {tipo}
              </button>
            ))}
          </div>

          {showRecyclableSubTypes && (
             <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className={subLabelStyle}>Especifique o Reciclável*</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {opcoesSubtipoReciclavel.map((subtipo) => (
                  <button
                    key={`subtype-${subtipo}`} type="button" onClick={() => setSelectedSubType(subtipo)}
                    style={getButtonStyles(subtipo, selectedSubType === subtipo)}
                    className={`relative flex items-center justify-center w-full p-4 border-2 rounded-xl text-base font-bold transition-all duration-200 ease-in-out focus:outline-none ring-2 ring-offset-2
                        ${selectedSubType === subtipo
                            ? 'ring-gray-800 shadow-lg'
                            : 'ring-transparent hover:scale-[1.02] hover:shadow-md hover:z-10'
                        }`}
                  >
                    {subtipo}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showOrganicSubTypes && (
             <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className={subLabelStyle}>Especifique o Orgânico*</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {opcoesSubtipoOrganico.map((subtipo) => (
                  <button
                    key={`subtype-${subtipo}`} type="button" onClick={() => setSelectedSubType(subtipo)}
                    style={getButtonStyles(subtipo, selectedSubType === subtipo)}
                    className={`relative flex items-center justify-center w-full p-4 border-2 rounded-xl text-base font-bold transition-all duration-200 ease-in-out focus:outline-none ring-2 ring-offset-2
                        ${selectedSubType === subtipo
                            ? 'ring-gray-800 shadow-lg'
                            : 'ring-transparent hover:scale-[1.02] hover:shadow-md hover:z-10'
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
        <p className="text-center text-gray-500">Este cliente não possui tipos de resíduo para lançamento.</p>
      )}

      {opcoesArea.length > 0 && (
        <div>
          <label className={labelStyle}>Área da empresa*</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {opcoesArea.map((areaOption) => (
              <button
                key={`area-${areaOption}`} type="button"
                onClick={() => { setAreaLancamento(areaOption); if (formError) setFormError(''); if (formSuccess) setFormSuccess(''); }}
                className={`relative flex items-center justify-center w-full p-4 border-2 rounded-xl text-base font-semibold transition-all duration-150 ease-in-out focus:outline-none
                    ${areaLancamento === areaOption
                        ? 'bg-teal-600 text-white border-teal-600 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:scale-[1.02] hover:z-10'
                    }`}
              >
                {areaOption}
              </button>
            ))}
          </div>
        </div>
      )}

      {formError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
          {formError}
        </div>
      )}
      {formSuccess && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-center">
          {formSuccess}
        </div>
      )}
      <div className="pt-2">
        <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-4 px-6 rounded-xl shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
            disabled={submitting || peso === 0 || !selectedMainCategory || (!areaLancamento && opcoesArea.length > 0) || (showRecyclableSubTypes && !selectedSubType) || (showOrganicSubTypes && !selectedSubType)}
        >
            {submitting ? 'A Registar...' : 'Registar Pesagem'}
        </button>
      </div>
    </form>
  );
}
