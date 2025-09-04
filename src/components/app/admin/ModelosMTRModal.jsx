import React, { useState, useEffect, useMemo, useContext } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import AuthContext from '../../../context/AuthContext';
import ConfirmationModal from '../ConfirmationModal';

// Formulário para adicionar ou editar um mapeamento
const MapeamentoForm = ({ cliente, empresasColeta, mapeamentosExistentes, onSave, onCancel, initialData }) => {
  const [parSelecionado, setParSelecionado] = useState('');
  const [numeroModelo, setNumeroModelo] = useState('');
  const [nomeModelo, setNomeModelo] = useState('');

  // Lógica para saber se estamos no modo de edição
  const isEditing = !!initialData;

  // NOVO: useEffect para preencher o formulário ao editar
  useEffect(() => {
    if (isEditing) {
      setParSelecionado(`${initialData.tipoResiduoApp}|${initialData.empresaColetaId}`);
      setNumeroModelo(initialData.numeroModeloInea);
      setNomeModelo(initialData.nomeModeloInea);
    } else {
      // Limpa o formulário se não estiver editando
      setParSelecionado('');
      setNumeroModelo('');
      setNomeModelo('');
    }
  }, [initialData, isEditing]);

  const opcoesDeContrato = useMemo(() => {
    const empresasMap = new Map(empresasColeta.map(e => [e.id, e.nomeFantasia]));
    const contratosAtivos = cliente.contratosColeta || [];
    
    const todosOsPares = contratosAtivos.flatMap(contrato => 
      contrato.tiposResiduoColetados.map(tipo => ({
        value: `${tipo}|${contrato.empresaColetaId}`,
        label: `${tipo} - Coletado por ${empresasMap.get(contrato.empresaColetaId) || 'Desconhecida'}`
      }))
    );

    const paresJaMapeados = new Set(
      mapeamentosExistentes.map(m => `${m.tipoResiduoApp}|${m.empresaColetaId}`)
    );

    // Se estiver editando, permite que o par atual apareça na lista
    if (isEditing) {
      paresJaMapeados.delete(`${initialData.tipoResiduoApp}|${initialData.empresaColetaId}`);
    }

    return todosOsPares.filter(par => !paresJaMapeados.has(par.value));
  }, [cliente, empresasColeta, mapeamentosExistentes, initialData, isEditing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!parSelecionado || !numeroModelo.trim() || !nomeModelo.trim()) {
      alert('Todos os campos são obrigatórios.');
      return;
    }

    const [tipoResiduoApp, empresaColetaId] = parSelecionado.split('|');
    
    const dadosMapeamento = {
      id: isEditing ? initialData.id : `map_${Date.now()}`, // Mantém o ID original ao editar
      tipoResiduoApp,
      empresaColetaId,
      numeroModeloInea: numeroModelo.trim(),
      nomeModeloInea: nomeModelo.trim(),
    };
    onSave(dadosMapeamento);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg border space-y-4">
      <h3 className="text-lg font-lexend text-gray-700">
        {isEditing ? 'Editar Mapeamento' : 'Adicionar Novo Mapeamento'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Contrato de Coleta (Resíduo + Empresa)*</label>
          <select value={parSelecionado} onChange={e => setParSelecionado(e.target.value)} required className="mt-1 p-2 border bg-white rounded-md w-full">
            <option value="">Selecione um contrato existente...</option>
            {opcoesDeContrato.length > 0 ? (
              opcoesDeContrato.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
            ) : (
              <option disabled>{isEditing ? 'Este é o único contrato' : 'Nenhum contrato novo para mapear'}</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Número do Modelo INEA*</label>
          <input type="text" value={numeroModelo} onChange={e => setNumeroModelo(e.target.value)} required className="mt-1 p-2 border rounded-md w-full" placeholder="Ex: 93118" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome do Modelo INEA*</label>
          <input type="text" value={nomeModelo} onChange={e => setNomeModelo(e.target.value)} required className="mt-1 p-2 border rounded-md w-full" placeholder="Ex: COMPOSTÁVEIS - Vide Verde" />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 bg-white border rounded-md text-sm">Cancelar</button>
        <button type="submit" className="px-3 py-1.5 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700">
          {isEditing ? 'Atualizar Mapeamento' : 'Salvar Mapeamento'}
        </button>
      </div>
    </form>
  );
};


export default function ModelosMTRModal({ isOpen, onClose, cliente, empresasColeta }) {
  const { db } = useContext(AuthContext);
  const [mapeamentos, setMapeamentos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, itemToDeleteId: null });
  
  // NOVO: Estado para controlar o mapeamento em edição
  const [editingMap, setEditingMap] = useState(null);
  
  const empresasMap = useMemo(() => new Map((empresasColeta || []).map(e => [e.id, e.nomeFantasia])), [empresasColeta]);

  useEffect(() => {
    setMapeamentos(cliente?.mapeamentoInea || []);
    // Garante que o formulário feche e o modo de edição seja resetado ao fechar/reabrir o modal
    if (!isOpen) {
      setShowForm(false);
      setEditingMap(null);
    }
  }, [cliente, isOpen]);

  const handleAdicionarMapeamento = async (novoMapeamento) => {
    if (!db || !cliente?.id) return;
    setIsSaving(true);
    try {
      const clienteRef = doc(db, 'clientes', cliente.id);
      await updateDoc(clienteRef, { mapeamentoInea: arrayUnion(novoMapeamento) });
      setMapeamentos(prev => [...prev, novoMapeamento]);
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao salvar mapeamento:", error);
      alert("Falha ao salvar o mapeamento.");
    } finally {
      setIsSaving(false);
    }
  };

  // NOVO: Funções para iniciar a edição e para salvar a atualização
  const handleStartEdit = (mapeamento) => {
    setEditingMap(mapeamento);
    setShowForm(true);
  };

  const handleUpdateMapeamento = async (updatedMap) => {
    if (!db || !cliente?.id) return;
    setIsSaving(true);

    // Cria um novo array de mapeamentos substituindo o antigo pelo atualizado
    const novosMapeamentos = mapeamentos.map(map => 
      map.id === updatedMap.id ? updatedMap : map
    );

    try {
      const clienteRef = doc(db, 'clientes', cliente.id);
      // Sobrescreve o array no Firestore com a versão atualizada
      await updateDoc(clienteRef, { mapeamentoInea: novosMapeamentos });
      
      setMapeamentos(novosMapeamentos); // Atualiza o estado local
      setShowForm(false); // Fecha o formulário
      setEditingMap(null); // Limpa o estado de edição
    } catch (error) {
      console.error("Erro ao atualizar mapeamento:", error);
      alert("Falha ao atualizar o mapeamento.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenConfirmDelete = (mapeamentoId) => setConfirmModalState({ isOpen: true, itemToDeleteId: mapeamentoId });
  const handleCloseConfirmDelete = () => setConfirmModalState({ isOpen: false, itemToDeleteId: null });

  const handleConfirmDelete = async () => {
    // ... (função de excluir permanece a mesma)
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 pt-16" onClick={onClose}>
        <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl p-6 transform transition-all" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h2 className="text-2xl font-lexend text-blue-coral">Mapeamento de Modelos INEA: <span className="font-bold">{cliente?.nome}</span></h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <p className="text-sm text-gray-600">Conecte os tipos de resíduo e transportadoras do seu app aos Modelos de MTR pré-cadastrados no sistema INEA.</p>
            
            <div className="space-y-2">
              {mapeamentos.length > 0 ? (
                mapeamentos.map(map => (
                  <div key={map.id} className="p-3 border rounded-md bg-white grid grid-cols-5 gap-4 items-center">
                    <div className="col-span-1"><strong className="block text-xs text-gray-500">Tipo de Resíduo</strong><span>{map.tipoResiduoApp}</span></div>
                    <div className="col-span-1"><strong className="block text-xs text-gray-500">Transportador</strong><span>{empresasMap.get(map.empresaColetaId) || 'Não encontrado'}</span></div>
                    <div className="col-span-2"><strong className="block text-xs text-gray-500">Leva ao Modelo INEA</strong><span>Nº {map.numeroModeloInea} ({map.nomeModeloInea})</span></div>
                    <div className="col-span-1 text-right flex gap-2 justify-end">
                      <button onClick={() => handleStartEdit(map)} className="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600">Editar</button>
                      <button onClick={() => handleOpenConfirmDelete(map.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Excluir</button>
                    </div>
                  </div>
                ))
              ) : ( <p className="text-center text-gray-500 py-4">Nenhum mapeamento cadastrado.</p> )}
            </div>
            
            {showForm ? (
              <MapeamentoForm 
                cliente={cliente} 
                empresasColeta={empresasColeta}
                mapeamentosExistentes={mapeamentos}
                onSave={editingMap ? handleUpdateMapeamento : handleAdicionarMapeamento} 
                onCancel={() => { setShowForm(false); setEditingMap(null); }} 
                initialData={editingMap}
              />
            ) : (
              <div className="pt-4 text-center">
                <button onClick={() => { setShowForm(true); setEditingMap(null); }} className="px-4 py-2 bg-blue-coral text-white font-semibold rounded-md shadow-sm hover:bg-opacity-90">
                  + Adicionar Mapeamento
                </button>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300">
              Fechar
            </button>
          </div>
        </div>
      </div>
      <ConfirmationModal isOpen={confirmModalState.isOpen} onCancel={handleCloseConfirmDelete} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Você tem certeza que deseja excluir este mapeamento? Esta ação não pode ser desfeita." theme="danger" confirmText="Sim, Excluir" />
    </>
  );
}