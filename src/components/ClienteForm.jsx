// src/components/ClienteForm.jsx

import React, { useState, useEffect } from 'react';

const CATEGORIAS_RESIDUO_SUGERIDAS_CONTRATO = ["Reciclável", "Não Reciclável", "Rejeito", "Orgânico"];
const CATEGORIAS_PRINCIPAIS_PADRAO = ["Reciclável", "Orgânico", "Rejeito"];
const SUBTIPOS_RECICLAVEIS_COMUNS = ["Papel", "Vidro", "Metal", "Plástico", "Baterias", "Eletrônicos"];

export default function ClienteForm({ 
    initialData, 
    onSubmit, 
    onCancel, 
    empresasColetaDisponiveis, 
    isEditing
    // Removidas props btnPrimaryClass e btnSecondaryClass
}) {
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
  const [subtiposComunsSelecionados, setSubtiposComunsSelecionados] = useState([]);
  const [outrosSubtiposReciclaveisInput, setOutrosSubtiposReciclaveisInput] = useState('');
  const [contratosColetaForm, setContratosColetaForm] = useState([{ empresaColetaId: '', tiposResiduoColetados: [] }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const arrayFromString = (str) => str.split(',').map(item => item.trim()).filter(item => item.length > 0);

  useEffect(() => {
    if (isEditing && initialData) {
      setNome(initialData.nome || '');
      setRede(initialData.rede || '');
      setCategoriaCliente(initialData.categoriaCliente || '');
      setLogoUrl(initialData.logoUrl || '');
      setCnpj(initialData.cnpj || '');
      setEndereco(initialData.endereco || '');
      setCidade(initialData.cidade || '');
      setEstado(initialData.estado || '');
      setAtivo(initialData.ativo !== undefined ? initialData.ativo : true);
      setAreasPersonalizadasInput(initialData.areasPersonalizadas ? initialData.areasPersonalizadas.join(', ') : '');
      
      const categoriasClienteDb = Array.isArray(initialData.categoriasPrincipaisResiduo) ? initialData.categoriasPrincipaisResiduo : [];
      const categoriasPadraoSel = categoriasClienteDb.filter(cat => CATEGORIAS_PRINCIPAIS_PADRAO.includes(cat));
      const categoriaOutroDb = categoriasClienteDb.find(cat => !CATEGORIAS_PRINCIPAIS_PADRAO.includes(cat));
      
      setCategoriasPrincipaisSelecionadas(categoriasPadraoSel.length > 0 ? categoriasPadraoSel : [...CATEGORIAS_PRINCIPAIS_PADRAO]);
      if (categoriaOutroDb) {
        setOutroCategoriaSelecionada(true);
        setOutroCategoriaInput(categoriaOutroDb);
      } else {
        setOutroCategoriaSelecionada(false);
        setOutroCategoriaInput('');
      }

      setFazSeparacaoReciclaveisCompleta(initialData.fazSeparacaoReciclaveisCompleta || false);
      const todosSubtiposCliente = Array.isArray(initialData.tiposReciclaveisPersonalizados) ? initialData.tiposReciclaveisPersonalizados : [];
      const comunsSelecionados = todosSubtiposCliente.filter(subtipo => SUBTIPOS_RECICLAVEIS_COMUNS.includes(subtipo));
      const outrosSubtipos = todosSubtiposCliente.filter(subtipo => !SUBTIPOS_RECICLAVEIS_COMUNS.includes(subtipo));
      setSubtiposComunsSelecionados(comunsSelecionados);
      setOutrosSubtiposReciclaveisInput(outrosSubtipos.join(', '));

      setContratosColetaForm(initialData.contratosColeta && initialData.contratosColeta.length > 0 
          ? initialData.contratosColeta.map(c => ({ 
              empresaColetaId: c.empresaColetaId || '', 
              tiposResiduoColetados: Array.isArray(c.tiposResiduoColetados) ? c.tiposResiduoColetados : [] 
            }))
          : [{ empresaColetaId: '', tiposResiduoColetados: [] }]);
    } else { // Reset para formulário de criação ou se initialData for null
        setNome(''); setRede(''); setCategoriaCliente(''); setLogoUrl(''); setCnpj('');
        setEndereco(''); setCidade(''); setEstado(''); setAtivo(true);
        setAreasPersonalizadasInput(''); 
        setCategoriasPrincipaisSelecionadas([...CATEGORIAS_PRINCIPAIS_PADRAO]);
        setOutroCategoriaSelecionada(false); 
        setOutroCategoriaInput('');      
        setFazSeparacaoReciclaveisCompleta(false); 
        setSubtiposComunsSelecionados([]); 
        setOutrosSubtiposReciclaveisInput(''); 
        setContratosColetaForm([{ empresaColetaId: '', tiposResiduoColetados: [] }]);
    }
  }, [initialData, isEditing]);


  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!nome.trim()) {
      alert("O nome do cliente é obrigatório."); 
      setIsSubmitting(false);
      return;
    }
    const areasArray = arrayFromString(areasPersonalizadasInput);
    if (areasArray.length === 0) {
        alert("Pelo menos uma Área Interna do Cliente deve ser definida.");
        setIsSubmitting(false);
        return;
    }
    
    let finaisCategoriasPrincipais = [...categoriasPrincipaisSelecionadas];
    if (outroCategoriaSelecionada && outroCategoriaInput.trim()) {
        if (!finaisCategoriasPrincipais.includes(outroCategoriaInput.trim())) {
            finaisCategoriasPrincipais.push(outroCategoriaInput.trim());
        }
    }
    if (finaisCategoriasPrincipais.length === 0) {
        alert("Selecione ou defina pelo menos uma Categoria Principal de Resíduo.");
        setIsSubmitting(false);
        return;
    }

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
            alert("Se 'Cliente detalha os tipos de recicláveis' está marcado, defina pelo menos um sub-tipo.");
            setIsSubmitting(false);
            return;
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
      areasPersonalizadas: areasArray,
      categoriasPrincipaisResiduo: finaisCategoriasPrincipais,
      fazSeparacaoReciclaveisCompleta,
      tiposReciclaveisPersonalizados: finaisTiposReciclaveisPersonalizados,
      contratosColeta: contratosColetaForm.filter(c => c.empresaColetaId && c.tiposResiduoColetados.length > 0),
    };

    await onSubmit(clienteData); 
    setIsSubmitting(false);
    // O reset do formulário do ClienteForm é tratado pelo useEffect ao mudar initialData/isEditing
    // ou a PaginaAdminClientes pode chamar onCancel que leva ao reset.
  };

  const handleContratoChange = (index, field, value) => { 
    const uC = [...contratosColetaForm]; uC[index][field] = value; 
    if (field === 'empresaColetaId') uC[index].tiposResiduoColetados = []; 
    setContratosColetaForm(uC);
  };
  const handleContratoTipoResiduoChange = (cI, tipo) => { 
    const uC = [...contratosColetaForm]; const cT = uC[cI].tiposResiduoColetados || [];
    uC[cI].tiposResiduoColetados = cT.includes(tipo) ? cT.filter(t => t !== tipo) : [...cT, tipo];
    setContratosColetaForm(uC);
  };
  const addContratoForm = () => { setContratosColetaForm([...contratosColetaForm, { empresaColetaId: '', tiposResiduoColetados: [] }]); };
  const removeContratoForm = (index) => { 
    if (contratosColetaForm.length <= 1 && !isEditing && contratosColetaForm.length === 1 && contratosColetaForm[0].empresaColetaId === '' && contratosColetaForm[0].tiposResiduoColetados.length === 0) return;
    if (contratosColetaForm.length === 1) { setContratosColetaForm([{ empresaColetaId: '', tiposResiduoColetados: [] }]); return; }
    setContratosColetaForm(contratosColetaForm.filter((_, i) => i !== index));
  };
  const handleCategoriaPrincipalChange = (categoria) => { 
    setCategoriasPrincipaisSelecionadas(prev => prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]);
  };
  const handleSubtipoComumChange = (subtipo) => {
    setSubtiposComunsSelecionados(prev => prev.includes(subtipo) ? prev.filter(s => s !== subtipo) : [...prev, subtipo]);
  };
  
  const getOpcoesTipoResiduoContrato = () => { 
    let op = [...categoriasPrincipaisSelecionadas];
    if(outroCategoriaSelecionada && outroCategoriaInput.trim() && !op.includes(outroCategoriaInput.trim())) op.push(outroCategoriaInput.trim());
    if(fazSeparacaoReciclaveisCompleta) {
        const ts = [...subtiposComunsSelecionados];
        arrayFromString(outrosSubtiposReciclaveisInput).forEach(s => { if(!ts.includes(s)) ts.push(s); });
        ts.forEach(s => { if(!op.includes(s)) op.push(s); });
    }
    return op.length > 0 ? op : CATEGORIAS_RESIDUO_SUGERIDAS_CONTRATO;
  };
  const opcoesResiduoContrato = getOpcoesTipoResiduoContrato();

  // Classes Tailwind para estilização direta, como na PaginaAdminEmpresasColeta
  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";
  const selectSmStyle = `${inputStyle} text-sm p-1.5`; // Usado para selects menores nos contratos
  const checkboxSmStyle = `${checkboxStyle} h-3.5 w-3.5`; // Usado para checkboxes menores nos contratos

  return (
    <form onSubmit={handleLocalSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{isEditing ? "Editar Cliente" : "Adicionar Novo Cliente"}</h2>
      
      <fieldset className="border border-gray-300 p-4 rounded-lg">
          <legend className="text-lg font-semibold text-indigo-700 px-2">Informações Básicas</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3">
            <div><label htmlFor="form-cliente-nome" className={labelStyle}>Nome do Cliente*</label><input type="text" id="form-cliente-nome" value={nome} onChange={(e) => setNome(e.target.value)} required className={inputStyle} /></div>
            <div><label htmlFor="form-cliente-cnpj" className={labelStyle}>CNPJ</label><input type="text" id="form-cliente-cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={inputStyle} /></div>
            <div><label htmlFor="form-cliente-rede" className={labelStyle}>Rede / Grupo</label><input type="text" id="form-cliente-rede" value={rede} onChange={(e) => setRede(e.target.value)} className={inputStyle} /></div>
            <div><label htmlFor="form-cliente-categoriaCliente" className={labelStyle}>Categoria do Cliente</label><input type="text" id="form-cliente-categoriaCliente" value={categoriaCliente} onChange={(e) => setCategoriaCliente(e.target.value)} className={inputStyle} /></div>
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
                <div className="mt-2 space-y-2 sm:flex sm:space-x-4 sm:flex-wrap items-center">
                    {CATEGORIAS_PRINCIPAIS_PADRAO.map(categoria => (<label key={categoria} htmlFor={`form-cliente-cat-${categoria}`} className="flex items-center"><input type="checkbox" id={`form-cliente-cat-${categoria}`} value={categoria} checked={categoriasPrincipaisSelecionadas.includes(categoria)} onChange={() => handleCategoriaPrincipalChange(categoria)} className={`${checkboxStyle} mr-2`}/><span className="text-sm text-gray-700">{categoria}</span></label>))}
                    <label htmlFor="form-cliente-cat-outro" className="flex items-center"><input type="checkbox" id="form-cliente-cat-outro" checked={outroCategoriaSelecionada} onChange={(e) => { setOutroCategoriaSelecionada(e.target.checked); if (!e.target.checked) setOutroCategoriaInput(''); }} className={`${checkboxStyle} mr-2`}/><span className="text-sm text-gray-700 mr-2">Outro:</span></label>
                    {outroCategoriaSelecionada && (<input type="text" value={outroCategoriaInput} onChange={(e) => setOutroCategoriaInput(e.target.value)} placeholder="Nome da outra categoria" className={`${inputStyle} sm:w-auto flex-grow`}/>)}
                </div>
            </div>
            <div className="mt-2"><label htmlFor="form-cliente-fazSeparacaoReciclaveisCompletaForm" className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" id="form-cliente-fazSeparacaoReciclaveisCompletaForm" checked={fazSeparacaoReciclaveisCompleta} onChange={(e) => setFazSeparacaoReciclaveisCompleta(e.target.checked)} className={`${checkboxStyle} mr-2`} />Cliente detalha os tipos de recicláveis?</label></div>
            {fazSeparacaoReciclaveisCompleta && (
                <div>
                    <label className={labelStyle}>Sub-tipos de Recicláveis Detalhados*</label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                        {SUBTIPOS_RECICLAVEIS_COMUNS.map(subtipo => (<label key={subtipo} htmlFor={`form-cliente-subtipo-${subtipo}`} className="flex items-center"><input type="checkbox" id={`form-cliente-subtipo-${subtipo}`} value={subtipo} checked={subtiposComunsSelecionados.includes(subtipo)} onChange={() => handleSubtipoComumChange(subtipo)} className={`${checkboxStyle} mr-2`}/><span className="text-sm text-gray-700">{subtipo}</span></label>))}
                    </div>
                    <div className="mt-3"><label htmlFor="form-cliente-outrosSubtiposReciclaveisInputForm" className={`${labelStyle} text-xs`}>Outros sub-tipos (separados por vírgula):</label><input type="text" id="form-cliente-outrosSubtiposReciclaveisInputForm" value={outrosSubtiposReciclaveisInput} onChange={(e) => setOutrosSubtiposReciclaveisInput(e.target.value)} placeholder="Ex: Isopor, Embalagem Longa Vida" className={`${inputStyle} mt-1`} /></div>
                </div>
            )}
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-lg">
            <legend className="text-lg font-semibold text-indigo-700 px-2">Contratos com Empresas de Coleta</legend>
            <div className="space-y-4 pt-3">
                {contratosColetaForm.map((contrato, index) => (
                    <div key={index} className="border p-4 rounded-md bg-gray-50 space-y-3 relative">
                        <div className="flex justify-between items-center mb-2"><p className="text-base font-semibold text-gray-700">Contrato de Coleta #{index + 1}</p>{ (contratosColetaForm.length > 1 || (contratosColetaForm.length === 1 && contrato.empresaColetaId)) && (<button type="button" onClick={() => removeContratoForm(index)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remover</button>)}</div>
                        <div><label htmlFor={`form-cliente-empresaColeta-${index}`} className={`${labelStyle} text-xs`}>Empresa de Coleta*</label><select id={`form-cliente-empresaColeta-${index}`} value={contrato.empresaColetaId} onChange={(e) => handleContratoChange(index, 'empresaColetaId', e.target.value)} className={selectSmStyle}><option value="">Selecione...</option>{empresasColetaDisponiveis.map(emp => (<option key={emp.id} value={emp.id}>{emp.nomeFantasia}</option>))}</select></div>
                        <div><label className={`${labelStyle} text-xs mb-1`}>Tipos de Resíduo Coletados (para este contrato)*</label><div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-1">{opcoesResiduoContrato.map(tipo => ( <label key={tipo} htmlFor={`form-cliente-contrato-${index}-tipo-${tipo}`} className="flex items-center text-sm"><input type="checkbox" id={`form-cliente-contrato-${index}-tipo-${tipo}`} checked={(contrato.tiposResiduoColetados || []).includes(tipo)} onChange={() => handleContratoTipoResiduoChange(index, tipo)} className={`${checkboxSmStyle} mr-1.5`} /><span className="text-gray-700">{tipo}</span></label> ))}</div></div>
                    </div>
                ))}
                <button type="button" onClick={addContratoForm} 
                        className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                     + Adicionar Contrato
                </button>
            </div>
        </fieldset>

      <div className="flex justify-end space-x-3 pt-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isEditing ? "Cancelar Edição" : "Limpar"}
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEditing ? "A Atualizar..." : "A Adicionar...") : (isEditing ? "Atualizar Cliente" : "Adicionar Cliente")}
          </button>
      </div>
    </form>
  );
}
