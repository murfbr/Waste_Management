// EditLancamentoModal.jsx

import React, { useState, useEffect, useMemo, useContext } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import AuthContext from '../../../context/AuthContext'; // Certifique-se que o caminho para seu AuthContext está correto

export default function EditLancamentoModal({ isOpen, onClose, onSave, lancamento, cliente }) {
  const { db } = useContext(AuthContext);

  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  
  const [empresasColeta, setEmpresasColeta] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  // --- LÓGICA DE OPÇÕES DINÂMICAS ---

  const areaOptions = useMemo(() => cliente?.areasPersonalizadas || [], [cliente]);
  const wasteTypeOptions = useMemo(() => cliente?.categoriasPrincipaisResiduo || [], [cliente]);
  
  const wasteSubTypeOptions = useMemo(() => {
    if (!cliente || !formData.wasteType) return [];
    if (formData.wasteType === 'Reciclável') return cliente.tiposReciclaveisPersonalizados || [];
    if (formData.wasteType === 'Orgânico') return cliente.tiposOrganicosPersonalizados || [];
    return [];
  }, [cliente, formData.wasteType]);

  // NOVO: Memoiza as opções de destinação com base na empresa e tipo de resíduo selecionados
  const destinacaoOptions = useMemo(() => {
    if (!formData.empresaColetaId || !formData.wasteType || !empresasColeta.length) {
      return [];
    }
    const selectedEmpresa = empresasColeta.find(emp => emp.id === formData.empresaColetaId);
    if (!selectedEmpresa || !selectedEmpresa.destinacoes) {
      return [];
    }
    return selectedEmpresa.destinacoes[formData.wasteType] || [];
  }, [formData.empresaColetaId, formData.wasteType, empresasColeta]);


  // --- EFEITOS (useEffect) ---

  useEffect(() => {
    if (lancamento) {
      const localDateTime = new Date(lancamento.timestamp - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      const data = { ...lancamento, timestamp: localDateTime };
      setFormData(data);
      setOriginalData(data);
    }
  }, [lancamento]);

  useEffect(() => {
    if (isOpen && db) {
      const fetchEmpresasColeta = async () => {
        setLoadingEmpresas(true);
        try {
          const q = query(collection(db, 'empresasColeta'));
          const querySnapshot = await getDocs(q);
          const empresas = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setEmpresasColeta(empresas);
        } catch (error) {
          console.error("Erro ao buscar empresas de coleta:", error);
          alert('Falha ao carregar os dados das empresas de coleta.');
        } finally {
          setLoadingEmpresas(false);
        }
      };
      fetchEmpresasColeta();
    }
  }, [isOpen, db]);

  // --- MANIPULADORES DE EVENTOS ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Se o tipo de resíduo for alterado, recalcula a empresa e destino padrão
    if (name === 'wasteType') {
        const contratoAplicavel = (cliente.contratosColeta || []).find(c => 
            c.tiposResiduoColetados?.includes(value)
        );

        let defaultEmpresaId = '';
        let defaultEmpresaNome = null;
        let defaultDestinacao = '';

        if (contratoAplicavel) {
            const empresa = empresasColeta.find(emp => emp.id === contratoAplicavel.empresaColetaId);
            if (empresa) {
                defaultEmpresaId = empresa.id;
                defaultEmpresaNome = empresa.nomeFantasia;
                const destinacoesPossiveis = empresa.destinacoes?.[value] || [];
                if (destinacoesPossiveis.length > 0) {
                    defaultDestinacao = destinacoesPossiveis[0];
                }
            }
        }
        
        setFormData(prev => ({
            ...prev,
            wasteType: value,
            wasteSubType: '', // Reseta o subtipo
            empresaColetaId: defaultEmpresaId,
            empresaColetaNome: defaultEmpresaNome,
            destinacaoFinal: defaultDestinacao,
        }));

    // Se a empresa de coleta for alterada manualmente, reseta a destinação
    } else if (name === 'empresaColetaId') {
        const selectedEmpresa = empresasColeta.find(emp => emp.id === value);
        setFormData(prev => ({
            ...prev,
            empresaColetaId: value,
            empresaColetaNome: selectedEmpresa?.nomeFantasia || null,
            destinacaoFinal: '', // Força o usuário a escolher uma nova destinação válida
        }));
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

  if (!isOpen || !lancamento) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 font-comfortaa">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 font-lexend">Editar Lançamento</h2>
          <p className="text-sm text-gray-500">ID: {lancamento.id}</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Campos de formulário */}
              <div><label htmlFor="timestamp" className="block text-sm font-medium text-gray-700">Data e Hora</label><input type="datetime-local" id="timestamp" name="timestamp" value={formData.timestamp || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/></div>
              <div><label htmlFor="areaLancamento" className="block text-sm font-medium text-gray-700">Área de Lançamento</label><select id="areaLancamento" name="areaLancamento" value={formData.areaLancamento || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"><option value="">Selecione...</option>{areaOptions.map(area => <option key={area} value={area}>{area}</option>)}</select></div>
              <div><label htmlFor="wasteType" className="block text-sm font-medium text-gray-700">Tipo de Resíduo</label><select id="wasteType" name="wasteType" value={formData.wasteType || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"><option value="">Selecione...</option>{wasteTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
              {wasteSubTypeOptions.length > 0 && (<div><label htmlFor="wasteSubType" className="block text-sm font-medium text-gray-700">Subtipo de Resíduo</label><select id="wasteSubType" name="wasteSubType" value={formData.wasteSubType || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"><option value="">Selecione...</option>{wasteSubTypeOptions.map(subType => <option key={subType} value={subType}>{subType}</option>)}</select></div>)}
              <div><label htmlFor="peso" className="block text-sm font-medium text-gray-700">Peso (kg)</label><input type="text" id="peso" name="peso" value={formData.peso || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"/></div>
              
              {/* --- ALTERAÇÃO: Campos de Coleta e Destinação agora são selecionáveis --- */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                  <div>
                      <label htmlFor="empresaColetaId" className="block text-sm font-medium text-gray-700">Empresa de Coleta</label>
                      <select 
                        id="empresaColetaId" 
                        name="empresaColetaId" 
                        value={formData.empresaColetaId || ''} 
                        onChange={handleChange} 
                        disabled={loadingEmpresas}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                      >
                        <option value="">{loadingEmpresas ? 'Carregando...' : 'Selecione uma empresa'}</option>
                        {empresasColeta.map(empresa => (
                            <option key={empresa.id} value={empresa.id}>{empresa.nomeFantasia}</option>
                        ))}
                      </select>
                  </div>
                   <div className="mt-2">
                      <label htmlFor="destinacaoFinal" className="block text-sm font-medium text-gray-700">Destinação Final</label>
                      <select 
                        id="destinacaoFinal" 
                        name="destinacaoFinal" 
                        value={formData.destinacaoFinal || ''} 
                        onChange={handleChange} 
                        disabled={!formData.empresaColetaId || destinacaoOptions.length === 0}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                      >
                          <option value="">Selecione uma destinação</option>
                          {destinacaoOptions.map(dest => (
                            <option key={dest} value={dest}>{dest}</option>
                          ))}
                      </select>
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