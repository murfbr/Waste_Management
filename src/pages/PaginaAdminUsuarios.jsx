// src/pages/PaginaAdminUsuarios.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  setDoc, // Para criar o perfil do novo usuário
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Para criar o usuário na autenticação
import MessageBox from '../components/MessageBox';

const ROLES_DISPONIVEIS = ["master", "gerente", "operacional"];

export default function PaginaAdminUsuarios() {
  const { db, auth: authInstance, userProfile: masterProfile, currentUser: masterCurrentUser } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [hoteis, setHoteis] = useState([]);
  const [loadingHoteis, setLoadingHoteis] = useState(true);

  // Estados para o formulário de EDIÇÃO
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedHoteisPermitidos, setSelectedHoteisPermitidos] = useState([]);

  // NOVOS ESTADOS para o formulário de CRIAÇÃO
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState(ROLES_DISPONIVEIS[2]); // Padrão para 'operacional'
  const [newUserHoteisPermitidos, setNewUserHoteisPermitidos] = useState([]);
  const [creatingUser, setCreatingUser] = useState(false);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  // Carregar usuários
  useEffect(() => {
    if (!db) {
      setLoadingUsers(false);
      return;
    }
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

  // Carregar hotéis
  useEffect(() => {
    if (!db) {
      setLoadingHoteis(false);
      return;
    }
    setLoadingHoteis(true);
    const qHoteis = query(collection(db, "hoteis"), orderBy("nome"));
    const unsubscribeHoteis = onSnapshot(qHoteis, (querySnapshot) => {
      const hoteisData = [];
      querySnapshot.forEach((doc) => {
        hoteisData.push({ id: doc.id, ...doc.data() });
      });
      setHoteis(hoteisData);
      setLoadingHoteis(false);
    }, (error) => {
      console.error("Erro ao carregar hotéis para seleção: ", error);
      setLoadingHoteis(false);
    });
    return () => unsubscribeHoteis();
  }, [db]);

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setSelectedRole(userToEdit.role || '');
    setSelectedHoteisPermitidos(Array.isArray(userToEdit.hoteisPermitidos) ? userToEdit.hoteisPermitidos : []);
    setShowCreateForm(false); // Esconde o formulário de criação se estiver aberto
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHotelPermissionChange = (hotelId, formType = 'edit') => {
    if (formType === 'edit') {
      setSelectedHoteisPermitidos(prev => 
        prev.includes(hotelId) 
          ? prev.filter(id => id !== hotelId) 
          : [...prev, hotelId]
      );
    } else { // formType === 'create'
      setNewUserHoteisPermitidos(prev =>
        prev.includes(hotelId)
          ? prev.filter(id => id !== hotelId)
          : [...prev, hotelId]
      );
    }
  };

  const resetEditForm = () => {
    setEditingUser(null);
    setSelectedRole('');
    setSelectedHoteisPermitidos([]);
  };

  const resetCreateForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole(ROLES_DISPONIVEIS[2]);
    setNewUserHoteisPermitidos([]);
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
        hoteisPermitidos: selectedRole === 'master' ? [] : selectedHoteisPermitidos, // Master não precisa de hoteisPermitidos explicitamente
        // nome: pode ser atualizado aqui se houver um campo no formulário de edição
      });
      showMessage("Perfil do utilizador atualizado com sucesso!");
      resetEditForm();
    } catch (error) {
      console.error("Erro ao atualizar perfil do utilizador:", error);
      showMessage("Erro ao atualizar perfil. Tente novamente.", true);
    }
  };

  // NOVA FUNÇÃO para criar utilizador
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!authInstance || !db || !masterProfile || masterProfile.role !== 'master') {
      showMessage("Ação não permitida.", true);
      return;
    }
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserName.trim()) {
      showMessage("Nome, email e senha são obrigatórios para criar um novo utilizador.", true);
      return;
    }
    if (!newUserRole) {
        showMessage("Por favor, selecione um nível de acesso para o novo utilizador.", true);
        return;
    }

    setCreatingUser(true);
    try {
      // 1. Criar o utilizador no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(authInstance, newUserEmail, newUserPassword);
      const newUserAuth = userCredential.user;
      console.log("Utilizador criado na autenticação:", newUserAuth.uid);

      // 2. Criar o perfil do utilizador no Firestore
      const userProfileData = {
        nome: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        role: newUserRole,
        hoteisPermitidos: newUserRole === 'master' ? [] : newUserHoteisPermitidos,
        dataCriacaoPerfil: serverTimestamp(),
        // uid: newUserAuth.uid, // O ID do documento já será o UID
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


  if (!masterProfile && masterCurrentUser) {
    return <div className="p-8 text-center">A carregar perfil do administrador...</div>;
  }
  if (!masterProfile || masterProfile.role !== 'master') {
    return <div className="p-8 text-center text-red-600">Acesso negado. Apenas administradores master podem aceder a esta página.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Utilizadores</h1>
      <MessageBox message={message} isError={isError} />

      {/* Botão para mostrar/esconder formulário de criação */}
      <div className="my-4">
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); resetEditForm(); }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm"
        >
          {showCreateForm ? 'Cancelar Criação' : '+ Adicionar Novo Utilizador'}
        </button>
      </div>

      {/* Formulário de CRIAÇÃO (condicional) */}
      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-lg shadow space-y-4 mb-8 border border-green-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Criar Novo Utilizador</h2>
          <div>
            <label htmlFor="newUserName" className="block text-sm font-medium text-gray-700">Nome*</label>
            <input type="text" id="newUserName" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700">Email*</label>
            <input type="email" id="newUserEmail" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-700">Senha* (mínimo 6 caracteres)</label>
            <input type="password" id="newUserPassword" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-700">Nível de Acesso (Role)*</label>
            <select id="newUserRole" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
              {ROLES_DISPONIVEIS.map(roleOption => (
                <option key={roleOption} value={roleOption}>
                  {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {newUserRole !== 'master' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotéis Permitidos</label>
              {loadingHoteis ? <p>A carregar hotéis...</p> : hoteis.length === 0 ? <p>Nenhum hotel cadastrado.</p> : (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                  {hoteis.map(hotel => (
                    <label key={`create-${hotel.id}`} htmlFor={`create-hotel-${hotel.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded">
                      <input type="checkbox" id={`create-hotel-${hotel.id}`} value={hotel.id} checked={newUserHoteisPermitidos.includes(hotel.id)} onChange={() => handleHotelPermissionChange(hotel.id, 'create')} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                      <span className="ml-2 text-sm text-gray-700">{hotel.nome}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={resetCreateForm} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                Limpar Formulário
            </button>
            <button type="submit" className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700" disabled={creatingUser}>
                {creatingUser ? 'A Criar...' : 'Criar Utilizador'}
            </button>
          </div>
        </form>
      )}


      {/* Formulário de Edição (aparece quando editingUser está definido) */}
      {editingUser && !showCreateForm && ( // Só mostra se não estiver a criar
        <form onSubmit={handleUpdateUser} className="bg-white p-6 rounded-lg shadow space-y-4 mb-8 border border-indigo-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">
            A Editar Utilizador: <span className="font-normal">{editingUser.email || editingUser.nome || editingUser.id}</span>
          </h2>
          
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Nível de Acesso (Role)*</label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={editingUser.id === masterCurrentUser?.uid && editingUser.role === 'master'}
            >
              <option value="">Selecione um nível</option>
              {ROLES_DISPONIVEIS.map(roleOption => (
                <option key={roleOption} value={roleOption}>
                  {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                </option>
              ))}
            </select>
            {editingUser.id === masterCurrentUser?.uid && editingUser.role === 'master' && (
                <p className="text-xs text-gray-500 mt-1">O nível "master" não pode ser alterado para o próprio utilizador master.</p>
            )}
          </div>

          {selectedRole !== 'master' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotéis Permitidos</label>
              {loadingHoteis ? <p>A carregar hotéis...</p> : hoteis.length === 0 ? <p>Nenhum hotel cadastrado para seleção.</p> : (
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                  {hoteis.map(hotel => (
                    <label key={hotel.id} htmlFor={`edit-hotel-${hotel.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        id={`edit-hotel-${hotel.id}`} // ID único para checkboxes de edição
                        value={hotel.id}
                        checked={selectedHoteisPermitidos.includes(hotel.id)}
                        onChange={() => handleHotelPermissionChange(hotel.id, 'edit')}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{hotel.nome} ({hotel.cidade || 'N/A'})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedRole === 'master' && (
            <p className="text-sm text-gray-600">Utilizadores "master" têm acesso a todos os hotéis por defeito.</p>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={resetEditForm} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700">
                Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* Lista de Utilizadores */}
      <div className="bg-white p-6 rounded-lg shadow">
        {/* ... (JSX da tabela de utilizadores inalterado) ... */}
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Utilizadores Registados</h2>
        {loadingUsers ? (
          <p>A carregar utilizadores...</p>
        ) : users.length === 0 ? (
          <p>Nenhum utilizador encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email / Nome</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível (Role)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotéis Permitidos</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email || user.nome || user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role === 'master' 
                        ? 'Todos' 
                        : (user.hoteisPermitidos && user.hoteisPermitidos.length > 0 
                            ? user.hoteisPermitidos.map(hotelId => hoteis.find(h => h.id === hotelId)?.nome || hotelId).join(', ')
                            : 'Nenhum'
                          )
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEditUser(user)} 
                        className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={user.id === masterCurrentUser?.uid && user.role === 'master'} 
                      >
                        Editar
                      </button>
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
