import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import DocumentosCliente from '../../components/app/DocumentosCliente'; // Importando o componente reutilizável

export default function PaginaDocumentacao() {
    const { userAllowedClientes, loadingUserClientes } = useContext(AuthContext);
    const [selectedClienteId, setSelectedClienteId] = useState('');

    // Define o cliente padrão assim que a lista for carregada
    useEffect(() => {
        if (!loadingUserClientes && userAllowedClientes.length > 0 && !selectedClienteId) {
            setSelectedClienteId(userAllowedClientes[0].id);
        }
    }, [loadingUserClientes, userAllowedClientes, selectedClienteId]);

    const selectedCliente = userAllowedClientes.find(c => c.id === selectedClienteId);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Documentação de Clientes</h1>

            {/* Seletor de Cliente */}
            <div className="max-w-sm">
                <label htmlFor="cliente-selector-docs" className="block text-sm font-medium text-gray-700 mb-1">
                    Selecione o Cliente
                </label>
                <select
                    id="cliente-selector-docs"
                    value={selectedClienteId}
                    onChange={(e) => setSelectedClienteId(e.target.value)}
                    disabled={loadingUserClientes || userAllowedClientes.length === 0}
                    className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {loadingUserClientes && <option>Carregando clientes...</option>}
                    {!loadingUserClientes && userAllowedClientes.length === 0 && <option>Nenhum cliente disponível</option>}
                    {userAllowedClientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                        </option>
                    ))}
                </select>
            </div>

            {/* Renderiza o componente de tabela, passando os dados necessários */}
            {selectedClienteId ? (
                <DocumentosCliente 
                    clienteId={selectedClienteId} 
                    clienteNome={selectedCliente?.nome} 
                />
            ) : (
                !loadingUserClientes && <div className="text-center p-4">Por favor, selecione um cliente para ver os documentos.</div>
            )}
        </div>
    );
}