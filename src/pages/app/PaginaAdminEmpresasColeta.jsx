// src/pages/PaginaAdminEmpresasColeta.jsx
import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import MessageBox from '../../components/app/MessageBox';
// IMPORTANDO OS DOIS FORMULÁRIOS
import TransportadorForm from '../../components/app/TransportadorForm'; // Renomeie o import se manteve o nome antigo
import DestinadorForm from '../../components/app/DestinadorForm';

export default function PaginaAdminEmpresasColeta() {
  const { db, userProfile, currentUser } = useContext(AuthContext);

  // --- ESTADOS GERENCIADORES ---
  const [activeTab, setActiveTab] = useState('transportadores'); // 'transportadores' ou 'destinadores'
  const [showForm, setShowForm] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // --- ESTADOS PARA AS LISTAS ---
  const [transportadores, setTransportadores] = useState([]);
  const [destinadores, setDestinadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar DADOS DE AMBAS AS COLEÇÕES
  useEffect(() => {
    if (!db) return;
    setLoading(true);

    const qTransportadores = query(collection(db, "empresasColeta"), orderBy("nomeFantasia"));
    const unsubTransportadores = onSnapshot(qTransportadores, (snap) => {
      setTransportadores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Erro ao carregar transportadores:", err));

    const qDestinadores = query(collection(db, "destinadores"), orderBy("nome"));
    const unsubDestinadores = onSnapshot(qDestinadores, (snap) => {
      setDestinadores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Erro ao carregar destinadores:", err));

    Promise.all([qTransportadores, qDestinadores]).finally(() => setLoading(false));

    return () => {
      unsubTransportadores();
      unsubDestinadores();
    };
  }, [db]);
  
  const showMessage = (msg, error = false) => { /* ... (função sem alterações) ... */ };
  
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setEditingData(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditingData(item);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingData(null);
  };
  
  const handleDelete = async (id) => {
    if (userProfile.role !== 'master') return;
    const collectionName = activeTab === 'transportadores' ? 'empresasColeta' : 'destinadores';
    const itemName = activeTab === 'transportadores' ? 'Transportador' : 'Destinador';

    if (window.confirm(`Tem certeza que deseja excluir este ${itemName}?`)) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        showMessage(`${itemName} excluído com sucesso!`);
        if (editingId === id) handleCancelForm();
      } catch (error) {
        showMessage(`Erro ao excluir ${itemName}.`, true);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    if (userProfile.role !== 'master') return;
    const collectionName = activeTab === 'transportadores' ? 'empresasColeta' : 'destinadores';
    const itemName = activeTab === 'transportadores' ? 'Transportador' : 'Destinador';

    const dataToSave = {
      ...formData,
      ultimaModificacao: serverTimestamp(),
      modificadoPor: currentUser.uid,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, collectionName, editingId), dataToSave);
        showMessage(`${itemName} atualizado com sucesso!`);
      } else {
        dataToSave.criadoPor = currentUser.uid;
        dataToSave.dataCadastro = serverTimestamp();
        await addDoc(collection(db, collectionName), dataToSave);
        showMessage(`${itemName} adicionado com sucesso!`);
      }
      handleCancelForm();
    } catch (error) {
      console.error(`Erro ao salvar ${itemName}: `, error);
      showMessage(`Erro ao salvar ${itemName}.`, true);
    }
  };

  // Lógica de acesso (sem alterações)
  if (!userProfile) return <div className="p-8 text-center">Carregando perfil...</div>;
  if (userProfile.role !== 'master') return <div className="p-8 text-center text-red-600">Acesso negado.</div>;

  const renderContent = () => {
    if (showForm) {
      return activeTab === 'transportadores' ? (
        <TransportadorForm
          key={editingId || 'new-transportador'}
          initialData={editingData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isEditing={!!editingId}
        />
      ) : (
        <DestinadorForm
          key={editingId || 'new-destinador'}
          initialData={editingData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isEditing={!!editingId}
        />
      );
    }

    // Renderiza a tabela correta
    const isTransportadores = activeTab === 'transportadores';
    const data = isTransportadores ? transportadores : destinadores;
    const headers = isTransportadores 
        ? ["Nome Fantasia", "CNPJ", "Tipos de Resíduo", "Status", "Ações"]
        : ["Nome", "CNPJ", "Estado", "Status", "Ações"];

    return (
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">{isTransportadores ? 'Transportadores Cadastrados' : 'Destinadores Cadastrados'}</h2>
         {loading ? <p>Carregando...</p> : data.length === 0 ? <p>Nenhum item cadastrado.</p> : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead><tr>{headers.map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4">{isTransportadores ? item.nomeFantasia : item.nome}</td>
                                <td className="px-6 py-4">{item.cnpj}</td>
                                <td className="px-6 py-4">{isTransportadores ? (item.tiposResiduo?.join(', ') || '-') : item.estado}</td>
                                <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs font-semibold rounded-full ${item.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.ativo ? 'Ativo' : 'Inativo'}</span></td>
                                <td className="px-6 py-4 flex space-x-2">
                                    <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Gerenciar Parceiros</h1>
      <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />

        {/* --- NAVEGAÇÃO EM ABAS --- */}
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button onClick={() => { setActiveTab('transportadores'); handleCancelForm(); }} className={`${activeTab === 'transportadores' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    Transportadores
                </button>
                <button onClick={() => { setActiveTab('destinadores'); handleCancelForm(); }} className={`${activeTab === 'destinadores' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    Destinadores
                </button>
            </nav>
        </div>

      {!showForm && (
        <button onClick={handleOpenCreateForm} className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm">
          + Adicionar Novo {activeTab === 'transportadores' ? 'Transportador' : 'Destinador'}
        </button>
      )}

      {renderContent()}
    </div>
  );
}