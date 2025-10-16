import React, { useState, useEffect, useMemo } from 'react';
import { validaDocumento } from '../../utils/validadorCPF-CNPJ.js';
import ViewPasswordButton from './admin/ViewPasswordButton.jsx';

const CATEGORIAS_PRINCIPAIS_PADRAO = ["Reciclável", "Orgânico", "Rejeito"];
const SUBTIPOS_RECICLAVEIS_COMUNS = ["Geral", "Papel", "Vidro", "Metal", "Plástico", "Baterias", "Eletrônicos"];
const SUBTIPOS_ORGANICOS_COMUNS = ["Geral", "Pré-serviço", "Pós-serviço"];
const NOVA_CATEGORIA_VALUE = "__NOVA__";

const LIMITES_PADRAO = {
    "Orgânico": 30,
    "Reciclável": 15,
    "Rejeito": 15,
};

const estadosBrasileiros = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].sort();
const estadosPrioritarios = ['RJ', 'SP'];

// Define a estrutura padrão para a composição gravimétrica, usada para inicializar e resetar o estado.
const COMPOSICAO_GRAVIMETRICA_PADRAO = {
    "Papel / Papelão": '',
    "Plásticos (mix)": '',
    "Metais": '',
    "Vidro": ''
};


export default function ClienteForm({ 
    initialData, 
    onSubmit, 
    onCancel, 
    empresasColetaDisponiveis, 
    isEditing,
    availableCategorias = [], 
    onNewCategoriaAdded,
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
  const [errors, setErrors] = useState({});
  const [limitesPorResiduo, setLimitesPorResiduo] = useState({...LIMITES_PADRAO});
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [realtimeDashboardEnabled, setRealtimeDashboardEnabled] = useState(false);

  const [mtrLogin, setMtrLogin] = useState('');
  const [mtrSenha, setMtrSenha] = useState('');
  const [mtrCodigoDaUnidade, setMtrCodigoDaUnidade] = useState('');
  const [mtrResponsavel, setMtrResponsavel] = useState('');
  const [mtrCargo, setMtrCargo] = useState('');

  const [isCnpjValid, setIsCnpjValid] = useState(true);
  const [isCpfValid, setIsCpfValid] = useState(true);
  
  const [possuiEstudoGravimetrico, setPossuiEstudoGravimetrico] = useState(false);
  const [composicaoGravimetricaPropria, setComposicaoGravimetricaPropria] = useState({...COMPOSICAO_GRAVIMETRICA_PADRAO});

  const arrayFromString = (str) => str.split(',').map(item => item.trim()).filter(item => item.length > 0);

  const clearError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

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
    setMtrLogin(''); setMtrSenha(''); setMtrCodigoDaUnidade(''); setMtrResponsavel(''); setMtrCargo('');
    setLimitesPorResiduo({...LIMITES_PADRAO});
    setSelectedTemplateId('');
    setRealtimeDashboardEnabled(false);
    setIsCnpjValid(true);
    setIsCpfValid(true);
    setErrors({});
    setPossuiEstudoGravimetrico(false);
    setComposicaoGravimetricaPropria({...COMPOSICAO_GRAVIMETRICA_PADRAO});
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
      
      if (initialData.configMTR) {
        setMtrLogin(initialData.configMTR.mtrLogin || '');
        setMtrCodigoDaUnidade(initialData.configMTR.mtrCodigoDaUnidade || '');
        setMtrResponsavel(initialData.configMTR.mtrResponsavel || '');
        setMtrCargo(initialData.configMTR.mtrCargo || '');
        setMtrSenha('');
      } else {
        setMtrLogin(''); setMtrCodigoDaUnidade(''); setMtrResponsavel(''); setMtrCargo(''); setMtrSenha('');
      }

      setLimitesPorResiduo({ ...LIMITES_PADRAO, ...(initialData.limitesPorResiduo || {}) });
      setRealtimeDashboardEnabled(initialData.realtimeDashboardEnabled || false);
      setIsCnpjValid(true);
      setIsCpfValid(true);

      if (initialData.composicaoGravimetricaPropria && Object.keys(initialData.composicaoGravimetricaPropria).length > 0) {
        setPossuiEstudoGravimetrico(true);
        setComposicaoGravimetricaPropria({ ...COMPOSICAO_GRAVIMETRICA_PADRAO, ...initialData.composicaoGravimetricaPropria });
      } else {
        setPossuiEstudoGravimetrico(false);
        setComposicaoGravimetricaPropria({ ...COMPOSICAO_GRAVIMETRICA_PADRAO });
      }

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

  const handleToggleSeparacaoReciclaveis = (checked) => {
    setFazSeparacaoReciclaveisCompleta(checked);
    if (checked && !subtiposComunsReciclaveisSelecionados.includes("Geral")) {
      setSubtiposComunsReciclaveisSelecionados(prev => [...prev, "Geral"]);
    }
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newErrors = {};

    if (!nome.trim()) newErrors.nome = "O nome do cliente é obrigatório.";
    if (!cnpj.trim()) {
        newErrors.cnpj = "O CNPJ é obrigatório.";
    } else if (!isCnpjValid) {
        newErrors.cnpj = "CNPJ inválido.";
    }

    const areasArray = arrayFromString(areasPersonalizadasInput);
    if (areasArray.length === 0) newErrors.areas = "Pelo menos uma Área Interna deve ser definida.";
    
    const outrasCategorias = arrayFromString(outrasCategoriasInput);
    const finaisCategoriasPrincipais = Array.from(new Set([...categoriasPrincipaisSelecionadas, ...outrasCategorias]));

    if (finaisCategoriasPrincipais.length === 0) newErrors.categorias = "Selecione ou defina pelo menos uma Categoria Principal de Resíduo.";
    
    let finaisTiposReciclaveisPersonalizados = [];
    if (fazSeparacaoReciclaveisCompleta) {
        finaisTiposReciclaveisPersonalizados = [...subtiposComunsReciclaveisSelecionados, ...arrayFromString(outrosSubtiposReciclaveisInput)];
        if (finaisTiposReciclaveisPersonalizados.length === 0) newErrors.subtiposReciclaveis = "Defina pelo menos um sub-tipo de reciclável.";
    }

    let finaisTiposOrganicosPersonalizados = [];
    if (fazSeparacaoOrganicosCompleta) {
        finaisTiposOrganicosPersonalizados = [...subtiposComunsOrganicosSelecionados, ...arrayFromString(outrosSubtiposOrganicosInput)];
        if (finaisTiposOrganicosPersonalizados.length === 0) newErrors.subtiposOrganicos = "Defina pelo menos um sub-tipo de orgânico.";
    }
    
    let categoriaFinalCliente = selectedCategoriaCliente;
    if (selectedCategoriaCliente === NOVA_CATEGORIA_VALUE) {
        if (!novaCategoriaInput.trim()) { 
            newErrors.novaCategoria = "Por favor, insira o nome da nova categoria.";
        } else {
            categoriaFinalCliente = novaCategoriaInput.trim();
        }
    }

    if (possuiEstudoGravimetrico) {
        const totalPercent = Object.values(composicaoGravimetricaPropria).reduce((sum, val) => sum + (parseFloat(String(val).replace(',', '.')) || 0), 0);
        if (Math.abs(totalPercent - 100) > 0.01) {
            newErrors.composicao = "A soma dos percentuais da composição gravimétrica deve ser igual a 100%.";
        }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setIsSubmitting(false);
      return;
    }

    if (onNewCategoriaAdded && selectedCategoriaCliente === NOVA_CATEGORIA_VALUE) {
        onNewCategoriaAdded(categoriaFinalCliente);
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
      configMTR: {
        mtrLogin: mtrLogin.trim(),
        mtrSenha: mtrSenha,
        mtrCodigoDaUnidade: mtrCodigoDaUnidade.trim(),
        mtrResponsavel: mtrResponsavel.trim(),
        mtrCargo: mtrCargo.trim(),
      },
      limitesPorResiduo: limitesNumericos,
      realtimeDashboardEnabled: realtimeDashboardEnabled,
    };

    if (possuiEstudoGravimetrico) {
        const composicaoNumerica = {};
        for (const key in composicaoGravimetricaPropria) {
            composicaoNumerica[key] = parseFloat(String(composicaoGravimetricaPropria[key]).replace(',', '.')) || 0;
        }
        clienteData.composicaoGravimetricaPropria = composicaoNumerica;
    } else {
        clienteData.composicaoGravimetricaPropria = null; 
    }

    if (isEditing && !mtrSenha) {
      delete clienteData.configMTR.mtrSenha;
    }

    await onSubmit(clienteData);
    setIsSubmitting(false);
  };
  
  const handleCnpjChange = (e) => {
    const value = e.target.value;
    setCnpj(value);
    clearError('cnpj');
    if (value.trim()) {
      setIsCnpjValid(validaDocumento(value));
    } else {
      setIsCnpjValid(true);
    }
  };

  const handleCpfChange = (e) => {
    const value = e.target.value;
    setMtrLogin(value);
    if (value.trim()) {
      setIsCpfValid(validaDocumento(value));
    } else {
      setIsCpfValid(true);
    }
  };
  
  const handleComposicaoChange = (material, valor) => {
      if (/^[0-9]*[.,]?[0-9]*$/.test(valor)) {
          setComposicaoGravimetricaPropria(prev => ({ ...prev, [material]: valor }));
          clearError('composicao');
      }
  };

  const handleLimiteChange = (categoria, valor) => { if (/^[0-9]*[.,]?[0-9]*$/.test(valor)) { setLimitesPorResiduo(prev => ({ ...prev, [categoria]: valor })); } };
  const handleContratoChange = (index, field, value) => { const uC = [...contratosColetaForm]; uC[index][field] = value; if (field === 'empresaColetaId') uC[index].tiposResiduoColetados = []; setContratosColetaForm(uC); };
  const handleContratoTipoResiduoChange = (cI, tipo) => { const uC = [...contratosColetaForm]; const cT = uC[cI].tiposResiduoColetados || []; uC[cI].tiposResiduoColetados = cT.includes(tipo) ? cT.filter(t => t !== tipo) : [...cT, tipo]; setContratosColetaForm(uC); };
  const addContratoForm = () => { setContratosColetaForm([...contratosColetaForm, { empresaColetaId: '', tiposResiduoColetados: [] }]); };
  const removeContratoForm = (index) => { if (contratosColetaForm.length <= 1 && !isEditing && contratosColetaForm.length === 1 && contratosColetaForm[0].empresaColetaId === '' && contratosColetaForm[0].tiposResiduoColetados.length === 0) return; if (contratosColetaForm.length === 1) { setContratosColetaForm([{ empresaColetaId: '', tiposResiduoColetados: [] }]); return; } setContratosColetaForm(contratosColetaForm.filter((_, i) => i !== index)); };
  const handleCategoriaPrincipalChange = (categoria) => { setCategoriasPrincipaisSelecionadas(prev => prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]); };
  const handleSubtipoComumChange = (subtipo, type) => { if (type === 'reciclavel') { setSubtiposComunsReciclaveisSelecionados(prev => prev.includes(subtipo) ? prev.filter(s => s !== subtipo) : [...prev, subtipo]); } else if (type === 'organico') { setSubtiposComunsOrganicosSelecionados(prev => prev.includes(subtipo) ? prev.filter(s => s !== subtipo) : [...prev, subtipo]); } };
  
  const inputStyle = "mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";
  const dropdownCategorias = availableCategorias;

  const totalComposicao = useMemo(() => {
      return Object.values(composicaoGravimetricaPropria).reduce((sum, val) => sum + (parseFloat(String(val).replace(',', '.')) || 0), 0);
  }, [composicaoGravimetricaPropria]);

  return (
    <form onSubmit={handleLocalSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{isEditing ? "Editar Cliente" : "Adicionar Novo Cliente"}</h2>
      
      {!isEditing && (
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <label htmlFor="template-selector" className={labelStyle}>Usar um modelo (Opcional)</label>
          <select id="template-selector" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className={inputStyle} >
            <option value="">Nenhum - Começar do zero</option>
            {clientTemplates.map(template => ( <option key={template.id} value={template.id}> {template.name} ({template.category}) </option> ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Selecionar um modelo preencherá os campos de "Categoria do Cliente" e "Áreas Internas" automaticamente.</p>
        </div>
      )}

      <fieldset className="border border-gray-300 p-4 rounded-lg">
          <legend className="text-lg font-semibold text-indigo-700 px-2">Informações Básicas</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3">
            <div>
              <label htmlFor="form-cliente-nome" className={labelStyle}>Nome do Cliente*</label>
              <input type="text" id="form-cliente-nome" value={nome} onChange={(e) => { setNome(e.target.value); clearError('nome'); }} required className={`${inputStyle} ${errors.nome ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.nome && <p className="text-red-600 text-xs mt-1">{errors.nome}</p>}
            </div>
            <div>
              <label htmlFor="form-cliente-cnpj" className={labelStyle}>CNPJ*</label>
              <input type="text" id="form-cliente-cnpj" value={cnpj} onChange={handleCnpjChange} required className={`${inputStyle} ${errors.cnpj || !isCnpjValid ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.cnpj && <p className="text-red-600 text-xs mt-1">{errors.cnpj}</p>}
              {!errors.cnpj && !isCnpjValid && cnpj && <p className="text-red-600 text-xs mt-1">CNPJ inválido.</p>}
            </div>
            <div><label htmlFor="form-cliente-rede" className={labelStyle}>Rede / Grupo</label><input type="text" id="form-cliente-rede" value={rede} onChange={(e) => setRede(e.target.value)} className={inputStyle} /></div>
            <div>
              <label htmlFor="form-cliente-categoriaCliente" className={labelStyle}>Categoria do Cliente</label>
              <select id="form-cliente-categoriaCliente" value={selectedCategoriaCliente} onChange={(e) => { const { value } = e.target; setSelectedCategoriaCliente(value); if (value !== NOVA_CATEGORIA_VALUE) { setNovaCategoriaInput(''); } clearError('novaCategoria'); }} className={inputStyle} >
                <option value="">Sem Categoria (começar do zero)</option>
                {dropdownCategorias.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                <option value={NOVA_CATEGORIA_VALUE}>+ Nova Categoria...</option>
              </select>
            </div>
            {selectedCategoriaCliente === NOVA_CATEGORIA_VALUE && (
              <div> 
                <label htmlFor="form-cliente-novaCategoria" className={labelStyle}>Nome da Nova Categoria*</label>
                <input type="text" id="form-cliente-novaCategoria" value={novaCategoriaInput} onChange={(e) => { setNovaCategoriaInput(e.target.value); clearError('novaCategoria'); }} placeholder="Digite o nome da nova categoria" className={`${inputStyle} ${errors.novaCategoria ? 'border-red-500' : 'border-gray-300'}`} required />
                {errors.novaCategoria && <p className="text-red-600 text-xs mt-1">{errors.novaCategoria}</p>}
              </div>
            )}
            <div className="md:col-span-2"><label htmlFor="form-cliente-endereco" className={labelStyle}>Endereço</label><input type="text" id="form-cliente-endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} className={inputStyle} /></div>
            
            <div className="md:col-span-2 flex items-start space-x-4">
              <div className="flex-grow" style={{ flexBasis: '70%' }}>
                <label htmlFor="form-cliente-cidade" className={labelStyle}>Cidade</label>
                <input type="text" id="form-cliente-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputStyle} />
              </div>
              <div className="flex-shrink" style={{ flexBasis: '30%' }}>
                <label htmlFor="form-cliente-estado" className={labelStyle}>Estado (UF)</label>
                <select id="form-cliente-estado" value={estado} onChange={(e) => setEstado(e.target.value)} className={inputStyle}>
                  <option value="">Selecione...</option>
                  {estadosPrioritarios.map(uf => ( <option key={`prioritario-${uf}`} value={uf}>{uf}</option> ))}
                  <option disabled style={{ borderTop: '1px solid #ccc', marginTop: '4px', paddingTop: '4px' }}> </option>
                  {estadosBrasileiros.map(uf => ( <option key={`geral-${uf}`} value={uf}>{uf}</option>))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2"><label htmlFor="form-cliente-logoUrl" className={labelStyle}>URL da Logo</label><input type="url" id="form-cliente-logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://exemplo.com/logo.png" className={inputStyle} /></div>
            <div className="mt-2 self-center"><label htmlFor="form-cliente-ativoClienteForm" className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" id="form-cliente-ativoClienteForm" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className={`${checkboxStyle} mr-2`} />Cliente Ativo</label></div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-lg">
          <legend className="text-lg font-semibold text-indigo-700 px-2">Configurações de Resíduos</legend>
          <div className="space-y-4 pt-3">
            <div>
                <label htmlFor="form-cliente-areasPersonalizadasInputForm" className={labelStyle}>Áreas Internas (separadas por vírgula)*</label>
                <input type="text" id="form-cliente-areasPersonalizadasInputForm" value={areasPersonalizadasInput} onChange={(e) => { setAreasPersonalizadasInput(e.target.value); clearError('areas'); }} required placeholder="Ex: Cozinha, Recepção" className={`${inputStyle} ${errors.areas ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.areas && <p className="text-red-600 text-xs mt-1">{errors.areas}</p>}
            </div>
            <div>
                <label className={labelStyle}>Categorias Principais de Resíduo Usadas*</label>
                <div className="mt-2 space-y-2 sm:space-y-0 sm:flex sm:space-x-4 sm:flex-wrap items-center">
                    {CATEGORIAS_PRINCIPAIS_PADRAO.map(categoria => (<label key={categoria} htmlFor={`form-cliente-cat-${categoria}`} className="flex items-center"><input type="checkbox" id={`form-cliente-cat-${categoria}`} value={categoria} checked={categoriasPrincipaisSelecionadas.includes(categoria)} onChange={() => { handleCategoriaPrincipalChange(categoria); clearError('categorias'); }} className={`${checkboxStyle} mr-2`}/><span className="text-sm text-gray-700">{categoria}</span></label>))}
                    <div className="flex items-center pt-2 sm:pt-0">
                        <label htmlFor="form-cliente-outrasCategorias" className="text-sm text-gray-700 mr-2 whitespace-nowrap">Outras (por vírgula):</label>
                        <input type="text" id="form-cliente-outrasCategorias" value={outrasCategoriasInput} onChange={(e) => { setOutrasCategoriasInput(e.target.value); clearError('categorias'); }} placeholder="Ex: Isopor, Lixo Eletrônico" className="p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm w-full" />
                    </div>
                </div>
                {errors.categorias && <p className="text-red-600 text-xs mt-1">{errors.categorias}</p>}
            </div>
            <div className="border border-gray-200 p-3 rounded-md mt-4">
              <label htmlFor="fazSeparacaoReciclaveisCompleta" className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" id="fazSeparacaoReciclaveisCompleta" checked={fazSeparacaoReciclaveisCompleta} onChange={(e) => handleToggleSeparacaoReciclaveis(e.target.checked)} className={`${checkboxStyle} mr-2`} />Cliente detalha os tipos de <span className="font-bold ml-1">recicláveis</span>?</label>
              {fazSeparacaoReciclaveisCompleta && ( <div className="mt-3 pl-2"> <label className={labelStyle}>Sub-tipos de Recicláveis Detalhados*</label> <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2"> {SUBTIPOS_RECICLAVEIS_COMUNS.map(subtipo => (<label key={subtipo} className="flex items-center"><input type="checkbox" value={subtipo} checked={subtiposComunsReciclaveisSelecionados.includes(subtipo)} onChange={() => { handleSubtipoComumChange(subtipo, 'reciclavel'); clearError('subtiposReciclaveis'); }} className={`${checkboxStyle} mr-2`}/><span className="text-sm text-gray-700">{subtipo}</span></label>))} </div> <div className="mt-3"><label className={`${labelStyle} text-xs`}>Outros sub-tipos (separados por vírgula):</label><input type="text" value={outrosSubtiposReciclaveisInput} onChange={(e) => { setOutrosSubtiposReciclaveisInput(e.target.value); clearError('subtiposReciclaveis'); }} placeholder="Ex: Isopor, Embalagem Longa Vida" className={`${inputStyle} mt-1`} /></div> {errors.subtiposReciclaveis && <p className="text-red-600 text-xs mt-1">{errors.subtiposReciclaveis}</p>} </div> )}
            </div>
            <div className="border border-gray-200 p-3 rounded-md mt-4">
              <label htmlFor="fazSeparacaoOrganicosCompleta" className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" id="fazSeparacaoOrganicosCompleta" checked={fazSeparacaoOrganicosCompleta} onChange={(e) => setFazSeparacaoOrganicosCompleta(e.target.checked)} className={`${checkboxStyle} mr-2`} />Cliente detalha os tipos de <span className="font-bold ml-1">orgânicos</span>?</label>
              {fazSeparacaoOrganicosCompleta && ( <div className="mt-3 pl-2"> <label className={labelStyle}>Sub-tipos de Orgânicos Detalhados*</label> <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2"> {SUBTIPOS_ORGANICOS_COMUNS.map(subtipo => (<label key={subtipo} className="flex items-center"><input type="checkbox" value={subtipo} checked={subtiposComunsOrganicosSelecionados.includes(subtipo)} onChange={() => { handleSubtipoComumChange(subtipo, 'organico'); clearError('subtiposOrganicos'); }} className={`${checkboxStyle} mr-2`}/><span className="text-sm text-gray-700">{subtipo}</span></label>))} </div> <div className="mt-3"><label className={`${labelStyle} text-xs`}>Outros sub-tipos (separados por vírgula):</label><input type="text" value={outrosSubtiposOrganicosInput} onChange={(e) => { setOutrosSubtiposOrganicosInput(e.target.value); clearError('subtiposOrganicos'); }} placeholder="Ex: Aparas, Cinzas" className={`${inputStyle} mt-1`} /></div>{errors.subtiposOrganicos && <p className="text-red-600 text-xs mt-1">{errors.subtiposOrganicos}</p>} </div> )}
            </div>
            
            <div className="border border-gray-200 p-3 rounded-md mt-4 bg-amber-50">
              <label htmlFor="realtimeDashboardEnabled" className="flex items-center text-sm font-medium text-gray-700">
                <input type="checkbox" id="realtimeDashboardEnabled" checked={realtimeDashboardEnabled} onChange={(e) => setRealtimeDashboardEnabled(e.target.checked)} className={`${checkboxStyle} mr-2`} />
                Habilitar dashboard em tempo real?
              </label>
              <p className="text-xs text-gray-600 mt-1 pl-6">
                Atenção: Causa um custo maior de leituras no banco de dados. Use apenas para clientes que necessitem de monitoramento ao vivo em eventos.
              </p>
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-lg">
            <legend className="text-lg font-semibold text-indigo-700 px-2">Limites de Lançamento (kg)</legend>
            <p className="text-sm text-gray-500 mb-4">Defina um limite de peso para cada tipo de resíduo. Se o lançamento exceder este valor, o operador receberá um aviso. Deixe em branco ou 0 para não ter limite.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-3">
                {categoriasParaLimites.map((categoria) => (
                    <div key={`limite-${categoria}`} className="flex items-center space-x-2">
                        <label htmlFor={`limite-${categoria}`} className="text-sm font-medium text-gray-700 whitespace-nowrap">{categoria}:</label>
                        <input type="text" inputMode="decimal" id={`limite-${categoria}`} value={limitesPorResiduo[categoria] || ''} onChange={(e) => handleLimiteChange(categoria, e.target.value)} placeholder="kg" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
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
                            {(() => {
                                const empresaSelecionada = empresasColetaDisponiveis.find(
                                    emp => emp.id === contrato.empresaColetaId
                                );
                                const tiposDisponiveis = empresaSelecionada ? empresaSelecionada.tiposResiduo : [];

                                if (empresaSelecionada && tiposDisponiveis && tiposDisponiveis.length > 0) {
                                    return (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1">
                                            {tiposDisponiveis.map(tipo => (
                                                <label key={tipo} htmlFor={`form-cliente-contrato-${index}-tipo-${tipo}`} className="flex items-center text-sm">
                                                    <input
                                                        type="checkbox"
                                                        id={`form-cliente-contrato-${index}-tipo-${tipo}`}
                                                        checked={(contrato.tiposResiduoColetados || []).includes(tipo)}
                                                        onChange={() => handleContratoTipoResiduoChange(index, tipo)}
                                                        className={`${checkboxStyle} h-3.5 w-3.5 mr-1.5`}
                                                    />
                                                    <span className="text-gray-700">{tipo}</span>
                                                </label>
                                            ))}
                                        </div>
                                    );
                                } else {
                                    return (
                                        <p className="text-xs text-gray-500 pt-1">
                                            {contrato.empresaColetaId ? "Nenhum tipo de resíduo cadastrado para esta empresa." : "Selecione uma empresa de coleta para ver os tipos de resíduo."}
                                        </p>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addContratoForm} className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"> + Adicionar Contrato </button>
            </div>
        </fieldset>
        
        <fieldset className="border border-gray-300 p-4 rounded-lg">
          <legend className="text-lg font-semibold text-green-700 px-2">Configurações de Sustentabilidade</legend>
          <div className="space-y-4 pt-3">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="possuiEstudoGravimetrico" 
                checked={possuiEstudoGravimetrico} 
                onChange={(e) => setPossuiEstudoGravimetrico(e.target.checked)} 
                className={`${checkboxStyle} mr-2`}
              />
              <label htmlFor="possuiEstudoGravimetrico" className={labelStyle}>Cliente possui estudo gravimétrico próprio para recicláveis?</label>
            </div>

            {possuiEstudoGravimetrico && (
              <div className="pl-6 border-l-2 border-green-200 space-y-4 animate-fade-in">
                <p className="text-sm text-gray-600">
                  Insira a composição percentual do fluxo de recicláveis do cliente. A soma dos campos deve ser 100%.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.keys(composicaoGravimetricaPropria).map(material => (
                    <div key={material}>
                      <label htmlFor={`composicao-${material}`} className={`${labelStyle} capitalize`}>{material}</label>
                      <div className="relative mt-1">
                        <input 
                          type="text" 
                          inputMode="decimal"
                          placeholder="0"
                          id={`composicao-${material}`} 
                          value={composicaoGravimetricaPropria[material]}
                          onChange={(e) => handleComposicaoChange(material, e.target.value)}
                          className={`${inputStyle} pr-8`}
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right font-medium text-sm pr-1">
                  Total: <span className={Math.abs(totalComposicao - 100) > 0.01 && totalComposicao > 0 ? 'text-red-600' : 'text-gray-700'}>{totalComposicao.toFixed(2)}%</span>
                </div>
                {errors.composicao && <p className="text-red-600 text-xs mt-1">{errors.composicao}</p>}
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-lg">
            <legend className="text-lg font-semibold text-indigo-700 px-2">Informações para Preenchimento MTR</legend>
            <p className="text-sm text-gray-500 mb-4">Dados utilizados para o preenchimento do MTR no sistema do órgão ambiental.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3">
                <div>
                  <label htmlFor="form-cliente-mtr-login" className={labelStyle}>Login (CPF)</label>
                  <input type="text" id="form-cliente-mtr-login" value={mtrLogin} onChange={handleCpfChange} className={`${inputStyle} ${!isCpfValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`} placeholder="CPF do responsável pelo login" />
                  {!isCpfValid && <p className="text-red-600 text-xs mt-1">CPF inválido.</p>}
                </div>
                <div><label htmlFor="form-cliente-mtr-codunidade" className={labelStyle}>Código da Unidade</label><input type="text" id="form-cliente-mtr-codunidade" value={mtrCodigoDaUnidade} onChange={(e) => setMtrCodigoDaUnidade(e.target.value)} className={inputStyle} placeholder="Código numérico da unidade" /></div>
                <div>
                  <label htmlFor="form-cliente-mtr-responsavel" className={labelStyle}>Responsável pela Emissão</label>
                  <input type="text" id="form-cliente-mtr-responsavel" value={mtrResponsavel} onChange={(e) => setMtrResponsavel(e.target.value)} className={inputStyle} placeholder="Nome completo do responsável" />
                </div>
                <div><label htmlFor="form-cliente-mtr-cargo" className={labelStyle}>Cargo do Responsável</label><input type="text" id="form-cliente-mtr-cargo" value={mtrCargo} onChange={(e) => setMtrCargo(e.target.value)} className={inputStyle} placeholder="Ex: Gerente Ambiental" /></div>
                <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="form-cliente-mtr-senha" className={labelStyle}>Senha MTR</label>
                        {isEditing && initialData?.id && <ViewPasswordButton clienteId={initialData.id} />}
                    </div>
                    <input 
                        type="password" 
                        id="form-cliente-mtr-senha" 
                        value={mtrSenha} 
                        onChange={(e) => setMtrSenha(e.target.value)} 
                        className={inputStyle} 
                        placeholder={isEditing ? "Preencha apenas para alterar a senha atual" : "Digite a nova senha"} 
                        autoComplete="new-password"
                    />
                </div>
            </div>
           <p className="text-xs text-gray-500 mt-3">A senha é armazenada de forma segura.</p>
      </fieldset>

      <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : (isEditing ? "Atualizar Cliente" : "Adicionar Cliente")}
          </button>
      </div>
    </form>
  );
}