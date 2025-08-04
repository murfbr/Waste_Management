import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import AuthContext from '../../context/AuthContext';

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

export default function DocumentosCliente({ clienteId, clienteNome }) {
    const { db } = useContext(AuthContext);
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!db || !clienteId) {
            setDocumentos([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(''); // Limpa o erro ao trocar de cliente
        const q = query(
            collection(db, "documentosFiscais"),
            where("clienteId", "==", clienteId),
            orderBy("dataEmissao", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const docsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dataEmissao: doc.data().dataEmissao.toDate()
            }));
            setDocumentos(docsData);
            setLoading(false);
        }, (err) => {
            console.error("Erro ao buscar documentos:", err);
            setError("Não foi possível carregar os documentos.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, clienteId]);

    // O return agora é envolvido por um container que já estava na PaginaGestaoMTR
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Histórico de Documentos para: {clienteNome || '...'}
            </h2>
            {error && <div className="text-center p-4 text-red-600 bg-red-50 rounded-md">{error}</div>}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de emissão do MTR</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peso total (kg)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de resíduo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transportador</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinação</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">MTR</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">CDF</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="8" className="text-center p-4 text-gray-500">Carregando histórico...</td></tr>
                        ) : documentos.length === 0 ? (
                            <tr><td colSpan="8" className="text-center p-4 text-gray-500">Nenhum documento encontrado.</td></tr>
                        ) : (
                            documentos.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.dataEmissao.toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.dataEmissao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.pesoTotal}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.tipoResiduo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.transportador}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.destinacao}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        {doc.mtrFileUrl ? <a href={doc.mtrFileUrl} target="_blank" rel="noopener noreferrer" download className="text-indigo-600 hover:text-indigo-900 font-medium"><DownloadIcon /> {doc.numeroMTR || 'Baixar'}</a> : <span>-</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        {doc.cdfFileUrl ? <a href={doc.cdfFileUrl} target="_blank" rel="noopener noreferrer" download className="text-indigo-600 hover:text-indigo-900 font-medium"><DownloadIcon /> {doc.numeroCDF || 'Baixar'}</a> : <span>-</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}