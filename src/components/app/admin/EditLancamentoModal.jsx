import React, { useState, useEffect, useMemo } from 'react';

export default function EditLancamentoModal({ isOpen, onClose, onSave, lancamento, cliente }) {
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});

  // Deriva as opções dos dropdowns a partir dos dados do cliente
  const areaOptions = useMemo(() => cliente?.areasPersonalizadas || [], [cliente]);
  const wasteTypeOptions = useMemo(() => cliente?.categoriasPrincipaisResiduo || [], [cliente]);
  const wasteSubTypeOptions = useMemo(() => {
    if (!cliente || !formData.wasteType) return [];
    if (formData.wasteType === 'Reciclável') {
      return cliente.tiposReciclaveisPersonalizados || [];
    }
    if (formData.wasteType === 'Orgânico') {
      return cliente.tiposOrganicosPersonalizados || [];
    }
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

  if (!isOpen || !lancamento) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Se o tipo de resíduo mudar, reseta o subtipo para evitar inconsistência
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
              <div>
                <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700">Data e Hora</label>
                <input type="datetime-local" id="timestamp" name="timestamp" value={formData.timestamp || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
              </div>
              
              {/* Campo Área de Lançamento como Dropdown */}
              <div>
                <label htmlFor="areaLancamento" className="block text-sm font-medium text-gray-700">Área de Lançamento</label>
                <select id="areaLancamento" name="areaLancamento" value={formData.areaLancamento || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="">Selecione...</option>
                    {areaOptions.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
              </div>

              {/* Campo Tipo de Resíduo como Dropdown */}
               <div>
                <label htmlFor="wasteType" className="block text-sm font-medium text-gray-700">Tipo de Resíduo</label>
                <select id="wasteType" name="wasteType" value={formData.wasteType || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="">Selecione...</option>
                    {wasteTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              {/* Campo Subtipo de Resíduo como Dropdown condicional */}
              {wasteSubTypeOptions.length > 0 && (
                <div>
                  <label htmlFor="wasteSubType" className="block text-sm font-medium text-gray-700">Subtipo de Resíduo</label>
                  <select id="wasteSubType" name="wasteSubType" value={formData.wasteSubType || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm">
                      <option value="">Selecione...</option>
                      {wasteSubTypeOptions.map(subType => <option key={subType} value={subType}>{subType}</option>)}
                  </select>
                </div>
              )}
               
               <div>
                <label htmlFor="peso" className="block text-sm font-medium text-gray-700">Peso (kg)</label>
                <input type="text" id="peso" name="peso" value={formData.peso || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
                Cancelar
              </button>
              <button type="submit" disabled={!hasChanges} className="px-4 py-2 bg-blue-coral text-white rounded-md hover:opacity-90 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
                Salvar Alterações
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}