// src/pages/PaginaAdminUsuarios.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { collection, onSnapshot, query, doc, updateDoc, orderBy } from 'firebase/firestore';
import MessageBox from '../components/MessageBox';

const ROLES_DISPONIVEIS = ["master", "gerente", "operacional"]; // Roles que podem ser atribuídos

export default function PaginaAdminUsuarios() {
  const { db, userProfile: masterProfile, currentUser: masterCurrentUser } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [hoteis, setHoteis] = useState([]);
  const [loadingHoteis, setLoadingHoteis] = useState(true);

  const [editingUser, setEditingUser] = useState(null); // Guarda o objeto do utilizador completo em edição
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedHoteisPermitidos, setSelectedHoteisPermitidos] = useState([]); // Array de IDs de hotéis

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  // Carregar utilizadores
  useEffect(() => {
    if (!db) {
      setLoadingUsers(false);
      return;
    }
    setLoadingUsers(true);
    // Ordenar por email ou nome, se disponível
    const qUsers = query(collection(db, "users"), orderBy("email")); 
    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
      const usersData = [];
      querySnapshot.forEach((doc) => {
        // Não incluir o próprio master na lista para evitar auto-edição de role/hotéis aqui (opcional)
        // if (doc.id !== masterCurrentUser?.uid) { 
          usersData.push({ id: doc.id, ...doc.data() });
        // }
      });
      setUsers(usersData);
      setLoadingUsers(false);
    }, (error) => {
      console.error("Erro ao carregar utilizadores: ", error);
      showMessage("Erro ao carregar utilizadores.", true);
      setLoadingUsers(false);
    });
    return () => unsubscribeUsers();
  }, [db, masterCurrentUser?.uid]);

  // Carregar hotéis para o seletor
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHotelPermissionChange = (hotelId) => {
    setSelectedHoteisPermitidos(prev => 
      prev.includes(hotelId) 
        ? prev.filter(id => id !== hotelId) 
        : [...prev, hotelId]
    );
  };

  const resetEditForm = () => {
    setEditingUser(null);
    setSelectedRole('');
    setSelectedHoteisPermitidos([]);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!db || !editingUser || !masterProfile || masterProfile.role !== 'master') {
      showMessage("Ação não permitida.", true);
      return;
    }
    if (!selectedRole) {
        showMessage("Por favor, selecione um nível de acesso para o utilizador.", true);
        return;
    }

    // Evitar que o master se rebaixe ou altere os seus próprios hotéis aqui (medida de segurança)
    if (editingUser.id === masterCurrentUser?.uid && selectedRole !== 'master') {
        showMessage("O utilizador master não pode alterar o seu próprio nível de acesso para um nível inferior.", true);
        return;
    }
    
    const userDocRef = doc(db, "users", editingUser.id);
    try {
      await updateDoc(userDocRef, {
        role: selectedRole,
        hoteisPermitidos: selectedHoteisPermitidos
      });
      showMessage("Perfil do utilizador atualizado com sucesso!");
      resetEditForm();
    } catch (error) {
      console.error("Erro ao atualizar perfil do utilizador:", error);
      showMessage("Erro ao atualizar perfil. Tente novamente.", true);
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

      {/* Formulário de Edição (aparece quando editingUser está definido) */}
      {editingUser && (
        <form onSubmit={handleSaveChanges} className="bg-white p-6 rounded-lg shadow space-y-4 mb-8 border border-indigo-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-1">
            A Editar Utilizador: <span className="font-normal">{editingUser.email || editingUser.nome || editingUser.id}</span>
          </h2>
          
          {/* Seleção de Role */}
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Nível de Acesso (Role)*</label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={editingUser.id === masterCurrentUser?.uid && editingUser.role === 'master'} // Impede master de mudar seu próprio role se já for master
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

          {/* Seleção de Hotéis Permitidos (apenas para não-master) */}
          {selectedRole !== 'master' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotéis Permitidos</label>
              {loadingHoteis ? <p>A carregar hotéis...</p> : hoteis.length === 0 ? <p>Nenhum hotel cadastrado para seleção.</p> : (
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                  {hoteis.map(hotel => (
                    <label key={hotel.id} htmlFor={`hotel-${hotel.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        id={`hotel-${hotel.id}`}
                        value={hotel.id}
                        checked={selectedHoteisPermitidos.includes(hotel.id)}
                        onChange={() => handleHotelPermissionChange(hotel.id)}
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
            <button type="button" onClick={resetEditForm} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* Lista de Utilizadores */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Utilizadores Registados</h2>
        {loadingUsers ? (
          <p>A carregar utilizadores...</p>
        ) : users.length === 0 ? (
          <p>Nenhum utilizador encontrado (além do próprio master, se filtrado).</p>
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
                        disabled={user.id === masterCurrentUser?.uid && user.role === 'master'} // Opcional: Desabilitar edição do próprio master aqui
                      >
                        Editar
                      </button>
                      {/* A exclusão de utilizadores deve ser feita com muito cuidado, geralmente no Firebase Auth console. */}
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

