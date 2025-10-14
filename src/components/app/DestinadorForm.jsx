// src/pages/DestinadorForm.jsx (VERSÃO CORRIGIDA COM ACESSO DIRETO AO DB)
import React, { useState, useEffect, useContext } from 'react'; // Adicionado 'useContext'
import AuthContext from '../../context/AuthContext'; // Importado o AuthContext
import { collection, getDocs, query } from 'firebase/firestore'; // Importado as funções do Firestore

// Lista de estados para o dropdown
const estadosBrasileiros = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].sort();

export default function DestinadorForm({ initialData, onSubmit, onCancel, isEditing }) {
  const { db } = useContext(AuthContext); // Acessando o 'db' do context

  // Estados para os campos do formulário
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [codigoUnidade, setCodigoUnidade] = useState('');
  const [enderecoCompleto, setEnderecoCompleto] = useState('');
  const [estado, setEstado] = useState('');
  const [ativo, setAtivo] = useState(true);

  // Estados para a lógica de tratamentos
  const [tratamentosDisponiveis, setTratamentosDisponiveis] = useState([]);
  const [tratamentosSelecionados, setTratamentosSelecionados] = useState([]);
  const [isLoadingTratamentos, setIsLoadingTratamentos] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para popular o formulário ao editar
  useEffect(() => {
    if (isEditing && initialData) {
      setNome(initialData.nome || '');
      setCnpj(initialData.cnpj || '');
      setCodigoUnidade(initialData.codigoUnidade || '');
      setEnderecoCompleto(initialData.enderecoCompleto || '');
      setEstado(initialData.estado || '');
      setTratamentosSelecionados(initialData.tratamentosOferecidos || []);
      setAtivo(initialData.ativo !== undefined ? initialData.ativo : true);
    } else {
        setNome(''); setCnpj(''); setCodigoUnidade(''); setEnderecoCompleto(''); setEstado('');
        setTratamentosSelecionados([]); setAtivo(true);
    }
  }, [initialData, isEditing]);

  // Efeito para buscar os tratamentos DIRETAMENTE DO FIRESTORE quando o estado muda
  useEffect(() => {
    if (!estado || !db) {
      setTratamentosDisponiveis([]);
      setTratamentosSelecionados([]);
      return;
    }

    const fetchTratamentos = async () => {
      setIsLoadingTratamentos(true);
      setTratamentosDisponiveis([]);
      
      try {
        // Caminho da subcoleção no Firestore: /Mtr/{estado}/Tratamento
        const listPath = collection(db, 'Mtr', estado.toUpperCase(), 'tratamento');
        const q = query(listPath);
        const querySnapshot = await getDocs(q);
        
        const nomesTratamentos = querySnapshot.docs
          .map(doc => doc.data().traDescricao) // Pega a descrição de cada tratamento
          .sort(); // Ordena alfabeticamente
        
        setTratamentosDisponiveis(nomesTratamentos);

      } catch (error) {
        console.error("Erro na busca de tratamentos:", error);
      } finally {
        setIsLoadingTratamentos(false);
      }
    };

    fetchTratamentos();
  }, [estado, db]); // Roda novamente se o estado ou o db mudarem

  const handleTratamentoChange = (tratamento) => {
    setTratamentosSelecionados(prev => 
      prev.includes(tratamento) 
        ? prev.filter(t => t !== tratamento) 
        : [...prev, tratamento]
    );
  };
  
  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!nome || !cnpj || !estado || !codigoUnidade) {
        alert("Nome, CNPJ, Código da Unidade e Estado são obrigatórios.");
        setIsSubmitting(false);
        return;
    }

    const destinadorData = {
      nome: nome.trim(),
      cnpj: cnpj.trim(),
      codigoUnidade: codigoUnidade.trim(),
      enderecoCompleto: enderecoCompleto.trim(),
      estado,
      ativo,
      tratamentosOferecidos: tratamentosSelecionados,
    };

    await onSubmit(destinadorData);
    setIsSubmitting(false);
  };

  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";

  return (
    <form onSubmit={handleLocalSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 border border-gray-300">
      <h2 className="text-xl font-semibold text-gray-700">{isEditing ? "Editar Destinador" : "Adicionar Novo Destinador"}</h2>
      
      <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <legend className="sr-only">Informações Básicas do Destinador</legend>
        <div className="md:col-span-2">
          <label htmlFor="form-destinador-nome" className={labelStyle}>Nome / Razão Social*</label>
          <input type="text" id="form-destinador-nome" value={nome} onChange={(e) => setNome(e.target.value)} required className={inputStyle} />
        </div>
        <div>
          <label htmlFor="form-destinador-cnpj" className={labelStyle}>CNPJ*</label>
          <input type="text" id="form-destinador-cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required className={inputStyle} />
        </div>
         <div>
          <label htmlFor="form-destinador-codigo" className={labelStyle}>Código da Unidade (SIGOR, etc)*</label>
          <input type="text" id="form-destinador-codigo" value={codigoUnidade} onChange={(e) => setCodigoUnidade(e.target.value)} required className={inputStyle} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="form-destinador-endereco" className={labelStyle}>Endereço Completo</label>
          <input type="text" id="form-destinador-endereco" value={enderecoCompleto} onChange={(e) => setEnderecoCompleto(e.target.value)} className={inputStyle} />
        </div>
        <div>
            <label htmlFor="form-destinador-estado" className={labelStyle}>Estado*</label>
            <select id="form-destinador-estado" value={estado} onChange={(e) => setEstado(e.target.value)} required className={inputStyle}>
                <option value="">Selecione o Estado</option>
                {estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-medium text-gray-900">Tratamentos Oferecidos</legend>
        <div className="mt-2 p-4 border border-gray-200 rounded-md min-h-[100px]">
            {!estado && <p className="text-sm text-gray-500">Selecione um Estado para carregar as opções de tratamento.</p>}
            {isLoadingTratamentos && <p className="text-sm text-gray-500">Carregando tratamentos...</p>}
            {estado && !isLoadingTratamentos && tratamentosDisponiveis.length === 0 && <p className="text-sm text-red-500">Nenhum tratamento encontrado para este estado. Verifique as regras de segurança ou se a lista foi sincronizada.</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                {tratamentosDisponiveis.map(tratamento => (
                    <label key={tratamento} className="flex items-center">
                        <input
                            type="checkbox"
                            checked={tratamentosSelecionados.includes(tratamento)}
                            onChange={() => handleTratamentoChange(tratamento)}
                            className={`${checkboxStyle} mr-2`}
                        />
                        <span className="text-sm">{tratamento}</span>
                    </label>
                ))}
            </div>
        </div>
      </fieldset>

       <div>
        <label htmlFor="form-destinador-ativo" className="flex items-center">
          <input type="checkbox" id="form-destinador-ativo" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className={`${checkboxStyle} mr-2`} />
          <span className={labelStyle}>Destinador Ativo</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Destinador' : 'Adicionar Destinador')}
          </button>
      </div>
    </form>
  );
}