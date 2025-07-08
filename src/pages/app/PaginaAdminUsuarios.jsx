// src/pages/PaginaAdminUsuarios.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  setDoc, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import MessageBox from '../../components/app/MessageBox';

const ROLES_DISPONIVEIS = ["master", "gerente", "operacional"];

export default function PaginaAdminUsuarios() {
  const { db, auth: authInstance, userProfile: masterProfile, currentUser: masterCurrentUser } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [clientesList, setClientesList] = useState([]); 
  const [loadingClientes, setLoadingClientes] = useState(true); // Adicionado para clareza

  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedClientesPermitidos, setSelectedClientesPermitidos] = useState([]); 

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState(ROLES_DISPONIVEIS[2]); 
  const [newUserClientesPermitidos, setNewUserClientesPermitidos] = useState([]);
  const [creatingUser, setCreatingUser] = useState(false);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (msg, error = false, duration = 6000) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), duration);
  };

  // Carregar utilizadores
  useEffect(() => {
    if (!db) { setLoadingUsers(false); return; }
    setLoadingUsers(true);
    const qUsers = query(collection(db, "users"), orderBy("email")); 
    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersData);
      setLoadingUsers(false);
    }, (error) => {
      console.error("Erro ao carregar utilizadores: ", error);
      showMessage("Erro ao carregar utilizadores.", true);
      setLoadingUsers(false);
    });
    return () => unsubscribeUsers();
  }, [db]);

  // Carregar CLIENTES para o seletor
  useEffect(() => {
    if (!db) { setLoadingClientes(false); return; }
    setLoadingClientes(true);
    const qClientes = query(collection(db, "clientes"), orderBy("nome")); 
    const unsubscribeClientes = onSnapshot(qClientes, (querySnapshot) => {
      const clientesData = [];
      querySnapshot.forEach((doc) => {
        clientesData.push({ id: doc.id, ...doc.data() });
      });
      setClientesList(clientesData); 
      setLoadingClientes(false);
    }, (error) => {
      console.error("Erro ao carregar clientes para seleção: ", error);
      setLoadingClientes(false);
    });
    return () => unsubscribeClientes();
  }, [db]);

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setSelectedRole(userToEdit.role || '');
    setSelectedClientesPermitidos(Array.isArray(userToEdit.clientesPermitidos) ? userToEdit.clientesPermitidos : []);
    setShowCreateForm(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClientePermissionChange = (clienteId, formType = 'edit') => {
    if (formType === 'edit') {
      setSelectedClientesPermitidos(prev => 
        prev.includes(clienteId) 
          ? prev.filter(id => id !== clienteId) 
          : [...prev, clienteId]
      );
    } else { // formType === 'create'
      setNewUserClientesPermitidos(prev =>
        prev.includes(clienteId)
          ? prev.filter(id => id !== clienteId)
          : [...prev, clienteId]
      );
    }
  };

  const resetEditForm = () => {
    setEditingUser(null);
    setSelectedRole('');
    setSelectedClientesPermitidos([]);
  };

  const resetCreateForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole(ROLES_DISPONIVEIS[2]);
    setNewUserClientesPermitidos([]);
    setShowCreateForm(false);
    setCreatingUser(false);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!db || !editingUser || !masterProfile || masterProfile.role !== 'master') {
      showMessage("Ação não permitida.", true);
      return;
    }
    if (!selectedRole) {
        showMessage("Por favor, selecione um nível de acesso para o utilizador.", true);
        return;
    }
    if (editingUser.id === masterCurrentUser?.uid && selectedRole !== 'master') {
        showMessage("O utilizador master não pode alterar o seu próprio nível de acesso para um nível inferior.", true);
        return;
    }
    
    const userDocRef = doc(db, "users", editingUser.id);
    try {
      await updateDoc(userDocRef, {
        role: selectedRole,
        clientesPermitidos: selectedRole === 'master' ? [] : selectedClientesPermitidos, 
        nome: editingUser.nome, 
        email: editingUser.email 
      });
      showMessage("Perfil do utilizador atualizado com sucesso!");
      resetEditForm();
    } catch (error) {
      console.error("Erro ao atualizar perfil do utilizador:", error);
      showMessage("Erro ao atualizar perfil. Tente novamente.", true);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!authInstance || !db || !masterProfile || masterProfile.role !== 'master') {
      showMessage("Ação não permitida.", true); return;
    }
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserName.trim()) {
      showMessage("Nome, email e senha são obrigatórios para criar um novo utilizador.", true); return;
    }
    if (!newUserRole) {
        showMessage("Por favor, selecione um nível de acesso para o novo utilizador.", true); return;
    }

    setCreatingUser(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(authInstance, newUserEmail, newUserPassword);
      const newUserAuth = userCredential.user;

      const userProfileData = {
        nome: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        role: newUserRole,
        clientesPermitidos: newUserRole === 'master' ? [] : newUserClientesPermitidos,
        dataCriacaoPerfil: serverTimestamp(),
      };
      await setDoc(doc(db, "users", newUserAuth.uid), userProfileData);
      
      showMessage(`Utilizador ${newUserEmail} criado com sucesso!`);
      resetCreateForm();

    } catch (error) {
      console.error("Erro ao criar novo utilizador:", error);
      if (error.code === 'auth/email-already-in-use') {
        showMessage('Este endereço de e-mail já está em uso.', true);
      } else if (error.code === 'auth/weak-password') {
        showMessage('A senha é muito fraca. Use pelo menos 6 caracteres.', true);
      } else {
        showMessage('Erro ao criar utilizador. Verifique os dados e tente novamente.', true);
      }
    } finally {
      setCreatingUser(false);
    }
  };

  if (!masterProfile && masterCurrentUser) return <div className="p-8 text-center">A carregar perfil do administrador...</div>;
  if (!masterProfile || masterProfile.role !== 'master') return <div className="p-8 text-center text-red-600">Acesso negado.</div>;

  // Estilos Tailwind para inputs e labels (consistentes com PaginaAdminEmpresasColeta.jsx)
  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Utilizadores</h1>
      <MessageBox message={message} isError={isError} />

      <div className="my-4">
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); resetEditForm(); }}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 
            ${showCreateForm 
              ? "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500" 
              : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
            }`} // Botão verde para Adicionar, Amarelo para Cancelar Criação
        >
          {showCreateForm ? 'Cancelar Criação' : '+ Adicionar Novo Utilizador'}
        </button>
      </div>

      {/* Formulário de CRIAÇÃO */}
      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-lg shadow space-y-4 mb-8 border border-green-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Criar Novo Utilizador</h2>
          <div>
            <label htmlFor="newUserName" className={labelStyle}>Nome*</label>
            <input type="text" id="newUserName" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required className={inputStyle}/>
          </div>
          <div>
            <label htmlFor="newUserEmail" className={labelStyle}>Email*</label>
            <input type="email" id="newUserEmail" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required className={inputStyle}/>
          </div>
          <div>
            <label htmlFor="newUserPassword" className={labelStyle}>Senha* (mínimo 6 caracteres)</label>
            <input type="password" id="newUserPassword" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required className={inputStyle}/>
          </div>
          <div>
            <label htmlFor="newUserRole" className={labelStyle}>Nível de Acesso (Role)*</label>
            <select id="newUserRole" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} required className={inputStyle}>
              {ROLES_DISPONIVEIS.map(roleOption => (
                <option key={roleOption} value={roleOption}>
                  {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {newUserRole !== 'master' && (
            <div>
              <label className={`${labelStyle} mb-1`}>Clientes Permitidos</label>
              {loadingClientes ? <p>A carregar clientes...</p> : clientesList.length === 0 ? <p>Nenhum cliente cadastrado.</p> : (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                  {clientesList.map(cliente => (
                    <label key={`create-cliente-${cliente.id}`} htmlFor={`create-cliente-cb-${cliente.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded">
                      <input type="checkbox" id={`create-cliente-cb-${cliente.id}`} value={cliente.id} checked={newUserClientesPermitidos.includes(cliente.id)} onChange={() => handleClientePermissionChange(cliente.id, 'create')} className={`${checkboxStyle} mr-2`}/>
                      <span className="ml-2 text-sm text-gray-700">{cliente.nome}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={resetCreateForm} 
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Limpar
            </button>
            <button type="submit" 
                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" 
                    disabled={creatingUser}>
                {creatingUser ? 'A Criar...' : 'Criar Utilizador'}
            </button>
          </div>
        </form>
      )}

      {/* Formulário de Edição */}
      {editingUser && !showCreateForm && ( 
        <form onSubmit={handleUpdateUser} className="bg-white p-6 rounded-lg shadow space-y-4 mb-8 border border-indigo-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">
            A Editar Utilizador: <span className="font-normal">{editingUser.email || editingUser.nome || editingUser.id}</span>
          </h2>
          <div>
            <label htmlFor="editUserName" className={labelStyle}>Nome (não editável aqui, apenas informativo)</label>
            <input type="text" id="editUserName" value={editingUser.nome || ''} readOnly className={`${inputStyle} bg-gray-100`} />
          </div>
          <div>
            <label htmlFor="role" className={labelStyle}>Nível de Acesso (Role)*</label>
            <select id="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} required className={inputStyle} disabled={editingUser.id === masterCurrentUser?.uid && editingUser.role === 'master'}>
              <option value="">Selecione um nível</option>
              {ROLES_DISPONIVEIS.map(roleOption => ( <option key={roleOption} value={roleOption}> {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)} </option> ))}
            </select>
            {editingUser.id === masterCurrentUser?.uid && editingUser.role === 'master' && ( <p className="text-xs text-gray-500 mt-1">O nível "master" não pode ser alterado.</p> )}
          </div>
          {selectedRole !== 'master' && (
            <div>
              <label className={`${labelStyle} mb-1`}>Clientes Permitidos</label>
              {loadingClientes ? <p>A carregar clientes...</p> : clientesList.length === 0 ? <p>Nenhum cliente cadastrado para seleção.</p> : (
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                  {clientesList.map(cliente => (
                    <label key={cliente.id} htmlFor={`edit-cliente-cb-${cliente.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded">
                      <input type="checkbox" id={`edit-cliente-cb-${cliente.id}`} value={cliente.id} checked={selectedClientesPermitidos.includes(cliente.id)} onChange={() => handleClientePermissionChange(cliente.id, 'edit')} className={`${checkboxStyle} mr-2`}/>
                      <span className="ml-2 text-sm text-gray-700">{cliente.nome} ({cliente.cidade || 'N/A'})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedRole === 'master' && ( <p className="text-sm text-gray-600">Utilizadores "master" têm acesso a todos os clientes por defeito.</p> )}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={resetEditForm} 
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Cancelar
            </button>
            <button type="submit" 
                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* Lista de Utilizadores */}
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
                            ? user.clientesPermitidos.map(clienteId => clientesList.find(c => c.id === clienteId)?.nome || clienteId.substring(0,6)+'...').join(', ')
                            : 'Nenhum'
                          )
                      }
                    </td>
                    <td className="td-table text-center px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex justify-center items-center space-x-2">
                        <button onClick={() => handleEditUser(user)} 
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
                                disabled={user.id === masterCurrentUser?.uid && user.role === 'master'}>
                            Editar
                        </button>
                        {/* O botão de excluir utilizador não foi implementado aqui, pois requer exclusão no Auth também */}
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