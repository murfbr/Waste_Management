// src/pages/app/PaginaAdminUsuarios.jsx

import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import AuthContext from '../../context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import MessageBox from '../../components/app/MessageBox';
import UserForm from '../../components/app/UserForm';

export default function PaginaAdminUsuarios() {
  console.log("PaginaAdminUsuarios: Renderizando a página.");
  // --- CORREÇÃO: Usando a lista de clientes SEGURA do contexto ---
  const { functions, userProfile, currentUser, userAllowedClientes, loadingAllowedClientes } = useContext(AuthContext);
  
  // --- CORREÇÃO: Memoizando a função para estabilizar a dependência ---
  const manageUserPermissions = useMemo(() => httpsCallable(functions, 'manageUserPermissions'), [functions]);
  const getVisibleUsersFunction = useMemo(() => httpsCallable(functions, 'getVisibleUsers'), [functions]);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (msg, error = false, duration = 6000) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), duration);
  };

  const fetchUsers = useCallback(() => {
    console.log("PaginaAdminUsuarios: fetchUsers foi chamada.");
    if (!userProfile) {
      console.log("PaginaAdminUsuarios: fetchUsers abortada - perfil do usuário ainda não carregado.");
      return;
    }

    console.log("PaginaAdminUsuarios: Chamando a Cloud Function 'getVisibleUsers'...");
    setLoadingUsers(true);
    getVisibleUsersFunction()
      .then((result) => {
        const fetchedUsers = result.data.users || [];
        console.log(`PaginaAdminUsuarios: Cloud Function retornou ${fetchedUsers.length} usuários.`, fetchedUsers);
        setUsers(fetchedUsers);
      })
      .catch((error) => {
        console.error("PaginaAdminUsuarios: Erro CRÍTICO ao chamar 'getVisibleUsers': ", error);
        showMessage("Erro ao carregar a lista de utilizadores.", true);
      })
      .finally(() => {
        console.log("PaginaAdminUsuarios: fetchUsers finalizada.");
        setLoadingUsers(false);
      });
  }, [userProfile, getVisibleUsersFunction]);

  useEffect(() => {
    console.log("PaginaAdminUsuarios: useEffect para chamar fetchUsers foi acionado.");
    fetchUsers();
  }, [fetchUsers]);

  // --- REMOVIDO: O useEffect que buscava a lista de clientes foi removido ---
  // pois agora usamos a lista segura vinda do AuthContext.

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
    console.log(`PaginaAdminUsuarios: Submetendo formulário com ação '${action}'`, formData);
    try {
      const result = await manageUserPermissions({ action, userData: formData });
      showMessage(result.data.message, false);
      fetchUsers();
      handleCancelForm();
    } catch (error) {
      console.error("Erro ao gerir permissões do utilizador:", error);
      showMessage(error.message || "Ocorreu um erro desconhecido.", true);
    }
  };

  console.log("PaginaAdminUsuarios: Verificando permissões de acesso...");
  if (!userProfile && currentUser) {
      console.log("PaginaAdminUsuarios: Acesso pendente, aguardando perfil...");
      return <div className="p-8 text-center">A carregar perfil...</div>;
  }
  if (!userProfile || !['master', 'gerente'].includes(userProfile.role)) {
    console.error(`PaginaAdminUsuarios: ACESSO NEGADO! Role do usuário: '${userProfile?.role}'`);
    return <div className="p-8 text-center text-red-600">Acesso negado.</div>;
  }
  console.log(`PaginaAdminUsuarios: Acesso PERMITIDO para role '${userProfile.role}'.`);

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
          clientesList={userAllowedClientes}
          loadingClientes={loadingAllowedClientes}
          currentUserProfile={userProfile}
        />
      )}

      <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Utilizadores Registados</h2>
        {loadingUsers ? ( <p>A carregar utilizadores...</p>
        ) : users.length === 0 ? ( <p>Nenhum utilizador encontrado.</p>
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
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="td-table font-medium text-gray-900">{user.email || user.nome || user.id}</td>
                    <td className="td-table">{user.role}</td>
                    <td className="td-table break-words">
                      {user.role === 'master' 
                        ? 'Todos' 
                        : (user.clientesPermitidos && user.clientesPermitidos.length > 0 
                            ? user.clientesPermitidos.map(clienteId => userAllowedClientes.find(c => c.id === clienteId)?.nome || clienteId.substring(0,6)+'...').join(', ')
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
