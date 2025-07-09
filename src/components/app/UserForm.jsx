// src/components/app/UserForm.jsx

import React, { useState, useEffect, useMemo } from 'react';

const ALL_ROLES = ["master", "gerente", "operacional"];

export default function UserForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing,
  clientesList,
  loadingClientes,
  currentUserProfile, // Recebe o perfil do usuário logado
}) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState("operacional"); 
  const [clientesPermitidos, setClientesPermitidos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- MELHORIA 1: Lógica de permissão para o gerente ---
  // Determina quais roles o usuário atual pode criar/editar
  const availableRoles = useMemo(() => {
    if (currentUserProfile?.role === 'master') {
      return ALL_ROLES;
    }
    if (currentUserProfile?.role === 'gerente') {
      return ['operacional']; // Gerente só pode criar/editar operacionais
    }
    return [];
  }, [currentUserProfile]);

  useEffect(() => {
    if (isEditing && initialData) {
      setNome(initialData.nome || '');
      setEmail(initialData.email || '');
      setRole(initialData.role || '');
      setClientesPermitidos(Array.isArray(initialData.clientesPermitidos) ? initialData.clientesPermitidos : []);
      setPassword('');
    } else {
      // --- MELHORIA 2: Reseta o formulário para o estado inicial de criação ---
      setNome('');
      setEmail('');
      setPassword('');
      // Define a role padrão com base na permissão do usuário logado
      setRole(availableRoles.length > 0 ? availableRoles[0] : '');
      setClientesPermitidos([]);
    }
  // A dependência `initialData` garante que o formulário resete quando `initialData` se torna nulo (ao clicar em "Adicionar Novo")
  }, [initialData, isEditing, availableRoles]);

  const handleClientePermissionChange = (clienteId) => {
    setClientesPermitidos(prev =>
      prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = {
      nome,
      email,
      password,
      role,
      clientesPermitidos: role === 'master' ? [] : clientesPermitidos,
    };

    if (isEditing && !password) {
      delete formData.password;
    }
    
    if (isEditing) {
        formData.targetUid = initialData.id;
    }

    await onSubmit(formData);
    setIsSubmitting(false);
  };

  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4 mb-8 border border-indigo-300">
      <h2 className="text-xl font-semibold text-gray-700 mb-1">
        {isEditing ? `A Editar Utilizador: ${initialData.email}` : 'Criar Novo Utilizador'}
      </h2>
      
      <div>
        <label htmlFor="userName" className={labelStyle}>Nome*</label>
        <input type="text" id="userName" value={nome} onChange={(e) => setNome(e.target.value)} required className={inputStyle} />
      </div>

      <div>
        <label htmlFor="userEmail" className={labelStyle}>Email*</label>
        <input type="email" id="userEmail" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputStyle} disabled={isEditing} />
        {isEditing && <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado após a criação.</p>}
      </div>

      {!isEditing && (
        <div>
          <label htmlFor="userPassword" className={labelStyle}>Senha* (mínimo 6 caracteres)</label>
          <input type="password" id="userPassword" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputStyle} />
        </div>
      )}

      <div>
        <label htmlFor="userRole" className={labelStyle}>Nível de Acesso (Role)*</label>
        <select id="userRole" value={role} onChange={(e) => setRole(e.target.value)} required className={inputStyle} disabled={isEditing && initialData.id === currentUserProfile?.id}>
          {/* O dropdown agora usa a lista de roles permitidas */}
          {availableRoles.map(roleOption => (
            <option key={roleOption} value={roleOption}>
              {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
            </option>
          ))}
        </select>
        {isEditing && initialData.id === currentUserProfile?.id && <p className="text-xs text-gray-500 mt-1">Você não pode alterar seu próprio nível de acesso.</p>}
      </div>

      {role !== 'master' && (
        <div>
          <label className={`${labelStyle} mb-1`}>Clientes Permitidos</label>
          {loadingClientes ? <p>A carregar clientes...</p> : clientesList.length === 0 ? <p>Nenhum cliente disponível para atribuição.</p> : (
            <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
              {clientesList.map(cliente => (
                <label key={`cliente-cb-${cliente.id}`} htmlFor={`cliente-cb-${cliente.id}`} className="flex items-center cursor-pointer p-1 hover:bg-gray-50 rounded">
                  <input type="checkbox" id={`cliente-cb-${cliente.id}`} value={cliente.id} checked={clientesPermitidos.includes(cliente.id)} onChange={() => handleClientePermissionChange(cliente.id)} className={`${checkboxStyle} mr-2`} />
                  <span className="ml-2 text-sm text-gray-700">{cliente.nome} ({cliente.cidade || 'N/A'})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      {role === 'master' && <p className="text-sm text-gray-600">Utilizadores "master" têm acesso a todos os clientes por defeito.</p>}

      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" disabled={isSubmitting}>
          {isSubmitting ? "A Salvar..." : (isEditing ? "Atualizar Utilizador" : "Criar Utilizador")}
        </button>
      </div>
    </form>
  );
}
