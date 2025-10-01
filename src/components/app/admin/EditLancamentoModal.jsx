// EditLancamentoModal.jsx

import React, { useState, useEffect, useMemo } from 'react';

// --- ALTERAÇÃO: Recebe 'empresasColeta' como nova prop ---
export default function EditLancamentoModal({ isOpen, onClose, onSave, lancamento, cliente, empresasColeta }) {
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});

  const areaOptions = useMemo(() => cliente?.areasPersonalizadas || [], [cliente]);
  const wasteTypeOptions = useMemo(() => cliente?.categoriasPrincipaisResiduo || [], [cliente]);
  const wasteSubTypeOptions = useMemo(() => {
    if (!cliente || !formData.wasteType) return [];
    if (formData.wasteType === 'Reciclável') return cliente.tiposReciclaveisPersonalizados || [];
    if (formData.wasteType === 'Orgânico') return cliente.tiposOrganicosPersonalizados || [];
    return [];
  }, [cliente, formData.wasteType]);

  useEffect(() => {
    if (lancamento) {
      const localDateTime = new Date(lancamento.timestamp - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      const data = { ...lancamento, timestamp: localDateTime };
      setFormData(data);
      setOriginalData(data);
    }
  }, [lancamento]);

  // --- NOVO useEffect: Recalcula a destinação quando o tipo de resíduo muda ---
  useEffect(() => {
    if (!formData.wasteType || !cliente || !empresasColeta) {
      return;
    }

    const contratoAplicavel = (cliente.contratosColeta || []).find(c => 
        c.tiposResiduoColetados?.includes(formData.wasteType)
    );

    let empresaColetaCompleta = null;
    let destinacaoFinal = null;

    if (contratoAplicavel) {
      empresaColetaCompleta = empresasColeta.find(emp => emp.id === contratoAplicavel.empresaColetaId);
    }
    
    if (empresaColetaCompleta) {
      const destinacoesPossiveis = empresaColetaCompleta.destinacoes?.[formData.wasteType] || [];
      destinacaoFinal = destinacoesPossiveis.length > 0 ? destinacoesPossiveis[0] : null;
    }

    setFormData(prev => ({
      ...prev,
      empresaColetaId: empresaColetaCompleta?.id || null,
      empresaColetaNome: empresaColetaCompleta?.nomeFantasia || null,
      destinacaoFinal: destinacaoFinal,
    }));

  }, [formData.wasteType, cliente, empresasColeta]);
  // --- FIM DO NOVO useEffect ---

  if (!isOpen || !lancamento) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'wasteType') {
      setFormData(prev => ({ ...prev, wasteType: value, wasteSubType: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSave = () => {
    const timestamp = new Date(formData.timestamp).getTime();
    const pesoAsNumber = parseFloat(String(formData.peso).replace(',', '.'));
    if (isNaN(pesoAsNumber)) {
        alert('O peso deve ser um número válido.');
        return;
    }
    onSave({ ...formData, timestamp, peso: pesoAsNumber });
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 font-comfortaa">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 font-lexend">Editar Lançamento</h2>
          <p className="text-sm text-gray-500">ID: {lancamento.id}</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Campos de formulário existentes... */}
              <div><label htmlFor="timestamp" className="block text-sm font-medium text-gray-700">Data e Hora</label><input type="datetime-local" id="timestamp" name="timestamp" value={formData.timestamp || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/></div>
              <div><label htmlFor="areaLancamento" className="block text-sm font-medium text-gray-700">Área de Lançamento</label><select id="areaLancamento" name="areaLancamento" value={formData.areaLancamento || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"><option value="">Selecione...</option>{areaOptions.map(area => <option key={area} value={area}>{area}</option>)}</select></div>
              <div><label htmlFor="wasteType" className="block text-sm font-medium text-gray-700">Tipo de Resíduo</label><select id="wasteType" name="wasteType" value={formData.wasteType || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"><option value="">Selecione...</option>{wasteTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
              {wasteSubTypeOptions.length > 0 && (<div><label htmlFor="wasteSubType" className="block text-sm font-medium text-gray-700">Subtipo de Resíduo</label><select id="wasteSubType" name="wasteSubType" value={formData.wasteSubType || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"><option value="">Selecione...</option>{wasteSubTypeOptions.map(subType => <option key={subType} value={subType}>{subType}</option>)}</select></div>)}
              <div><label htmlFor="peso" className="block text-sm font-medium text-gray-700">Peso (kg)</label><input type="text" id="peso" name="peso" value={formData.peso || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/></div>
              
              {/* --- NOVO: Campos de exibição para Coleta e Destinação --- */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                  <div>
                      <span className="block text-sm font-medium text-gray-500">Empresa de Coleta (Automático)</span>
                      <p className="mt-1 w-full p-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700">{formData.empresaColetaNome || 'Não definida para este tipo de resíduo'}</p>
                  </div>
                   <div className="mt-2">
                      <span className="block text-sm font-medium text-gray-500">Destinação Final (Automático)</span>
                      <p className="mt-1 w-full p-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700">{formData.destinacaoFinal || 'Não definida para este tipo de resíduo'}</p>
                  </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>
              <button type="submit" disabled={!hasChanges} className="px-4 py-2 bg-blue-coral text-white rounded-md hover:opacity-90 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">Salvar Alterações</button>
            </div>
        </form>
      </div>
    </div>
  );
}