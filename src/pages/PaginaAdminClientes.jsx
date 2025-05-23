// src/pages/PaginaAdminClientes.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import MessageBox from '../components/MessageBox';

const CATEGORIAS_RESIDUO_SUGERIDAS_CONTRATO = ["Reciclável", "Não Reciclável", "Rejeito", "Orgânico"];
const CATEGORIAS_PRINCIPAIS_PADRAO = ["Reciclável", "Orgânico", "Rejeito"]; 
// NOVAS CONSTANTES para subtipos de recicláveis
const SUBTIPOS_RECICLAVEIS_COMUNS = ["Papel", "Vidro", "Metal", "Plástico", "Baterias", "Eletrônicos"];

export default function PaginaAdminClientes() {
  const { db, userProfile: masterProfile, currentUser: masterCurrentUser } = useContext(AuthContext);

  // Estados para o formulário do cliente
  const [nome, setNome] = useState('');
  const [rede, setRede] = useState('');
  const [categoriaCliente, setCategoriaCliente] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [ativo, setAtivo] = useState(true);
  
  const [areasPersonalizadasInput, setAreasPersonalizadasInput] = useState('');
  const [categoriasPrincipaisSelecionadas, setCategoriasPrincipaisSelecionadas] = useState([...CATEGORIAS_PRINCIPAIS_PADRAO]); 
  const [outroCategoriaSelecionada, setOutroCategoriaSelecionada] = useState(false);
  const [outroCategoriaInput, setOutroCategoriaInput] = useState('');
  
  const [fazSeparacaoReciclaveisCompleta, setFazSeparacaoReciclaveisCompleta] = useState(false);
  // NOVOS ESTADOS para subtipos de recicláveis
  const [subtiposComunsSelecionados, setSubtiposComunsSelecionados] = useState([]); // Para os checkboxes
  const [outrosSubtiposReciclaveisInput, setOutrosSubtiposReciclaveisInput] = useState(''); // Para o campo de texto de "outros" subtipos

  const [contratosColetaForm, setContratosColetaForm] = useState([{ empresaColetaId: '', tiposResiduoColetados: [] }]);

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [empresasColetaDisponiveis, setEmpresasColetaDisponiveis] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  
  const [editingClienteId, setEditingClienteId] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 6000);
  };

  // Carregar clientes
  useEffect(() => {
    if (!db) return;
    setLoadingClientes(true);
    const q = query(collection(db, "clientes"), orderBy("nome"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setClientes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingClientes(false);
    }, (error) => {
      console.error("Erro ao carregar clientes: ", error);
      showMessage("Erro ao carregar clientes.", true);
      setLoadingClientes(false);
    });
    return () => unsubscribe();
  }, [db]);

  // Carregar empresas de coleta
  useEffect(() => {
    if (!db) return;
    setLoadingEmpresas(true);
    const qEmpresas = query(collection(db, "empresasColeta"), orderBy("nomeFantasia"));
    const unsubscribeEmpresas = onSnapshot(qEmpresas, (querySnapshot) => {
      setEmpresasColetaDisponiveis(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingEmpresas(false);
    }, (error) => {
      console.error("Erro ao carregar empresas de coleta: ", error);
      setLoadingEmpresas(false);
    });
    return () => unsubscribeEmpresas();
  }, [db]);

  const arrayFromString = (str) => str.split(',').map(item => item.trim()).filter(item => item.length > 0);

  const resetForm = () => {
    setNome(''); setRede(''); setCategoriaCliente(''); setLogoUrl(''); setCnpj('');
    setEndereco(''); setCidade(''); setEstado(''); setAtivo(true);
    setAreasPersonalizadasInput(''); 
    setCategoriasPrincipaisSelecionadas([...CATEGORIAS_PRINCIPAIS_PADRAO]);
    setOutroCategoriaSelecionada(false); 
    setOutroCategoriaInput('');      
    setFazSeparacaoReciclaveisCompleta(false); 
    setSubtiposComunsSelecionados([]); // Limpa checkboxes de subtipos
    setOutrosSubtiposReciclaveisInput(''); // Limpa input de outros subtipos
    setContratosColetaForm([{ empresaColetaId: '', tiposResiduoColetados: [] }]);
    setEditingClienteId(null);
  };

  const handleEdit = (cliente) => {
    setEditingClienteId(cliente.id);
    setNome(cliente.nome || '');
    setRede(cliente.rede || '');
    setCategoriaCliente(cliente.categoriaCliente || '');
    setLogoUrl(cliente.logoUrl || '');
    setCnpj(cliente.cnpj || '');
    setEndereco(cliente.endereco || '');
    setCidade(cliente.cidade || '');
    setEstado(cliente.estado || '');
    setAtivo(cliente.ativo !== undefined ? cliente.ativo : true);
    setAreasPersonalizadasInput(cliente.areasPersonalizadas ? cliente.areasPersonalizadas.join(', ') : '');
    
    const categoriasCliente = Array.isArray(cliente.categoriasPrincipaisResiduo) ? cliente.categoriasPrincipaisResiduo : [];
    const categoriasPadraoSelecionadas = categoriasCliente.filter(cat => CATEGORIAS_PRINCIPAIS_PADRAO.includes(cat));
    const categoriaOutro = categoriasCliente.find(cat => !CATEGORIAS_PRINCIPAIS_PADRAO.includes(cat));
    
    setCategoriasPrincipaisSelecionadas(categoriasPadraoSelecionadas.length > 0 ? categoriasPadraoSelecionadas : [...CATEGORIAS_PRINCIPAIS_PADRAO]);
    if (categoriaOutro) {
      setOutroCategoriaSelecionada(true);
      setOutroCategoriaInput(categoriaOutro);
    } else {
      setOutroCategoriaSelecionada(false);
      setOutroCategoriaInput('');
    }

    setFazSeparacaoReciclaveisCompleta(cliente.fazSeparacaoReciclaveisCompleta || false);
    // Popula os subtipos de recicláveis
    const todosSubtiposCliente = Array.isArray(cliente.tiposReciclaveisPersonalizados) ? cliente.tiposReciclaveisPersonalizados : [];
    const comunsSelecionados = todosSubtiposCliente.filter(subtipo => SUBTIPOS_RECICLAVEIS_COMUNS.includes(subtipo));
    const outrosSubtipos = todosSubtiposCliente.filter(subtipo => !SUBTIPOS_RECICLAVEIS_COMUNS.includes(subtipo));
    setSubtiposComunsSelecionados(comunsSelecionados);
    setOutrosSubtiposReciclaveisInput(outrosSubtipos.join(', '));

    setContratosColetaForm(cliente.contratosColeta && cliente.contratosColeta.length > 0 
        ? cliente.contratosColeta.map(c => ({ 
            empresaColetaId: c.empresaColetaId || '', 
            tiposResiduoColetados: Array.isArray(c.tiposResiduoColetados) ? c.tiposResiduoColetados : [] 
          }))
        : [{ empresaColetaId: '', tiposResiduoColetados: [] }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDelete = async (clienteId) => {
    // ... (código inalterado)
    if (!db || !masterProfile || masterProfile.role !== 'master') return showMessage("Ação não permitida.", true);
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
        try {
            await deleteDoc(doc(db, "clientes", clienteId));
            showMessage("Cliente excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir cliente: ", error);
            showMessage("Erro ao excluir cliente.", true);
        }
    }
  };

  const handleContratoChange = (index, field, value) => {
    // ... (código inalterado)
    const updatedContratos = [...contratosColetaForm];
    updatedContratos[index][field] = value;
    if (field === 'empresaColetaId') {
      updatedContratos[index].tiposResiduoColetados = [];
    }
    setContratosColetaForm(updatedContratos);
  };

  const handleContratoTipoResiduoChange = (contratoIndex, tipo) => {
    // ... (código inalterado)
    const updatedContratos = [...contratosColetaForm];
    const currentTipos = updatedContratos[contratoIndex].tiposResiduoColetados || [];
    updatedContratos[contratoIndex].tiposResiduoColetados = currentTipos.includes(tipo)
        ? currentTipos.filter(t => t !== tipo)
        : [...currentTipos, tipo];
    setContratosColetaForm(updatedContratos);
  };

  const addContratoForm = () => {
    // ... (código inalterado)
    setContratosColetaForm([...contratosColetaForm, { empresaColetaId: '', tiposResiduoColetados: [] }]);
  };

  const removeContratoForm = (index) => {
    // ... (código inalterado)
    if (contratosColetaForm.length <= 1 && !editingClienteId && contratosColetaForm.length === 1 && contratosColetaForm[0].empresaColetaId === '' && contratosColetaForm[0].tiposResiduoColetados.length === 0) {
        return;
    }
    if (contratosColetaForm.length === 1) { 
        setContratosColetaForm([{ empresaColetaId: '', tiposResiduoColetados: [] }]);
        return;
    }
    setContratosColetaForm(contratosColetaForm.filter((_, i) => i !== index));
  };

  const handleCategoriaPrincipalChange = (categoria) => {
    setCategoriasPrincipaisSelecionadas(prevSelecionadas =>
      prevSelecionadas.includes(categoria)
        ? prevSelecionadas.filter(c => c !== categoria)
        : [...prevSelecionadas, categoria]
    );
  };

  // NOVA FUNÇÃO para subtipos comuns de recicláveis
  const handleSubtipoComumChange = (subtipo) => {
    setSubtiposComunsSelecionados(prev =>
      prev.includes(subtipo)
        ? prev.filter(s => s !== subtipo)
        : [...prev, subtipo]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db || !masterCurrentUser || !masterProfile || masterProfile.role !== 'master') return showMessage("Ação não permitida.", true);
    if (!nome.trim()) return showMessage("O nome do cliente é obrigatório.", true);
    
    let finaisCategoriasPrincipais = [...categoriasPrincipaisSelecionadas];
    if (outroCategoriaSelecionada && outroCategoriaInput.trim()) {
        if (!finaisCategoriasPrincipais.includes(outroCategoriaInput.trim())) {
            finaisCategoriasPrincipais.push(outroCategoriaInput.trim());
        }
    }
    if (finaisCategoriasPrincipais.length === 0) return showMessage("Selecione ou defina pelo menos uma Categoria Principal de Resíduo.", true);

    let finaisTiposReciclaveisPersonalizados = [];
    if (fazSeparacaoReciclaveisCompleta) {
        finaisTiposReciclaveisPersonalizados = [...subtiposComunsSelecionados];
        const outrosArray = arrayFromString(outrosSubtiposReciclaveisInput);
        outrosArray.forEach(outro => {
            if (!finaisTiposReciclaveisPersonalizados.includes(outro)) {
                finaisTiposReciclaveisPersonalizados.push(outro);
            }
        });
        if (finaisTiposReciclaveisPersonalizados.length === 0) {
            return showMessage("Se 'Cliente detalha os tipos de recicláveis' está marcado, defina pelo menos um sub-tipo.", true);
        }
    }


    const clienteData = {
      nome: nome.trim(),
      rede: rede.trim(),
      categoriaCliente: categoriaCliente.trim(),
      logoUrl: logoUrl.trim(),
      cnpj: cnpj.trim(),
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      ativo,
      areasPersonalizadas: arrayFromString(areasPersonalizadasInput),
      categoriasPrincipaisResiduo: finaisCategoriasPrincipais,
      fazSeparacaoReciclaveisCompleta,
      tiposReciclaveisPersonalizados: finaisTiposReciclaveisPersonalizados, // Usa o array combinado
      contratosColeta: contratosColetaForm.filter(c => c.empresaColetaId && c.tiposResiduoColetados.length > 0),
      ultimaModificacao: serverTimestamp(),
      modificadoPor: masterCurrentUser.uid,
    };

    try {
      if (editingClienteId) {
        await updateDoc(doc(db, "clientes", editingClienteId), clienteData);
        showMessage("Cliente atualizado com sucesso!");
      } else {
        clienteData.criadoPor = masterCurrentUser.uid;
        clienteData.dataCriacao = serverTimestamp();
        await addDoc(collection(db, "clientes"), clienteData);
        showMessage("Cliente adicionado com sucesso!");
      }
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar cliente: ", error);
      showMessage("Erro ao salvar cliente.", true);
    }
  };

  if (!masterProfile && masterCurrentUser) return <div className="p-8 text-center">A carregar perfil do administrador...</div>;
  if (!masterProfile || masterProfile.role !== 'master') return <div className="p-8 text-center text-red-600">Acesso negado.</div>;

  const getOpcoesTipoResiduoContrato = () => {
    let opcoes = [...categoriasPrincipaisSelecionadas];
    if (outroCategoriaSelecionada && outroCategoriaInput.trim()) {
        if (!opcoes.includes(outroCategoriaInput.trim())) {
            opcoes.push(outroCategoriaInput.trim());
        }
    }
    if (fazSeparacaoReciclaveisCompleta) {
        // Combina subtipos comuns selecionados e outros subtipos do input
        const todosSubtipos = [...subtiposComunsSelecionados];
        arrayFromString(outrosSubtiposReciclaveisInput).forEach(subtipo => {
            if (!todosSubtipos.includes(subtipo)) {
                todosSubtipos.push(subtipo);
            }
        });

        todosSubtipos.forEach(subtipo => {
            if (!opcoes.includes(subtipo)) {
                opcoes.push(subtipo);
            }
        });
    }
    return opcoes.length > 0 ? opcoes : CATEGORIAS_RESIDUO_SUGERIDAS_CONTRATO;
  };
  const opcoesResiduoContrato = getOpcoesTipoResiduoContrato();

  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";
  const selectSmStyle = `${inputStyle} text-sm p-1.5`;
  const checkboxSmStyle = `${checkboxStyle} h-3.5 w-3.5`;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Gerir Clientes</h1>
      <MessageBox message={message} isError={isError} />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">{editingClienteId ? "Editar Cliente" : "Adicionar Novo Cliente"}</h2>
        
        <fieldset className="border border-gray-300 p-4 rounded-lg">
          {/* ... (Informações Básicas - JSX inalterado) ... */}
          <legend className="text-lg font-semibold text-indigo-700 px-2">Informações Básicas</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3">
            <div>
              <label htmlFor="nome" className={labelStyle}>Nome do Cliente*</label>
              <input type="text" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required className={inputStyle} />
            </div>
            <div>
              <label htmlFor="cnpj" className={labelStyle}>CNPJ</label>
              <input type="text" id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="rede" className={labelStyle}>Rede / Grupo</label>
              <input type="text" id="rede" value={rede} onChange={(e) => setRede(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="categoriaCliente" className={labelStyle}>Categoria do Cliente</label>
              <input type="text" id="categoriaCliente" value={categoriaCliente} onChange={(e) => setCategoriaCliente(e.target.value)} className={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="endereco" className={labelStyle}>Endereço</label>
              <input type="text" id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="cidade" className={labelStyle}>Cidade</label>
              <input type="text" id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="estado" className={labelStyle}>Estado (UF)</label>
              <input type="text" id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} maxLength="2" className={inputStyle} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="logoUrl" className={labelStyle}>URL da Logo</label>
              <input type="url" id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://exemplo.com/logo.png" className={inputStyle} />
            </div>
            <div className="mt-2 self-center">
              <label htmlFor="ativoCliente" className="flex items-center text-sm font-medium text-gray-700">
                <input type="checkbox" id="ativoCliente" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className={`${checkboxStyle} mr-2`} />
                Cliente Ativo
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-lg">
          <legend className="text-lg font-semibold text-indigo-700 px-2">Configurações de Resíduos</legend>
          <div className="space-y-4 pt-3">
            <div>
                <label htmlFor="areasPersonalizadasInput" className={labelStyle}>Áreas Internas (separadas por vírgula)</label>
                <input type="text" id="areasPersonalizadasInput" value={areasPersonalizadasInput} onChange={(e) => setAreasPersonalizadasInput(e.target.value)} placeholder="Ex: Cozinha, Recepção" className={inputStyle} />
            </div>
            <div>
                <label className={labelStyle}>Categorias Principais de Resíduo Usadas*</label>
                <div className="mt-2 space-y-2 sm:flex sm:space-x-4 sm:flex-wrap items-center">
                    {CATEGORIAS_PRINCIPAIS_PADRAO.map(categoria => (
                        <label key={categoria} htmlFor={`cat-${categoria}`} className="flex items-center">
                            <input type="checkbox" id={`cat-${categoria}`} value={categoria} checked={categoriasPrincipaisSelecionadas.includes(categoria)} onChange={() => handleCategoriaPrincipalChange(categoria)} className={`${checkboxStyle} mr-2`}/>
                            <span className="text-sm text-gray-700">{categoria}</span>
                        </label>
                    ))}
                    <label htmlFor="cat-outro" className="flex items-center">
                        <input type="checkbox" id="cat-outro" checked={outroCategoriaSelecionada} onChange={(e) => { setOutroCategoriaSelecionada(e.target.checked); if (!e.target.checked) setOutroCategoriaInput(''); }} className={`${checkboxStyle} mr-2`}/>
                        <span className="text-sm text-gray-700 mr-2">Outro:</span>
                    </label>
                    {outroCategoriaSelecionada && (
                        <input type="text" value={outroCategoriaInput} onChange={(e) => setOutroCategoriaInput(e.target.value)} placeholder="Nome da outra categoria" className={`${inputStyle} sm:w-auto flex-grow`}/>
                    )}
                </div>
            </div>
            <div className="mt-2">
                <label htmlFor="fazSeparacaoReciclaveisCompleta" className="flex items-center text-sm font-medium text-gray-700">
                    <input type="checkbox" id="fazSeparacaoReciclaveisCompleta" checked={fazSeparacaoReciclaveisCompleta} onChange={(e) => setFazSeparacaoReciclaveisCompleta(e.target.checked)} className={`${checkboxStyle} mr-2`} />
                    Cliente detalha os tipos de recicláveis?
                </label>
            </div>
            {fazSeparacaoReciclaveisCompleta && (
                <div>
                    <label className={labelStyle}>Sub-tipos de Recicláveis Detalhados*</label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                        {SUBTIPOS_RECICLAVEIS_COMUNS.map(subtipo => (
                            <label key={subtipo} htmlFor={`subtipo-${subtipo}`} className="flex items-center">
                                <input type="checkbox" id={`subtipo-${subtipo}`} value={subtipo} checked={subtiposComunsSelecionados.includes(subtipo)} onChange={() => handleSubtipoComumChange(subtipo)} className={`${checkboxStyle} mr-2`}/>
                                <span className="text-sm text-gray-700">{subtipo}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-3">
                        <label htmlFor="outrosSubtiposReciclaveisInput" className={`${labelStyle} text-xs`}>Outros sub-tipos (separados por vírgula):</label>
                        <input type="text" id="outrosSubtiposReciclaveisInput" value={outrosSubtiposReciclaveisInput} onChange={(e) => setOutrosSubtiposReciclaveisInput(e.target.value)} placeholder="Ex: Isopor, Embalagem Longa Vida" className={`${inputStyle} mt-1`} />
                    </div>
                </div>
            )}
          </div>
        </fieldset>

        {/* ... (Fieldset de Contratos de Coleta - JSX inalterado) ... */}
        <fieldset className="border border-gray-300 p-4 rounded-lg">
            <legend className="text-lg font-semibold text-indigo-700 px-2">Contratos com Empresas de Coleta</legend>
            <div className="space-y-4 pt-3">
                {contratosColetaForm.map((contrato, index) => (
                    <div key={index} className="border p-4 rounded-md bg-gray-50 space-y-3 relative">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-base font-semibold text-gray-700">Contrato de Coleta #{index + 1}</p>
                            { (contratosColetaForm.length > 1 || (contratosColetaForm.length === 1 && contrato.empresaColetaId)) && (
                                <button type="button" onClick={() => removeContratoForm(index)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remover</button>
                            )}
                        </div>
                        <div>
                            <label htmlFor={`empresaColeta-${index}`} className={`${labelStyle} text-xs`}>Empresa de Coleta*</label>
                            <select id={`empresaColeta-${index}`} value={contrato.empresaColetaId} onChange={(e) => handleContratoChange(index, 'empresaColetaId', e.target.value)} className={selectSmStyle}>
                                <option value="">Selecione...</option>
                                {empresasColetaDisponiveis.map(emp => (<option key={emp.id} value={emp.id}>{emp.nomeFantasia}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className={`${labelStyle} text-xs mb-1`}>Tipos de Resíduo Coletados (para este contrato)*</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1">
                                {opcoesResiduoContrato.map(tipo => ( 
                                    <label key={tipo} htmlFor={`contrato-${index}-tipo-${tipo}`} className="flex items-center text-sm">
                                        <input type="checkbox" id={`contrato-${index}-tipo-${tipo}`} checked={(contrato.tiposResiduoColetados || []).includes(tipo)} onChange={() => handleContratoTipoResiduoChange(index, tipo)} className={`${checkboxSmStyle} mr-1.5`} />
                                        <span className="text-gray-700">{tipo}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addContratoForm} className="btn-secondary text-sm py-1.5 px-3"> + Adicionar Contrato</button>
            </div>
        </fieldset>

        <div className="flex justify-end space-x-3 pt-4">
            {editingClienteId && (
                 <button type="button" onClick={resetForm} className="btn-secondary">Cancelar Edição</button>
            )}
            <button type="submit" className="btn-primary">
                {editingClienteId ? "Atualizar Cliente" : "Adicionar Cliente"}
            </button>
        </div>
      </form>

      {/* ... (Tabela de Clientes Cadastrados - JSX inalterado) ... */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Clientes Cadastrados</h2>
        {loadingClientes ? (<p>A carregar clientes...</p>) : clientes.length === 0 ? (<p>Nenhum cliente cadastrado.</p>) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="th-table">Nome</th>
                  <th className="th-table">Rede</th>
                  <th className="th-table">Categoria</th>
                  <th className="th-table">Status</th>
                  <th className="th-table text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="td-table font-medium text-gray-900">{cliente.nome}</td>
                    <td className="td-table">{cliente.rede || '-'}</td>
                    <td className="td-table">{cliente.categoriaCliente || '-'}</td>
                    <td className="td-table">
                      <span className={`status-badge ${cliente.ativo ? 'status-active' : 'status-inactive'}`}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="td-table-actions">
                      <button onClick={() => handleEdit(cliente)} className="btn-link-indigo">Editar</button>
                      <button onClick={() => handleDelete(cliente.id)} className="btn-link-red">Excluir</button>
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
