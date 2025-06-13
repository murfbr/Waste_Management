// src/pages/PaginaAdminEmpresasColeta.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import MessageBox from '../components/MessageBox';
import EmpresaColetaForm from '../components/EmpresaColetaForm';

export default function PaginaAdminEmpresasColeta() {
  const { db, userProfile, currentUser } = useContext(AuthContext);

  // Estados para a lista e controle de formulário
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  
  const [showForm, setShowForm] = useState(false); // Controla visibilidade do formulário
  const [editingEmpresaData, setEditingEmpresaData] = useState(null); // Dados para edição
  const [editingEmpresaId, setEditingEmpresaId] = useState(null); // ID para saber se é edição

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  // Carregar empresas
  useEffect(() => {
    if (!db) { 
      setLoadingEmpresas(false);
      return;
    }
    setLoadingEmpresas(true);
    const q = query(collection(db, "empresasColeta"), orderBy("nomeFantasia")); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const empresasData = [];
      querySnapshot.forEach((docSnap) => { // Renomeado para docSnap para evitar conflito com doc de firestore
        empresasData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setEmpresas(empresasData);
      setLoadingEmpresas(false);
    }, (error) => {
      console.error("Erro ao carregar empresas de coleta: ", error);
      showMessage("Erro ao carregar empresas.", true);
      setLoadingEmpresas(false);
    });
    return () => unsubscribe();
  }, [db]);

  const handleOpenCreateForm = () => {
    setEditingEmpresaId(null);
    setEditingEmpresaData(null); 
    setShowForm(true);
  };

  const handleEditEmpresa = (empresa) => {
    setEditingEmpresaId(empresa.id);
    setEditingEmpresaData(empresa); 
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  
  const handleDeleteEmpresa = async (empresaId) => {
    if (!db || !userProfile || userProfile.role !== 'master') {
        showMessage("Apenas administradores master podem excluir empresas.", true);
        return;
    }
    // Substituindo window.confirm por uma lógica de UI mais robusta se necessário no futuro,
    // mas para este exemplo, mantendo a simplicidade.
    // Em um app real, um modal customizado seria melhor.
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta empresa de coleta? Esta ação não pode ser desfeita.");
    if (confirmDelete) {
        try {
            await deleteDoc(doc(db, "empresasColeta", empresaId));
            showMessage("Empresa de coleta excluída com sucesso!");
            if (editingEmpresaId === empresaId) { 
                handleCancelForm();
            }
        } catch (error) {
            console.error("Erro ao excluir empresa de coleta: ", error);
            showMessage("Erro ao excluir empresa. Tente novamente.", true);
        }
    }
  };

  const handleFormSubmit = async (formDataFromChild) => {
    if (!db || !currentUser || !userProfile || userProfile.role !== 'master') {
      showMessage("Apenas administradores master podem adicionar/editar empresas.", true);
      return; 
    }

    const empresaDataToSave = {
      ...formDataFromChild, 
      ultimaModificacao: serverTimestamp(),
      modificadoPor: currentUser.uid,
    };

    try {
      if (editingEmpresaId) {
        const empresaRef = doc(db, "empresasColeta", editingEmpresaId);
        await updateDoc(empresaRef, empresaDataToSave);
        showMessage("Empresa atualizada com sucesso!");
      } else {
        empresaDataToSave.criadoPor = currentUser.uid;
        empresaDataToSave.dataCadastro = serverTimestamp(); 
        await addDoc(collection(db, "empresasColeta"), empresaDataToSave);
        showMessage("Empresa de coleta adicionada com sucesso!");
      }
      handleCancelForm(); 
    } catch (error) {
      console.error("Erro ao salvar empresa de coleta: ", error);
      showMessage("Erro ao salvar empresa. Tente novamente.", true);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEmpresaId(null);
    setEditingEmpresaData(null);
  };


  if (!userProfile && currentUser) { 
    return <div className="p-8 text-center">A carregar perfil do utilizador...</div>;
  }
  if (!userProfile || userProfile.role !== 'master') {
    return <div className="p-8 text-center text-red-600">Acesso negado. Apenas administradores master podem aceder a esta página.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Empresas de Coleta</h1>
      <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />

      {!showForm && (
        <button
          onClick={handleOpenCreateForm}
          className="mb-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          + Adicionar Nova Empresa
        </button>
      )}

      {showForm && (
        <EmpresaColetaForm
          key={editingEmpresaId || 'new-empresa'} 
          initialData={editingEmpresaData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isEditing={!!editingEmpresaId}
        />
      )}

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Empresas Cadastradas</h2>
        {loadingEmpresas ? (
          <p className="text-gray-600">A carregar empresas...</p>
        ) : empresas.length === 0 ? (
          <p className="text-gray-600">Nenhuma empresa de coleta cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              {/* CORREÇÃO: Removido whitespace entre as tags <col> e dentro de <colgroup> */}
              <colgroup><col className="w-1/4" /><col className="w-1/4" /><col className="w-1/4" /><col className="w-1/12" /><col className="w-auto" /></colgroup>
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Fantasia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipos de Resíduo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-normal break-words text-sm font-medium text-gray-900">{empresa.nomeFantasia}</td>
                    <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-500">{empresa.cnpj || '-'}</td>
                    <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-500">
                        {empresa.tiposResiduo && Array.isArray(empresa.tiposResiduo) && empresa.tiposResiduo.length > 0 
                          ? empresa.tiposResiduo.join(', ') 
                          : empresa.tiposResiduo && typeof empresa.tiposResiduo === 'string' 
                            ? empresa.tiposResiduo 
                            : '-'} 
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${empresa.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {empresa.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button 
                            onClick={() => handleEditEmpresa(empresa)} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                            aria-label={`Editar ${empresa.nomeFantasia}`}
                        >
                            Editar
                        </button>
                        <button 
                            onClick={() => handleDeleteEmpresa(empresa.id)} 
                            className="text-red-600 hover:text-red-900 transition-colors duration-150"
                            aria-label={`Excluir ${empresa.nomeFantasia}`}
                        >
                            Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
