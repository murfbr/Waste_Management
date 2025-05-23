// src/pages/PaginaAdminHoteis.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import MessageBox from '../components/MessageBox';

// Define as categorias de resíduo padrão para seleção nos contratos
const CATEGORIAS_RESIDUO_CONTRATO = ["Reciclável", "Não Reciclável", "Rejeito"];

export default function PaginaAdminHoteis() {
  const { db, userProfile, currentUser } = useContext(AuthContext);

  // Estados para o formulário do hotel
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [ativo, setAtivo] = useState(true);
  
  // NOVO: Estado para gerir os contratos de coleta no formulário
  // Cada item: { empresaColetaId: '', tiposResiduoColetados: [] }
  const [contratosColetaForm, setContratosColetaForm] = useState([]); 

  // Estados para a lista e edição
  const [hoteis, setHoteis] = useState([]);
  const [loadingHoteis, setLoadingHoteis] = useState(true);
  const [editingHotelId, setEditingHotelId] = useState(null);
  
  // NOVO: Estado para armazenar a lista de empresas de coleta disponíveis
  const [empresasColetaDisponiveis, setEmpresasColetaDisponiveis] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  // Carregar hotéis
  useEffect(() => {
    if (!db) {
      setLoadingHoteis(false);
      return;
    }
    setLoadingHoteis(true);
    const q = query(collection(db, "hoteis"), orderBy("nome"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const hoteisData = [];
      querySnapshot.forEach((doc) => {
        hoteisData.push({ id: doc.id, ...doc.data() });
      });
      setHoteis(hoteisData);
      setLoadingHoteis(false);
    }, (error) => {
      console.error("Erro ao carregar hotéis: ", error);
      showMessage("Erro ao carregar hotéis.", true);
      setLoadingHoteis(false);
    });
    return () => unsubscribe();
  }, [db]);

  // NOVO: Carregar empresas de coleta para o dropdown
  useEffect(() => {
    if (!db) {
      setLoadingEmpresas(false);
      return;
    }
    setLoadingEmpresas(true);
    const qEmpresas = query(collection(db, "empresasColeta"), orderBy("nomeFantasia"));
    const unsubscribeEmpresas = onSnapshot(qEmpresas, (querySnapshot) => {
      const empresasData = [];
      querySnapshot.forEach((doc) => {
        empresasData.push({ id: doc.id, ...doc.data() });
      });
      setEmpresasColetaDisponiveis(empresasData);
      setLoadingEmpresas(false);
    }, (error) => {
      console.error("Erro ao carregar empresas de coleta para dropdown: ", error);
      // Não mostra mensagem de erro aqui para não sobrepor outras mensagens do formulário
      setLoadingEmpresas(false);
    });
    return () => unsubscribeEmpresas();
  }, [db]);


  const resetForm = () => {
    setNome('');
    setCnpj('');
    setEndereco('');
    setCidade('');
    setEstado('');
    setLogoUrl('');
    setAtivo(true);
    setContratosColetaForm([{ empresaColetaId: '', tiposResiduoColetados: [] }]); // Reseta com um contrato vazio
    setEditingHotelId(null);
  };

  const handleEdit = (hotel) => {
    setEditingHotelId(hotel.id);
    setNome(hotel.nome || '');
    setCnpj(hotel.cnpj || '');
    setEndereco(hotel.endereco || '');
    setCidade(hotel.cidade || '');
    setEstado(hotel.estado || '');
    setLogoUrl(hotel.logoUrl || '');
    setAtivo(hotel.ativo !== undefined ? hotel.ativo : true);
    // Popula os contratos de coleta para edição
    // O nome do campo no Firestore é 'contratosColeta', mas para o formulário usamos 'tiposResiduoColetados'
    // e o seu nome para o campo na empresa é 'tiposResiduo'
    // No hotel, você usou 'tiposResiduoColetados' (confirmado na última revisão do Firebase)
    setContratosColetaForm(hotel.contratosColeta && hotel.contratosColeta.length > 0 
        ? hotel.contratosColeta.map(c => ({ ...c, tiposResiduoColetados: Array.isArray(c.tiposResiduoColetados) ? c.tiposResiduoColetados : [] })) 
        : [{ empresaColetaId: '', tiposResiduoColetados: [] }] // Inicia com um se não houver
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (hotelId) => {
    // ... (lógica de delete inalterada)
    if (!db || !userProfile || userProfile.role !== 'master') {
        showMessage("Apenas administradores master podem excluir hotéis.", true);
        return;
    }
    if (window.confirm("Tem certeza que deseja excluir este hotel?")) {
        try {
            await deleteDoc(doc(db, "hoteis", hotelId));
            showMessage("Hotel excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir hotel: ", error);
            showMessage("Erro ao excluir hotel. Tente novamente.", true);
        }
    }
  };

  // Funções para gerir os contratos de coleta no formulário
  const handleContratoChange = (index, field, value) => {
    const updatedContratos = [...contratosColetaForm];
    updatedContratos[index][field] = value;
    setContratosColetaForm(updatedContratos);
  };

  const handleContratoTipoResiduoChange = (contratoIndex, tipo) => {
    const updatedContratos = [...contratosColetaForm];
    const currentTipos = updatedContratos[contratoIndex].tiposResiduoColetados || [];
    if (currentTipos.includes(tipo)) {
      updatedContratos[contratoIndex].tiposResiduoColetados = currentTipos.filter(t => t !== tipo);
    } else {
      updatedContratos[contratoIndex].tiposResiduoColetados = [...currentTipos, tipo];
    }
    setContratosColetaForm(updatedContratos);
  };

  const addContratoForm = () => {
    setContratosColetaForm([...contratosColetaForm, { empresaColetaId: '', tiposResiduoColetados: [] }]);
  };

  const removeContratoForm = (index) => {
    const updatedContratos = [...contratosColetaForm];
    updatedContratos.splice(index, 1);
    setContratosColetaForm(updatedContratos);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (validações de permissão e campos básicos do hotel inalteradas) ...
    if (!db || !currentUser || !userProfile || userProfile.role !== 'master') {
      showMessage("Apenas administradores master podem adicionar/editar hotéis.", true);
      return;
    }
    if (!nome.trim()) {
      showMessage("O nome do hotel é obrigatório.", true);
      return;
    }

    // Filtra contratos de coleta válidos (com empresa selecionada)
    const validContratosColeta = contratosColetaForm.filter(c => c.empresaColetaId && c.tiposResiduoColetados.length > 0);

    const hotelData = {
      nome: nome.trim(),
      cnpj: cnpj.trim(),
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      logoUrl: logoUrl.trim(),
      ativo,
      contratosColeta: validContratosColeta, // Adiciona os contratos válidos
      ultimaModificacao: serverTimestamp(),
      modificadoPor: currentUser.uid,
    };

    try {
      if (editingHotelId) {
        const hotelRef = doc(db, "hoteis", editingHotelId);
        await updateDoc(hotelRef, hotelData);
        showMessage("Hotel atualizado com sucesso!");
      } else {
        hotelData.criadoPor = currentUser.uid;
        hotelData.dataCriacao = serverTimestamp();
        await addDoc(collection(db, "hoteis"), hotelData);
        showMessage("Hotel adicionado com sucesso!");
      }
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar hotel: ", error);
      showMessage("Erro ao salvar hotel. Tente novamente.", true);
    }
  };

  if (!userProfile && currentUser) {
    return <div className="p-8 text-center">A carregar perfil do utilizador...</div>;
  }
  if (!userProfile || userProfile.role !== 'master') {
    return <div className="p-8 text-center text-red-600">Acesso negado. Apenas administradores master podem aceder a esta página.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Hotéis</h1>
      <MessageBox message={message} isError={isError} />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6"> {/* Aumentado space-y do form */}
        <h2 className="text-xl font-semibold text-gray-700">{editingHotelId ? "Editar Hotel" : "Adicionar Novo Hotel"}</h2>
        
        {/* Campos básicos do hotel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ... (campos nome, cnpj, endereco, cidade, estado, logoUrl, ativo - inalterados) ... */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Hotel*</label>
            <input type="text" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ</label>
            <input type="text" id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço</label>
            <input type="text" id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">Cidade</label>
            <input type="text" id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado (UF)</label>
            <input type="text" id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} maxLength="2" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">URL da Logo</label>
            <input type="url" id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://exemplo.com/logo.png" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="ativoHotel" className="flex items-center text-sm font-medium text-gray-700">
              <input type="checkbox" id="ativoHotel" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2" />
              Hotel Ativo
            </label>
          </div>
        </div>

        {/* NOVA SECÇÃO: Contratos de Coleta */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">Contratos de Coleta</h3>
          {contratosColetaForm.map((contrato, index) => (
            <div key={index} className="border p-4 rounded-md mb-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                 <p className="font-medium text-gray-700">Contrato #{index + 1}</p>
                 {contratosColetaForm.length > 1 && (
                    <button 
                        type="button" 
                        onClick={() => removeContratoForm(index)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                        Remover Contrato
                    </button>
                 )}
              </div>
              <div>
                <label htmlFor={`empresaColeta-${index}`} className="block text-sm font-medium text-gray-700">Empresa de Coleta*</label>
                <select
                  id={`empresaColeta-${index}`}
                  value={contrato.empresaColetaId}
                  onChange={(e) => handleContratoChange(index, 'empresaColetaId', e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione uma empresa</option>
                  {empresasColetaDisponiveis.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nomeFantasia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipos de Resíduo Coletados por esta Empresa (para este hotel)*</label>
                <div className="mt-1 space-y-1 sm:flex sm:space-y-0 sm:space-x-3">
                  {CATEGORIAS_RESIDUO_CONTRATO.map(tipo => (
                    <label key={tipo} htmlFor={`contrato-${index}-tipo-${tipo}`} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`contrato-${index}-tipo-${tipo}`}
                        checked={(contrato.tiposResiduoColetados || []).includes(tipo)}
                        onChange={() => handleContratoTipoResiduoChange(index, tipo)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button 
            type="button" 
            onClick={addContratoForm}
            className="mt-2 px-3 py-1.5 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            + Adicionar Contrato de Coleta
          </button>
        </div>


        <div className="flex justify-end space-x-3 pt-3">
            {/* ... (botões Cancelar Edição e Adicionar/Atualizar Hotel - inalterados) ... */}
            {editingHotelId && (
                 <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Cancelar Edição
                </button>
            )}
            <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {editingHotelId ? "Atualizar Hotel" : "Adicionar Hotel"}
            </button>
        </div>
      </form>

      {/* Lista de Hotéis Cadastrados (inalterada por agora, mas exibirá os dados atualizados) */}
      <div className="bg-white p-6 rounded-lg shadow">
        {/* ... (código da tabela de listagem de hotéis inalterado) ... */}
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Hotéis Cadastrados</h2>
        {loadingHoteis ? (
          <p>A carregar hotéis...</p>
        ) : hoteis.length === 0 ? (
          <p>Nenhum hotel cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hoteis.map((hotel) => (
                  <tr key={hotel.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hotel.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hotel.cidade || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hotel.estado || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${hotel.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {hotel.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleEdit(hotel)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                      <button onClick={() => handleDelete(hotel.id)} className="text-red-600 hover:text-red-900">Excluir</button>
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
