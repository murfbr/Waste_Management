// src/pages/app/PaginaAdminUsuarios.jsx

import React, { useState, useEffect, useContext, useMemo } from 'react';
import AuthContext from '../../context/AuthContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import MessageBox from '../../components/app/MessageBox';
import UserForm from '../../components/app/UserForm';

export default function PaginaAdminUsuarios() {
  const { db, functions, userProfile, currentUser } = useContext(AuthContext);
  
  const manageUserPermissions = httpsCallable(functions, 'manageUserPermissions');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [clientesList, setClientesList] = useState([]); 
  const [loadingClientes, setLoadingClientes] = useState(true);

  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (msg, error = false, duration = 6000) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), duration);
  };

  useEffect(() => {
    if (!db) { setLoadingUsers(false); return; }
    setLoadingUsers(true);
    const qUsers = query(collection(db, "users"), orderBy("email")); 
    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoadingUsers(false);
    }, (error) => {
      console.error("Erro ao carregar utilizadores: ", error);
      showMessage("Erro ao carregar utilizadores.", true);
      setLoadingUsers(false);
    });
    return () => unsubscribeUsers();
  }, [db]);

  useEffect(() => {
    if (!db) { setLoadingClientes(false); return; }
    setLoadingClientes(true);
    const qClientes = query(collection(db, "clientes"), orderBy("nome")); 
    const unsubscribeClientes = onSnapshot(qClientes, (querySnapshot) => {
      const clientesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClientesList(clientesData); 
      setLoadingClientes(false);
    }, (error) => {
      console.error("Erro ao carregar clientes para seleção: ", error);
      setLoadingClientes(false);
    });
    return () => unsubscribeClientes();
  }, [db]);

  const visibleUsers = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === 'master') {
      return users;
    }
    if (userProfile.role === 'gerente') {
      const gerentesClientesIds = new Set(userProfile.clientesPermitidos || []);
      
      if (gerentesClientesIds.size === 0) {
        return users.filter(u => u.id === currentUser.uid);
      }

      return users.filter(u => {
        if (u.id === currentUser.uid) return true;
        if (u.role !== 'operacional') return false;

        const operacionaisClientesIds = u.clientesPermitidos || [];
        const temClienteEmComum = operacionaisClientesIds.some(clienteId => gerentesClientesIds.has(clienteId));
        
        return temClienteEmComum;
      });
    }
    return [];
  }, [users, userProfile, currentUser]);

  const clientesParaFormulario = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === 'master') {
      return clientesList;
    }
    if (userProfile.role === 'gerente') {
      const gerentesClientesPermitidos = userProfile.clientesPermitidos || [];
      return clientesList.filter(c => gerentesClientesPermitidos.includes(c.id));
    }
    return [];
  }, [clientesList, userProfile]);


  const handleOpenCreateForm = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (userToEdit) => {
    if (userProfile.role === 'gerente' && userToEdit.role !== 'operacional') {
        return showMessage("Gerentes só podem editar usuários operacionais.", true);
    }
    setEditingUser(userToEdit);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleFormSubmit = async (formData) => {
    const action = editingUser ? 'update' : 'create';
    
    try {
      const result = await manageUserPermissions({ action, userData: formData });
      showMessage(result.data.message, false);
      handleCancelForm();
    } catch (error) {
      console.error("Erro ao gerir permissões do utilizador:", error);
      showMessage(error.message || "Ocorreu um erro desconhecido.", true);
    }
  };

  if (!userProfile && currentUser) return <div className="p-8 text-center">A carregar perfil...</div>;
  if (!userProfile || !['master', 'gerente'].includes(userProfile.role)) {
    return <div className="p-8 text-center text-red-600">Acesso negado.</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Utilizadores</h1>
      <MessageBox message={message} isError={isError} onClose={() => setMessage('')} />

      {!showForm && (
        <div className="my-4">
          <button
            onClick={handleOpenCreateForm}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            + Adicionar Novo Utilizador
          </button>
        </div>
      )}

      {showForm && (
        <UserForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          initialData={editingUser}
          isEditing={!!editingUser}
          clientesList={clientesParaFormulario}
          loadingClientes={loadingClientes}
          // --- MUDANÇA AQUI: Passamos o perfil do usuário logado para o formulário ---
          currentUserProfile={userProfile}
        />
      )}

      <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Utilizadores Registados</h2>
        {loadingUsers ? ( <p>A carregar utilizadores...</p>
        ) : visibleUsers.length === 0 ? ( <p>Nenhum utilizador encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead>
                <tr>
                  <th className="th-table uppercase tracking-wider">Email / Nome</th>
                  <th className="th-table uppercase tracking-wider">Nível (Role)</th>
                  <th className="th-table uppercase tracking-wider">Clientes Permitidos</th>
                  <th className="th-table text-center normal-case tracking-normal">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="td-table font-medium text-gray-900">{user.email || user.nome || user.id}</td>
                    <td className="td-table">{user.role}</td>
                    <td className="td-table break-words">
                      {user.role === 'master' 
                        ? 'Todos' 
                        : (user.clientesPermitidos && user.clientesPermitidos.length > 0 
                            ? user.clientesPermitidos.map(clienteId => clientesList.find(c => c.id === clienteId)?.nome || clienteId.substring(0,6)+'...').join(', ')
                            : 'Nenhum'
                          )
                      }
                    </td>
                    <td className="td-table text-center px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex justify-center items-center space-x-2">
                        <button onClick={() => handleEditUser(user)} 
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
                                disabled={user.id === currentUser?.uid || (userProfile.role === 'gerente' && user.role !== 'operacional')}>
                            Editar
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
