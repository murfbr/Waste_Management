// src/pages/PaginaAdminEmpresasColeta.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import MessageBox from '../components/MessageBox';

const CATEGORIAS_RESIDUO_PADRAO = ["Reciclável", "Não Reciclável", "Rejeito"];

export default function PaginaAdminEmpresasColeta() {
  const { db, userProfile, currentUser } = useContext(AuthContext);

  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [tiposResiduoSelecionados, setTiposResiduoSelecionados] = useState([]); 
  const [ativo, setAtivo] = useState(true);

  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [editingEmpresaId, setEditingEmpresaId] = useState(null); 

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  useEffect(() => {
    if (!db) { 
      setLoadingEmpresas(false);
      return;
    }
    setLoadingEmpresas(true);
    const q = query(collection(db, "empresasColeta"), orderBy("nomeFantasia")); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const empresasData = [];
      querySnapshot.forEach((doc) => {
        empresasData.push({ id: doc.id, ...doc.data() });
      });
      setEmpresas(empresasData);
      setLoadingEmpresas(false);
    }, (error) => {
      console.error("Erro ao carregar empresas de coleta: ", error);
      showMessage("Erro ao carregar empresas.", true);
      setLoadingEmpresas(false);
    });
    return () => unsubscribe();
  }, [db]);

  const resetForm = () => {
    setNomeFantasia('');
    setCnpj('');
    setContatoNome('');
    setContatoTelefone('');
    setContatoEmail('');
    setTiposResiduoSelecionados([]);
    setAtivo(true);
    setEditingEmpresaId(null);
    setIsSubmitting(false);
  };

  const handleEdit = (empresa) => {
    setEditingEmpresaId(empresa.id);
    setNomeFantasia(empresa.nomeFantasia || '');
    setCnpj(empresa.cnpj || '');
    setContatoNome(empresa.contatoNome || '');
    setContatoTelefone(empresa.contatoTelefone || '');
    setContatoEmail(empresa.contatoEmail || '');
    setTiposResiduoSelecionados(empresa.tiposResiduo && Array.isArray(empresa.tiposResiduo) ? empresa.tiposResiduo : []); 
    setAtivo(empresa.ativo !== undefined ? empresa.ativo : true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };
  
  const handleDelete = async (empresaId) => {
    if (!db || !userProfile || userProfile.role !== 'master') {
        showMessage("Apenas administradores master podem excluir empresas.", true);
        return;
    }
    if (window.confirm("Tem certeza que deseja excluir esta empresa de coleta? Esta ação não pode ser desfeita.")) {
        try {
            await deleteDoc(doc(db, "empresasColeta", empresaId));
            showMessage("Empresa de coleta excluída com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir empresa de coleta: ", error);
            showMessage("Erro ao excluir empresa. Tente novamente.", true);
        }
    }
  };

  const handleTipoResiduoChange = (tipo) => {
    setTiposResiduoSelecionados(prevSelecionados => 
      prevSelecionados.includes(tipo)
        ? prevSelecionados.filter(t => t !== tipo)
        : [...prevSelecionados, tipo]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); 
    if (!db || !currentUser || !userProfile || userProfile.role !== 'master') {
      showMessage("Apenas administradores master podem adicionar/editar empresas.", true);
      setIsSubmitting(false);
      return;
    }

    if (!nomeFantasia.trim()) {
      showMessage("O nome fantasia é obrigatório.", true);
      setIsSubmitting(false);
      return;
    }
    if (!cnpj.trim()) {
      showMessage("O CNPJ é obrigatório.", true);
      setIsSubmitting(false);
      return;
    }
    if (tiposResiduoSelecionados.length === 0) {
      showMessage("Selecione pelo menos um tipo de resíduo que a empresa coleta.", true);
      setIsSubmitting(false);
      return;
    }

    const empresaData = {
      nomeFantasia: nomeFantasia.trim(),
      cnpj: cnpj.trim(),
      contatoNome: contatoNome.trim(),
      contatoTelefone: contatoTelefone.trim(),
      contatoEmail: contatoEmail.trim(),
      tiposResiduo: tiposResiduoSelecionados, 
      ativo,
      ultimaModificacao: serverTimestamp(),
      modificadoPor: currentUser.uid,
    };

    try {
      if (editingEmpresaId) {
        const empresaRef = doc(db, "empresasColeta", editingEmpresaId);
        await updateDoc(empresaRef, empresaData);
        showMessage("Empresa atualizada com sucesso!");
      } else {
        empresaData.criadoPor = currentUser.uid;
        empresaData.dataCadastro = serverTimestamp(); 
        await addDoc(collection(db, "empresasColeta"), empresaData);
        showMessage("Empresa de coleta adicionada com sucesso!");
      }
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar empresa de coleta: ", error);
      showMessage("Erro ao salvar empresa. Tente novamente.", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile && currentUser) { 
    return <div className="p-8 text-center">A carregar perfil do utilizador...</div>;
  }
  if (!userProfile || userProfile.role !== 'master') {
    return <div className="p-8 text-center text-red-600">Acesso negado. Apenas administradores master podem aceder a esta página.</div>;
  }

  // Estilos Tailwind para inputs e labels (como você já tinha e gostou)
  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Empresas de Coleta</h1>
      <MessageBox message={message} isError={isError} />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">{editingEmpresaId ? "Editar Empresa" : "Adicionar Nova Empresa"}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nomeFantasiaEmpresa" className={labelStyle}>Nome Fantasia*</label>
            <input type="text" id="nomeFantasiaEmpresa" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} required className={inputStyle} />
          </div>
          <div>
            <label htmlFor="cnpjEmpresa" className={labelStyle}>CNPJ*</label>
            <input type="text" id="cnpjEmpresa" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required className={inputStyle} />
          </div>
          <div>
            <label htmlFor="contatoNomeEmpresa" className={labelStyle}>Nome do Contato</label>
            <input type="text" id="contatoNomeEmpresa" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} className={inputStyle} />
          </div>
          <div>
            <label htmlFor="contatoTelefoneEmpresa" className={labelStyle}>Telefone do Contato</label>
            <input type="tel" id="contatoTelefoneEmpresa" value={contatoTelefone} onChange={(e) => setContatoTelefone(e.target.value)} className={inputStyle} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="contatoEmailEmpresa" className={labelStyle}>Email do Contato</label>
            <input type="email" id="contatoEmailEmpresa" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)} className={inputStyle} />
          </div>

          <div className="md:col-span-2">
            <label className={`${labelStyle} mb-1`}>Tipos de Resíduo Coletados pela Empresa*</label>
            <div className="mt-2 space-y-2 sm:space-y-0 sm:flex sm:space-x-4 sm:flex-wrap">
              {CATEGORIAS_RESIDUO_PADRAO.map((tipo) => (
                <label key={tipo} htmlFor={`tipoEmpresa-${tipo}`} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`tipoEmpresa-${tipo}`}
                    name="tiposResiduo"
                    value={tipo}
                    checked={tiposResiduoSelecionados.includes(tipo)}
                    onChange={() => handleTipoResiduoChange(tipo)}
                    className={`${checkboxStyle} mr-2`}
                  />
                  <span className="ml-2 text-sm text-gray-700">{tipo}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="ativoEmpresa" className="flex items-center text-sm font-medium text-gray-700">
              <input type="checkbox" id="ativoEmpresa" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className={`${checkboxStyle} mr-2`} />
              Empresa Ativa
            </label>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-3">
            {editingEmpresaId && (
                 <button 
                    type="button" 
                    onClick={resetForm} 
                    // Estilo Tailwind direto para botão secundário
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar Edição
                </button>
            )}
            <button 
                type="submit" 
                // Estilo Tailwind direto para botão primário
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isSubmitting}
            >
                {isSubmitting ? (editingEmpresaId ? "A Atualizar..." : "A Adicionar...") : (editingEmpresaId ? "Atualizar Empresa" : "Adicionar Empresa")}
            </button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Empresas Cadastradas</h2>
        {loadingEmpresas ? (
          <p>A carregar empresas...</p>
        ) : empresas.length === 0 ? (
          <p>Nenhuma empresa de coleta cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="th-table uppercase tracking-wider">Nome Fantasia</th>
                  <th className="th-table uppercase tracking-wider">CNPJ</th>
                  <th className="th-table uppercase tracking-wider">Tipos de Resíduo</th>
                  <th className="th-table uppercase tracking-wider">Status</th>
                  <th className="th-table text-right normal-case tracking-normal">Ações</th> {/* Mantido normal-case para 'Ações' para melhor alinhamento visual */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empresas.map((empresa) => (
                  <tr key={empresa.id}>
                    <td className="td-table font-medium text-gray-900">{empresa.nomeFantasia}</td>
                    <td className="td-table">{empresa.cnpj || '-'}</td>
                    <td className="td-table">
                        {empresa.tiposResiduo && Array.isArray(empresa.tiposResiduo) && empresa.tiposResiduo.length > 0 
                          ? empresa.tiposResiduo.join(', ') 
                          : empresa.tiposResiduo && typeof empresa.tiposResiduo === 'string' 
                            ? empresa.tiposResiduo 
                            : '-'} 
                    </td>
                    <td className="td-table">
                      <span className={`status-badge ${empresa.ativo ? 'status-active' : 'status-inactive'}`}>
                        {empresa.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="td-table-actions text-right"> {/* td-table-actions do seu main.css deve ter text-right */}
                      <div className="flex justify-end items-center space-x-2">
                        <button onClick={() => handleEdit(empresa)} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium hover:underline">Editar</button>
                        <button 
                            onClick={() => handleDelete(empresa.id)} 
                            // Estilo Tailwind direto para botão de perigo pequeno
                            className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Excluir
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
