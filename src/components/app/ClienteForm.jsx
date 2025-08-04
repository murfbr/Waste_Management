// src/components/app/ClienteForm.jsx

import React, { useState, useEffect, useMemo } from 'react';

const CATEGORIAS_PRINCIPAIS_PADRAO = ["Reciclável", "Orgânico", "Rejeito"];
const SUBTIPOS_RECICLAVEIS_COMUNS = ["Papel", "Vidro", "Metal", "Plástico", "Baterias", "Eletrônicos"];
const SUBTIPOS_ORGANICOS_COMUNS = ["Geral", "Pré-serviço", "Pós-serviço"];
const NOVA_CATEGORIA_VALUE = "__NOVA__";

const LIMITES_PADRAO = {
    "Orgânico": 30,
    "Reciclável": 15,
    "Rejeito": 15,
};

export default function ClienteForm({ 
    initialData, 
    onSubmit, 
    onCancel, 
    empresasColetaDisponiveis, 
    isEditing,
    availableCategorias = [], 
    onNewCategoriaAdded,
    editingClienteId,
    onTestConnection,
    testConnectionStatus,
    clientTemplates = []
}) {
  const [nome, setNome] = useState('');
  const [rede, setRede] = useState('');
  const [selectedCategoriaCliente, setSelectedCategoriaCliente] = useState(''); 
  const [novaCategoriaInput, setNovaCategoriaInput] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [areasPersonalizadasInput, setAreasPersonalizadasInput] = useState('');
  const [categoriasPrincipaisSelecionadas, setCategoriasPrincipaisSelecionadas] = useState([...CATEGORIAS_PRINCIPAIS_PADRAO]); 
  const [outrasCategoriasInput, setOutrasCategoriasInput] = useState('');
  const [fazSeparacaoReciclaveisCompleta, setFazSeparacaoReciclaveisCompleta] = useState(false);
  const [subtiposComunsReciclaveisSelecionados, setSubtiposComunsReciclaveisSelecionados] = useState([]);
  const [outrosSubtiposReciclaveisInput, setOutrosSubtiposReciclaveisInput] = useState('');
  const [fazSeparacaoOrganicosCompleta, setFazSeparacaoOrganicosCompleta] = useState(false);
  const [subtiposComunsOrganicosSelecionados, setSubtiposComunsOrganicosSelecionados] = useState([]);
  const [outrosSubtiposOrganicosInput, setOutrosSubtiposOrganicosInput] = useState('');
  const [contratosColetaForm, setContratosColetaForm] = useState([{ empresaColetaId: '', tiposResiduoColetados: [] }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ineaLogin, setIneaLogin] = useState('');
  const [ineaSenha, setIneaSenha] = useState('');
  const [ineaCnpj, setIneaCnpj] = useState('');
  const [ineaCodUnidade, setIneaCodUnidade] = useState('');
  const [limitesPorResiduo, setLimitesPorResiduo] = useState({...LIMITES_PADRAO});
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // --- INÍCIO DA NOVA LÓGICA ---
  const [realtimeDashboardEnabled, setRealtimeDashboardEnabled] = useState(false);
  // --- FIM DA NOVA LÓGICA ---

  const arrayFromString = (str) => str.split(',').map(item => item.trim()).filter(item => item.length > 0);

  const resetForm = () => {
    setNome(''); setRede(''); setSelectedCategoriaCliente(''); setNovaCategoriaInput(''); 
    setLogoUrl(''); setCnpj(''); setEndereco(''); setCidade(''); setEstado(''); setAtivo(true);
    setAreasPersonalizadasInput(''); 
    setCategoriasPrincipaisSelecionadas([...CATEGORIAS_PRINCIPAIS_PADRAO]);
    setOutrasCategoriasInput('');
    setFazSeparacaoReciclaveisCompleta(false);
    setSubtiposComunsReciclaveisSelecionados([]);
    setOutrosSubtiposReciclaveisInput('');
    setFazSeparacaoOrganicosCompleta(false);
    setSubtiposComunsOrganicosSelecionados([]);
    setOutrosSubtiposOrganicosInput('');
    setContratosColetaForm([{ empresaColetaId: '', tiposResiduoColetados: [] }]);
    setIneaLogin(''); setIneaSenha(''); setIneaCnpj(''); setIneaCodUnidade('');
    setLimitesPorResiduo({...LIMITES_PADRAO});
    setSelectedTemplateId('');
    // --- INÍCIO DA NOVA LÓGICA ---
    setRealtimeDashboardEnabled(false);
    // --- FIM DA NOVA LÓGICA ---
  };

  useEffect(() => {
    if (isEditing && initialData) {
      const categoriasParaDropdown = availableCategorias;
      setNome(initialData.nome || '');
      setRede(initialData.rede || '');
      if (initialData.categoriaCliente && !categoriasParaDropdown.includes(initialData.categoriaCliente) && initialData.categoriaCliente) {
        setSelectedCategoriaCliente(NOVA_CATEGORIA_VALUE);
        setNovaCategoriaInput(initialData.categoriaCliente);
      } else {
        setSelectedCategoriaCliente(initialData.categoriaCliente || '');
        setNovaCategoriaInput('');
      }
      setLogoUrl(initialData.logoUrl || '');
      setCnpj(initialData.cnpj || '');
      setEndereco(initialData.endereco || '');
      setCidade(initialData.cidade || '');
      setEstado(initialData.estado || '');
      setAtivo(initialData.ativo !== undefined ? initialData.ativo : true);
      setAreasPersonalizadasInput(initialData.areasPersonalizadas ? initialData.areasPersonalizadas.join(', ') : '');
      const categoriasClienteDb = Array.isArray(initialData.categoriasPrincipaisResiduo) ? initialData.categoriasPrincipaisResiduo : [];
      const categoriasPadraoSel = categoriasClienteDb.filter(cat => CATEGORIAS_PRINCIPAIS_PADRAO.includes(cat));
      setCategoriasPrincipaisSelecionadas(categoriasPadraoSel.length > 0 ? categoriasPadraoSel : [...CATEGORIAS_PRINCIPAIS_PADRAO]);
      const outrasCategoriasDb = categoriasClienteDb.filter(cat => !CATEGORIAS_PRINCIPAIS_PADRAO.includes(cat));
      setOutrasCategoriasInput(outrasCategoriasDb.join(', '));
      setFazSeparacaoReciclaveisCompleta(initialData.fazSeparacaoReciclaveisCompleta || false);
      const todosSubtiposReciclaveis = Array.isArray(initialData.tiposReciclaveisPersonalizados) ? initialData.tiposReciclaveisPersonalizados : [];
      setSubtiposComunsReciclaveisSelecionados(todosSubtiposReciclaveis.filter(subtipo => SUBTIPOS_RECICLAVEIS_COMUNS.includes(subtipo)));
      setOutrosSubtiposReciclaveisInput(todosSubtiposReciclaveis.filter(subtipo => !SUBTIPOS_RECICLAVEIS_COMUNS.includes(subtipo)).join(', '));
      setFazSeparacaoOrganicosCompleta(initialData.fazSeparacaoOrganicosCompleta || false);
      const todosSubtiposOrganicos = Array.isArray(initialData.tiposOrganicosPersonalizados) ? initialData.tiposOrganicosPersonalizados : [];
      setSubtiposComunsOrganicosSelecionados(todosSubtiposOrganicos.filter(subtipo => SUBTIPOS_ORGANICOS_COMUNS.includes(subtipo)));
      setOutrosSubtiposOrganicosInput(todosSubtiposOrganicos.filter(subtipo => !SUBTIPOS_ORGANICOS_COMUNS.includes(subtipo)).join(', '));
      setContratosColetaForm(initialData.contratosColeta && initialData.contratosColeta.length > 0 
          ? initialData.contratosColeta.map(c => ({ 
              empresaColetaId: c.empresaColetaId || '', 
              tiposResiduoColetados: Array.isArray(c.tiposResiduoColetados) ? c.tiposResiduoColetados : [] 
            }))
          : [{ empresaColetaId: '', tiposResiduoColetados: [] }]);
      if (initialData.configINEA) {
        setIneaLogin(initialData.configINEA.login || '');
        setIneaCnpj(initialData.configINEA.cnpj || '');
        setIneaCodUnidade(initialData.configINEA.codUnidade || '');
        setIneaSenha('');
      } else {
        setIneaLogin(''); setIneaSenha(''); setIneaCnpj(''); setIneaCodUnidade('');
      }
      setLimitesPorResiduo({ ...LIMITES_PADRAO, ...(initialData.limitesPorResiduo || {}) });
      // --- INÍCIO DA NOVA LÓGICA ---
      // Popula o estado do checkbox com o dado do cliente, ou 'false' se não existir.
      setRealtimeDashboardEnabled(initialData.realtimeDashboardEnabled || false);
      // --- FIM DA NOVA LÓGICA ---
    } else {
      resetForm();
    }
  }, [initialData, isEditing, availableCategorias]);

  useEffect(() => {
    if (isEditing) return;
    if (selectedTemplateId) {
      const template = clientTemplates.find(t => t.id === selectedTemplateId);
      if (template) {
        setAreasPersonalizadasInput(Array.isArray(template.areas) ? template.areas.join(', ') : '');
        setSelectedCategoriaCliente(template.category || '');
      }
    } else {
      if (!initialData) {
          setAreasPersonalizadasInput('');
          setSelectedCategoriaCliente('');
      }
    }
  }, [selectedTemplateId, clientTemplates, isEditing, initialData]);

  const categoriasParaLimites = useMemo(() => {
    const outrasCategorias = arrayFromString(outrasCategoriasInput);
    const todasCategorias = new Set([...categoriasPrincipaisSelecionadas, ...outrasCategorias]);
    return Array.from(todasCategorias);
  }, [categoriasPrincipaisSelecionadas, outrasCategoriasInput]);

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!nome.trim()) { alert("O nome do cliente é obrigatório."); setIsSubmitting(false); return; }
    const areasArray = arrayFromString(areasPersonalizadasInput);
    if (areasArray.length === 0) { alert("Pelo menos uma Área Interna do Cliente deve ser definida."); setIsSubmitting(false); return; }
    
    const outrasCategorias = arrayFromString(outrasCategoriasInput);
    const finaisCategoriasPrincipais = Array.from(new Set([...categoriasPrincipaisSelecionadas, ...outrasCategorias]));

    if (finaisCategoriasPrincipais.length === 0) { alert("Selecione ou defina pelo menos uma Categoria Principal de Resíduo."); setIsSubmitting(false); return; }
    let finaisTiposReciclaveisPersonalizados = [];
    if (fazSeparacaoReciclaveisCompleta) {
        finaisTiposReciclaveisPersonalizados = [...subtiposComunsReciclaveisSelecionados];
        const outrosArray = arrayFromString(outrosSubtiposReciclaveisInput);
        outrosArray.forEach(outro => { if (!finaisTiposReciclaveisPersonalizados.includes(outro)) { finaisTiposReciclaveisPersonalizados.push(outro); } });
        if (finaisTiposReciclaveisPersonalizados.length === 0) { alert("Se 'Cliente detalha os tipos de recicláveis' está marcado, defina pelo menos um sub-tipo."); setIsSubmitting(false); return; }
    }
    let finaisTiposOrganicosPersonalizados = [];
    if (fazSeparacaoOrganicosCompleta) {
        finaisTiposOrganicosPersonalizados = [...subtiposComunsOrganicosSelecionados];
        const outrosArray = arrayFromString(outrosSubtiposOrganicosInput);
        outrosArray.forEach(outro => { if (!finaisTiposOrganicosPersonalizados.includes(outro)) { finaisTiposOrganicosPersonalizados.push(outro); } });
        if (finaisTiposOrganicosPersonalizados.length === 0) { alert("Se 'Cliente detalha os tipos de orgânicos' está marcado, defina pelo menos um sub-tipo."); setIsSubmitting(false); return; }
    }
    
    let categoriaFinalCliente = '';
    if (selectedCategoriaCliente === NOVA_CATEGORIA_VALUE) {
        if (!novaCategoriaInput.trim()) { alert("Por favor, insira o nome da nova categoria."); setIsSubmitting(false); return; }
        categoriaFinalCliente = novaCategoriaInput.trim();
        if (onNewCategoriaAdded) { onNewCategoriaAdded(categoriaFinalCliente); }
    } else {
        categoriaFinalCliente = selectedCategoriaCliente;
    }

    const limitesNumericos = {};
    categoriasParaLimites.forEach(key => {
        const valor = parseFloat(String(limitesPorResiduo[key] || '0').replace(',', '.'));
        limitesNumericos[key] = isNaN(valor) ? 0 : valor;
    });

    const clienteData = {
      nome: nome.trim(),
      rede: rede.trim(),
      categoriaCliente: categoriaFinalCliente,
      logoUrl: logoUrl.trim(),
      cnpj: cnpj.trim(),
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      ativo,
      areasPersonalizadas: areasArray,
      categoriasPrincipaisResiduo: finaisCategoriasPrincipais,
      fazSeparacaoReciclaveisCompleta,
      tiposReciclaveisPersonalizados: finaisTiposReciclaveisPersonalizados,
      fazSeparacaoOrganicosCompleta,
      tiposOrganicosPersonalizados: finaisTiposOrganicosPersonalizados,
      contratosColeta: contratosColetaForm.filter(c => c.empresaColetaId && c.tiposResiduoColetados.length > 0),
      configINEA: {
        login: ineaLogin.trim(),
        senha: ineaSenha,
        cnpj: ineaCnpj.trim(),
        codUnidade: ineaCodUnidade.trim(),
      },
      limitesPorResiduo: limitesNumericos,
      // --- INÍCIO DA NOVA LÓGICA ---
      // Adiciona o novo campo ao objeto de dados a ser salvo.
      realtimeDashboardEnabled: realtimeDashboardEnabled,
      // --- FIM DA NOVA LÓGICA ---
    };

    await onSubmit(clienteData);
    setIsSubmitting(false);
  };
  
  const handleLimiteChange = (categoria, valor) => {
    if (/^[0-9]*[.,]?[0-9]*$/.test(valor)) {
        setLimitesPorResiduo(prev => ({ ...prev, [categoria]: valor }));
    }
  };

  const handleContratoChange = (index, field, value) => { const uC = [...contratosColetaForm]; uC[index][field] = value; if (field === 'empresaColetaId') uC[index].tiposResiduoColetados = []; setContratosColetaForm(uC); };
  const handleContratoTipoResiduoChange = (cI, tipo) => { const uC = [...contratosColetaForm]; const cT = uC[cI].tiposResiduoColetados || []; uC[cI].tiposResiduoColetados = cT.includes(tipo) ? cT.filter(t => t !== tipo) : [...cT, tipo]; setContratosColetaForm(uC); };
  const addContratoForm = () => { setContratosColetaForm([...contratosColetaForm, { empresaColetaId: '', tiposResiduoColetados: [] }]); };
  const removeContratoForm = (index) => { if (contratosColetaForm.length <= 1 && !isEditing && contratosColetaForm.length === 1 && contratosColetaForm[0].empresaColetaId === '' && contratosColetaForm[0].tiposResiduoColetados.length === 0) return; if (contratosColetaForm.length === 1) { setContratosColetaForm([{ empresaColetaId: '', tiposResiduoColetados: [] }]); return; } setContratosColetaForm(contratosColetaForm.filter((_, i) => i !== index)); };
  const handleCategoriaPrincipalChange = (categoria) => { setCategoriasPrincipaisSelecionadas(prev => prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]); };
  const handleSubtipoComumChange = (subtipo, type) => { if (type === 'reciclavel') { setSubtiposComunsReciclaveisSelecionados(prev => prev.includes(subtipo) ? prev.filter(s => s !== subtipo) : [...prev, subtipo]); } else if (type === 'organico') { setSubtiposComunsOrganicosSelecionados(prev => prev.includes(subtipo) ? prev.filter(s => s !== subtipo) : [...prev, subtipo]); } };
  const opcoesResiduoContrato = useMemo(() => { const outrasCategorias = arrayFromString(outrasCategoriasInput); const todasCategorias = Array.from(new Set([...categoriasPrincipaisSelecionadas, ...outrasCategorias])); const categoriasBaseContrato = ["Reciclável", "Orgânico", "Rejeito"]; return todasCategorias.filter(op => categoriasBaseContrato.includes(op)); }, [categoriasPrincipaisSelecionadas, outrasCategoriasInput]);
  const handleTestButtonClick = () => { if (onTestConnection) { onTestConnection(editingClienteId); } };
  
  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";
  const dropdownCategorias = availableCategorias;

  return (
    <form onSubmit={handleLocalSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{isEditing ? "Editar Cliente" : "Adicionar Novo Cliente"}</h2>
      
      {!isEditing && (
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <label htmlFor="template-selector" className={labelStyle}>Usar um modelo (Opcional)</label>
          <select
            id="template-selector"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className={inputStyle}
          >
            <option value="">Nenhum - Começar do zero</option>
            {clientTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.category})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Selecionar um modelo preencherá os campos de "Categoria do Cliente" e "Áreas Internas" automaticamente.</p>
        </div>
      )}

      <fieldset className="border border-gray-300 p-4 rounded-lg">
          <legend className="text-lg font-semibold text-indigo-700 px-2">Informações Básicas</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3">
            <div><label htmlFor="form-cliente-nome" className={labelStyle}>Nome do Cliente*</label><input type="text" id="form-cliente-nome" value={nome} onChange={(e) => setNome(e.target.value)} required className={inputStyle} /></div>
            <div><label htmlFor="form-cliente-cnpj" className={labelStyle}>CNPJ</label><input type="text" id="form-cliente-cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={inputStyle} /></div>
            <div><label htmlFor="form-cliente-rede" className={labelStyle}>Rede / Grupo</label><input type="text" id="form-cliente-rede" value={rede} onChange={(e) => setRede(e.target.value)} className={inputStyle} /></div>
            <div>
              <label htmlFor="form-cliente-categoriaCliente" className={labelStyle}>Categoria do Cliente</label>
              <select 
                id="form-cliente-categoriaCliente" 
                value={selectedCategoriaCliente} 
                onChange={(e) => {
                  const { value } = e.target;
                  setSelectedCategoriaCliente(value);
                  if (value !== NOVA_CATEGORIA_VALUE) {
                    setNovaCategoriaInput('');
                  }
                }} 
                className={inputStyle}
              >
                <option value="">Sem Categoria (começar do zero)</option>
                {dropdownCategorias.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                <option value={NOVA_CATEGORIA_VALUE}>+ Nova Categoria...</option>
              </select>
            </div>
            {selectedCategoriaCliente === NOVA_CATEGORIA_VALUE && (
              <div> 
                <label htmlFor="form-cliente-novaCategoria" className={labelStyle}>Nome da Nova Categoria*</label>
                <input type="text" id="form-cliente-novaCategoria" value={novaCategoriaInput} onChange={(e) => setNovaCategoriaInput(e.target.value)} placeholder="Digite o nome da nova categoria" className={inputStyle} required />
              </div>
            )}
            <div className="md:col-span-2"><label htmlFor="form-cliente-endereco" className={labelStyle}>Endereço</label><input type="text" id="form-cliente-endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} className={inputStyle} /></div>
            <div><label htmlFor="form-cliente-cidade" className={labelStyle}>Cidade</label><input type="text" id="form-cliente-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputStyle} /></div>
            <div><label htmlFor="form-cliente-estado" className={labelStyle}>Estado (UF)</label><input type="text" id="form-cliente-estado" value={estado} onChange={(e) => setEstado(e.target.value)} maxLength="2" className={inputStyle} /></div>
            <div className="md:col-span-2"><label htmlFor="form-cliente-logoUrl" className={labelStyle}>URL da Logo</label><input type="url" id="form-cliente-logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://exemplo.com/logo.png" className={inputStyle} /></div>
            <div className="mt-2 self-center"><label htmlFor="form-cliente-ativoClienteForm" className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" id="form-cliente-ativoClienteForm" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className={`${checkboxStyle} mr-2`} />Cliente Ativo</label></div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-lg">
          <legend className="text-lg font-semibold text-indigo-700 px-2">Configurações de Resíduos</legend>
          <div className="space-y-4 pt-3">
            <div><label htmlFor="form-cliente-areasPersonalizadasInputForm" className={labelStyle}>Áreas Internas (separadas por vírgula)*</label><input type="text" id="form-cliente-areasPersonalizadasInputForm" value={areasPersonalizadasInput} onChange={(e) => setAreasPersonalizadasInput(e.target.value)} required placeholder="Ex: Cozinha, Recepção" className={inputStyle} /></div>
            <div>
                <label className={labelStyle}>Categorias Principais de Resíduo Usadas*</label>
                <div className="mt-2 space-y-2 sm:space-y-0 sm:flex sm:space-x-4 sm:flex-wrap items-center">
                    {CATEGORIAS_PRINCIPAIS_PADRAO.map(categoria => (<label key={categoria} htmlFor={`form-cliente-cat-${categoria}`} className="flex items-center"><input type="checkbox" id={`form-cliente-cat-${categoria}`} value={categoria} checked={categoriasPrincipaisSelecionadas.includes(categoria)} onChange={() => handleCategoriaPrincipalChange(categoria)} className={`${checkboxStyle} mr-2`}/><span className="text-sm text-gray-700">{categoria}</span></label>))}
                    <div className="flex items-center pt-2 sm:pt-0">
                        <label htmlFor="form-cliente-outrasCategorias" className="text-sm text-gray-700 mr-2 whitespace-nowrap">Outras (por vírgula):</label>
                        <input
                            type="text"
                            id="form-cliente-outrasCategorias"
                            value={outrasCategoriasInput}
                            onChange={(e) => setOutrasCategoriasInput(e.target.value)}
                            placeholder="Ex: Isopor, Lixo Eletrônico"
                            className="p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm w-full"
                        />
                    </div>
                </div>
            </div>
            <div className="border border-gray-200 p-3 rounded-md mt-4">
              <label htmlFor="fazSeparacaoReciclaveisCompleta" className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" id="fazSeparacaoReciclaveisCompleta" checked={fazSeparacaoReciclaveisCompleta} onChange={(e) => setFazSeparacaoReciclaveisCompleta(e.target.checked)} className={`${checkboxStyle} mr-2`} />Cliente detalha os tipos de <span className="font-bold ml-1">recicláveis</span>?</label>
              {fazSeparacaoReciclaveisCompleta && ( <div className="mt-3 pl-2"> <label className={labelStyle}>Sub-tipos de Recicláveis Detalhados*</label> <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2"> {SUBTIPOS_RECICLAVEIS_COMUNS.map(subtipo => (<label key={subtipo} className="flex items-center"><input type="checkbox" value={subtipo} checked={subtiposComunsReciclaveisSelecionados.includes(subtipo)} onChange={() => handleSubtipoComumChange(subtipo, 'reciclavel')} className={`${checkboxStyle} mr-2`}/><span className="text-sm text-gray-700">{subtipo}</span></label>))} </div> <div className="mt-3"><label className={`${labelStyle} text-xs`}>Outros sub-tipos (separados por vírgula):</label><input type="text" value={outrosSubtiposReciclaveisInput} onChange={(e) => setOutrosSubtiposReciclaveisInput(e.target.value)} placeholder="Ex: Isopor, Embalagem Longa Vida" className={`${inputStyle} mt-1`} /></div> </div> )}
            </div>
            <div className="border border-gray-200 p-3 rounded-md mt-4">
              <label htmlFor="fazSeparacaoOrganicosCompleta" className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" id="fazSeparacaoOrganicosCompleta" checked={fazSeparacaoOrganicosCompleta} onChange={(e) => setFazSeparacaoOrganicosCompleta(e.target.checked)} className={`${checkboxStyle} mr-2`} />Cliente detalha os tipos de <span className="font-bold ml-1">orgânicos</span>?</label>
              {fazSeparacaoOrganicosCompleta && ( <div className="mt-3 pl-2"> <label className={labelStyle}>Sub-tipos de Orgânicos Detalhados*</label> <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2"> {SUBTIPOS_ORGANICOS_COMUNS.map(subtipo => (<label key={subtipo} className="flex items-center"><input type="checkbox" value={subtipo} checked={subtiposComunsOrganicosSelecionados.includes(subtipo)} onChange={() => handleSubtipoComumChange(subtipo, 'organico')} className={`${checkboxStyle} mr-2`}/><span className="text-sm text-gray-700">{subtipo}</span></label>))} </div> <div className="mt-3"><label className={`${labelStyle} text-xs`}>Outros sub-tipos (separados por vírgula):</label><input type="text" value={outrosSubtiposOrganicosInput} onChange={(e) => setOutrosSubtiposOrganicosInput(e.target.value)} placeholder="Ex: Aparas, Cinzas" className={`${inputStyle} mt-1`} /></div> </div> )}
            </div>
            
            {/* --- INÍCIO DA NOVA LÓGICA --- */}
            <div className="border border-gray-200 p-3 rounded-md mt-4 bg-amber-50">
              <label htmlFor="realtimeDashboardEnabled" className="flex items-center text-sm font-medium text-gray-700">
                <input 
                  type="checkbox" 
                  id="realtimeDashboardEnabled" 
                  checked={realtimeDashboardEnabled} 
                  onChange={(e) => setRealtimeDashboardEnabled(e.target.checked)} 
                  className={`${checkboxStyle} mr-2`} 
                />
                Habilitar dashboard em tempo real?
              </label>
              <p className="text-xs text-gray-600 mt-1 pl-6">
                Atenção: Causa um custo maior de leituras no banco de dados. Use apenas para clientes que necessitem de monitoramento ao vivo em eventos.
              </p>
            </div>
            {/* --- FIM DA NOVA LÓGICA --- */}

          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-lg">
            <legend className="text-lg font-semibold text-indigo-700 px-2">Limites de Lançamento (kg)</legend>
            <p className="text-sm text-gray-500 mb-4">Defina um limite de peso para cada tipo de resíduo. Se o lançamento exceder este valor, o operador receberá um aviso. Deixe em branco ou 0 para não ter limite.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-3">
                {categoriasParaLimites.map((categoria) => (
                    <div key={`limite-${categoria}`} className="flex items-center space-x-2">
                        <label htmlFor={`limite-${categoria}`} className="text-sm font-medium text-gray-700 whitespace-nowrap">{categoria}:</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            id={`limite-${categoria}`}
                            value={limitesPorResiduo[categoria] || ''}
                            onChange={(e) => handleLimiteChange(categoria, e.target.value)}
                            placeholder="kg"
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                ))}
            </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-lg">
            <legend className="text-lg font-semibold text-indigo-700 px-2">Contratos com Empresas de Coleta</legend>
            <div className="space-y-4 pt-3">
                {contratosColetaForm.map((contrato, index) => (
                    <div key={index} className="border p-4 rounded-md bg-gray-50 space-y-3 relative">
                        <div className="flex justify-between items-center mb-2"><p className="text-base font-semibold text-gray-700">Contrato de Coleta #{index + 1}</p>{ (contratosColetaForm.length > 1 || (contratosColetaForm.length === 1 && contrato.empresaColetaId)) && (<button type="button" onClick={() => removeContratoForm(index)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remover</button>)}</div>
                        <div><label htmlFor={`form-cliente-empresaColeta-${index}`} className={`${labelStyle} text-xs`}>Empresa de Coleta*</label><select id={`form-cliente-empresaColeta-${index}`} value={contrato.empresaColetaId} onChange={(e) => handleContratoChange(index, 'empresaColetaId', e.target.value)} className={`${inputStyle} text-sm p-1.5`}><option value="">Selecione...</option>{empresasColetaDisponiveis.map(emp => (<option key={emp.id} value={emp.id}>{emp.nomeFantasia}</option>))}</select></div>
                        <div>
                            <label className={`${labelStyle} text-xs mb-1`}>Tipos de Resíduo Coletados (para este contrato)*</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1">
                                {opcoesResiduoContrato.map(tipo => ( <label key={tipo} htmlFor={`form-cliente-contrato-${index}-tipo-${tipo}`} className="flex items-center text-sm"><input type="checkbox" id={`form-cliente-contrato-${index}-tipo-${tipo}`} checked={(contrato.tiposResiduoColetados || []).includes(tipo)} onChange={() => handleContratoTipoResiduoChange(index, tipo)} className={`${checkboxStyle} h-3.5 w-3.5 mr-1.5`} /><span className="text-gray-700">{tipo}</span></label> ))}
                                {opcoesResiduoContrato.length === 0 && <p className="text-xs text-gray-500 col-span-full">Selecione uma categoria principal de resíduo (acima) para habilitar as opções de contrato.</p>}
                            </div>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addContratoForm} className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"> + Adicionar Contrato </button>
            </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-lg">
            <legend className="text-lg font-semibold text-indigo-700 px-2">Integração INEA (MTR)</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3">
                <div><label htmlFor="form-cliente-inea-login" className={labelStyle}>Login INEA (CPF)</label><input type="text" id="form-cliente-inea-login" value={ineaLogin} onChange={(e) => setIneaLogin(e.target.value)} className={inputStyle} placeholder="CPF do responsável" /></div>
                <div><label htmlFor="form-cliente-inea-senha" className={labelStyle}>Senha INEA</label><input type="password" id="form-cliente-inea-senha" value={ineaSenha} onChange={(e) => setIneaSenha(e.target.value)} className={inputStyle} placeholder={isEditing ? "Preencha apenas para alterar" : ""} /></div>
                <div><label htmlFor="form-cliente-inea-cnpj" className={labelStyle}>CNPJ (para a API)</label><input type="text" id="form-cliente-inea-cnpj" value={ineaCnpj} onChange={(e) => setIneaCnpj(e.target.value)} className={inputStyle} placeholder="CNPJ ou CPF da unidade" /></div>
                <div><label htmlFor="form-cliente-inea-codunidade" className={labelStyle}>Código da Unidade</label><input type="text" id="form-cliente-inea-codunidade" value={ineaCodUnidade} onChange={(e) => setIneaCodUnidade(e.target.value)} className={inputStyle} placeholder="Código numérico da unidade" /></div>
            </div>
           <p className="text-xs text-gray-500 mt-3">Preencha estes campos para habilitar a emissão automática de MTRs para este cliente. A senha é armazenada de forma segura e criptografada.</p>
          {isEditing && (
            <div className="mt-4 flex items-center space-x-4">
                <button type="button" onClick={handleTestButtonClick} disabled={testConnectionStatus?.loading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"> {testConnectionStatus?.loading ? 'A Testar...' : 'Testar Conexão'} </button>
                {testConnectionStatus?.message && (<p className={`text-sm ${testConnectionStatus.isError ? 'text-red-600' : 'text-green-600'}`}>{testConnectionStatus.message}</p>)}
            </div>
          )}
      </fieldset>

      <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? "A Salvar..." : (isEditing ? "Atualizar Cliente" : "Adicionar Cliente")}
          </button>
      </div>
    </form>
  );
}