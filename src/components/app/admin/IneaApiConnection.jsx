import React from 'react';

/**
 * Componente isolado para guardar a funcionalidade de conexão com a API do INEA.
 * Atualmente não está em uso na aplicação.
 * * @param {string} ineaCnpj - Valor do campo CNPJ para a API.
 * @param {function} setIneaCnpj - Função para atualizar o estado do CNPJ.
 * @param {object} testConnectionStatus - Objeto com o status do teste de conexão.
 * @param {function} onTestConnection - Função para disparar o teste.
 * @param {boolean} isEditing - Flag para saber se o formulário está em modo de edição.
 */
export default function IneaApiConnection({
  ineaCnpj,
  setIneaCnpj,
  testConnectionStatus,
  onTestConnection,
  isEditing,
}) {
  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";

  return (
    <>
      <div>
        <label htmlFor="form-cliente-inea-cnpj" className={labelStyle}>CNPJ (para a API)</label>
        <input 
          type="text" 
          id="form-cliente-inea-cnpj" 
          value={ineaCnpj} 
          onChange={(e) => setIneaCnpj(e.target.value)} 
          className={inputStyle} 
          placeholder="CNPJ ou CPF da unidade" 
        />
      </div>

      {isEditing && (
        <div className="md:col-span-2 mt-4 flex items-center space-x-4">
          <button 
            type="button" 
            onClick={onTestConnection} 
            disabled={testConnectionStatus?.loading} 
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {testConnectionStatus?.loading ? 'Testando...' : 'Testar Conexão'}
          </button>
          {testConnectionStatus?.message && (
            <p className={`text-sm ${testConnectionStatus.isError ? 'text-red-600' : 'text-green-600'}`}>
              {testConnectionStatus.message}
            </p>
          )}
        </div>
      )}
    </>
  );
}