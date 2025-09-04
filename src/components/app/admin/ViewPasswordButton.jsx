import React, { useState, useContext } from 'react';
import { httpsCallable } from 'firebase/functions';
import AuthContext from '../../../context/AuthContext';

const VISIBILITY_TIMEOUT = 15000; // 15 segundos

export default function ViewPasswordButton({ clienteId }) {
  const { functions } = useContext(AuthContext);
  
  const [password, setPassword] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getIneaPassword = httpsCallable(functions, 'getIneaPassword');

  const handleViewPassword = async () => {
    if (!clienteId) {
      setError("ID do cliente não fornecido.");
      return;
    }
    
    setIsLoading(true);
    setPassword(null);
    setError('');

    try {
      const result = await getIneaPassword({ clienteId });
      const plainPassword = result.data.password;
      
      if (plainPassword) {
        setPassword(plainPassword);
        setTimeout(() => {
          setPassword(null);
        }, VISIBILITY_TIMEOUT);
      } else {
        setError("Senha não retornada.");
      }
    } catch (err) {
      console.error("Erro ao buscar senha:", err);
      setError("Falha ao buscar a senha.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password);
    }
  };

  if (isLoading) {
    return <span className="text-sm text-gray-500 italic">Carregando...</span>;
  }
  
  if (error) {
    return <span className="text-sm text-red-600">{error}</span>;
  }

  if (password) {
    return (
      <div className="flex items-center gap-2 p-1 bg-gray-100 border rounded-md">
        <span className="text-sm font-mono font-semibold text-gray-800">{password}</span>
        <button 
          type="button"
          onClick={handleCopyToClipboard}
          className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          title="Copiar para a área de transferência"
        >
          Copiar
        </button>
      </div>
    );
  }

  return (
    <button 
      type="button"
      onClick={handleViewPassword}
      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
    >
      Ver Senha
    </button>
  );
}