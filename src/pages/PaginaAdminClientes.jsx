// src/pages/PaginaAdminClientes.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import MessageBox from '../components/MessageBox';
import ClienteForm from '../components/ClienteForm'; 

export default function PaginaAdminClientes() {
  const { db, userProfile: masterProfile, currentUser: masterCurrentUser } = useContext(AuthContext);

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  
  const [empresasColetaDisponiveis, setEmpresasColetaDisponiveis] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  
  const [showForm, setShowForm] = useState(false); 
  const [editingClienteData, setEditingClienteData] = useState(null); 
  const [editingClienteId, setEditingClienteId] = useState(null); 

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 6000);
  };

  // Carregar clientes
  useEffect(() => {
    if (!db) return;
    setLoadingClientes(true);
    const q = query(collection(db, "clientes"), orderBy("nome"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setClientes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingClientes(false);
    }, (error) => {
      console.error("Erro ao carregar clientes: ", error);
      showMessage("Erro ao carregar clientes.", true);
      setLoadingClientes(false);
    });
    return () => unsubscribe();
  }, [db]);

  // Carregar empresas de coleta
  useEffect(() => {
    if (!db) return;
    setLoadingEmpresas(true);
    const qEmpresas = query(collection(db, "empresasColeta"), orderBy("nomeFantasia"));
    const unsubscribeEmpresas = onSnapshot(qEmpresas, (querySnapshot) => {
      setEmpresasColetaDisponiveis(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingEmpresas(false);
    }, (error) => {
      console.error("Erro ao carregar empresas de coleta: ", error);
      setLoadingEmpresas(false);
    });
    return () => unsubscribeEmpresas();
  }, [db]);

  const handleOpenCreateForm = () => {
    setEditingClienteId(null);
    setEditingClienteData(null); 
    setShowForm(true);
  };

  const handleEditCliente = (cliente) => {
    setEditingClienteId(cliente.id);
    setEditingClienteData(cliente); 
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDeleteCliente = async (clienteId) => {
    if (!db || !masterProfile || masterProfile.role !== 'master') return showMessage("Ação não permitida.", true);
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
        try {
            await deleteDoc(doc(db, "clientes", clienteId));
            showMessage("Cliente excluído com sucesso!");
            if (editingClienteId === clienteId) { 
                handleCancelForm();
            }
        } catch (error) {
            console.error("Erro ao excluir cliente: ", error);
            showMessage("Erro ao excluir cliente.", true);
        }
    }
  };

  const handleFormSubmit = async (formData) => {
    if (!db || !masterCurrentUser || !masterProfile || masterProfile.role !== 'master') {
        showMessage("Ação não permitida.", true);
        return;
    }

    const clienteDataToSave = {
        ...formData, 
        ultimaModificacao: serverTimestamp(),
        modificadoPor: masterCurrentUser.uid,
    };

    try {
      if (editingClienteId) { 
        await updateDoc(doc(db, "clientes", editingClienteId), clienteDataToSave);
        showMessage("Cliente atualizado com sucesso!");
      } else { 
        clienteDataToSave.criadoPor = masterCurrentUser.uid;
        clienteDataToSave.dataCriacao = serverTimestamp();
        await addDoc(collection(db, "clientes"), clienteDataToSave);
        showMessage("Cliente adicionado com sucesso!");
      }
      handleCancelForm(); 
    } catch (error) {
      console.error("Erro ao salvar cliente: ", error);
      showMessage("Erro ao salvar cliente.", true);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingClienteId(null);
    setEditingClienteData(null);
  };

  if (!masterProfile && masterCurrentUser) return <div className="p-8 text-center">A carregar perfil do administrador...</div>;
  if (!masterProfile || masterProfile.role !== 'master') return <div className="p-8 text-center text-red-600">Acesso negado.</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Clientes</h1>
      <MessageBox message={message} isError={isError} />

      {!showForm && (
        <button
          onClick={handleOpenCreateForm}
          className="mb-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm"
        >
          + Adicionar Novo Cliente
        </button>
      )}

      {showForm && (
        <ClienteForm
          key={editingClienteId || 'new'} 
          initialData={editingClienteData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          empresasColetaDisponiveis={empresasColetaDisponiveis}
          isEditing={!!editingClienteId}
        />
      )}

      <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Clientes Cadastrados</h2>
        {loadingClientes ? (<p>A carregar clientes...</p>) : clientes.length === 0 ? (<p>Nenhum cliente cadastrado.</p>) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <colgroup>
                <col className="w-2/6" /> {/* Nome */}
                <col className="w-1/6" /> {/* Rede */}
                <col className="w-1/6" /> {/* Categoria */}
                <col className="w-1/6" /> {/* Status */}
                <col className="w-1/6" /> {/* Ações */}
              </colgroup>
              <thead>
                <tr>
                  <th className="th-table text-left uppercase tracking-wider">Nome</th>
                  <th className="th-table text-left uppercase tracking-wider">Rede</th>
                  <th className="th-table text-left uppercase tracking-wider">Categoria</th>
                  <th className="th-table text-left uppercase tracking-wider">Status</th>
                  {/* AJUSTE: Cabeçalho de Ações para text-center */}
                  <th className="th-table text-center uppercase tracking-normal">Ações</th> 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="td-table font-medium text-gray-900 break-words">{cliente.nome}</td>
                    <td className="td-table break-words">{cliente.rede || '-'}</td>
                    <td className="td-table break-words">{cliente.categoriaCliente || '-'}</td>
                    <td className="td-table">
                      <span className={`status-badge ${cliente.ativo ? 'status-active' : 'status-inactive'}`}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {/* AJUSTE: Célula de Ações para text-center e div interno com justify-center */}
                    <td className="td-table text-center px-6 py-4 whitespace-nowrap text-sm font-medium"> {/* Removida td-table-actions, aplicado padding e text-center */}
                      <div className="flex justify-center items-center space-x-2"> {/* justify-center para os botões */}
                        <button onClick={() => handleEditCliente(cliente)} className="btn-link-indigo">Editar</button>
                        <button onClick={() => handleDeleteCliente(cliente.id)} className="btn-link-red">Excluir</button>
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
