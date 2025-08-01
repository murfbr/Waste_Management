// src/components/EmpresaColetaForm.jsx

import React, { useState, useEffect } from 'react';

// BUG FIX: Adicionado "Aterro Sanitário" e "Incineração" às opções de destinação
// para Reciclável e Orgânico, para refletir práticas reais de mercado.
const TIPOS_RESIDUO_CONFIG = {
  'Reciclável': {
    destinacoes: ['Reciclagem', 'Aterro Sanitário', 'Incineração']
  },
  'Orgânico': {
    destinacoes: ['Compostagem', 'Biometanização', 'Aterro Sanitário', 'Incineração']
  },
  'Rejeito': {
    destinacoes: ['Aterro Sanitário', 'Incineração']
  }
};

// Extrai os nomes dos tipos padrão para fácil acesso
const CATEGORIAS_RESIDUO_PADRAO = Object.keys(TIPOS_RESIDUO_CONFIG);

export default function EmpresaColetaForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing
}) {
  // Estados para os campos do formulário
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [ativo, setAtivo] = useState(true);
  
  // Estados para a nova lógica de resíduos e destinação
  const [tiposSelecionados, setTiposSelecionados] = useState([]);
  const [destinacoes, setDestinacoes] = useState({});
  const [outroTipoInput, setOutroTipoInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para popular o formulário ao editar ou limpar para criar
  useEffect(() => {
    if (isEditing && initialData) {
      setNomeFantasia(initialData.nomeFantasia || '');
      setCnpj(initialData.cnpj || '');
      setContatoNome(initialData.contatoNome || '');
      setContatoTelefone(initialData.contatoTelefone || '');
      setContatoEmail(initialData.contatoEmail || '');
      setAtivo(initialData.ativo !== undefined ? initialData.ativo : true);

      // Popula os tipos de resíduo e destinações
      const tiposSalvos = initialData.tiposResiduo || [];
      setTiposSelecionados(tiposSalvos);
      setDestinacoes(initialData.destinacoes || {});

      // Popula o campo "Outro" se houver algum tipo não padrão
      const outrosTipos = tiposSalvos.filter(t => !CATEGORIAS_RESIDUO_PADRAO.includes(t));
      setOutroTipoInput(outrosTipos.join(', '));

    } else {
      // Reseta todos os campos para um novo formulário
      setNomeFantasia('');
      setCnpj('');
      setContatoNome('');
      setContatoTelefone('');
      setContatoEmail('');
      setAtivo(true);
      setTiposSelecionados([]);
      setDestinacoes({});
      setOutroTipoInput('');
    }
  }, [initialData, isEditing]);

  // Handler para quando um tipo de resíduo (Reciclável, Orgânico, etc.) é selecionado/desselecionado
  const handleTipoChange = (tipo) => {
    const novosTipos = tiposSelecionados.includes(tipo)
      ? tiposSelecionados.filter(t => t !== tipo)
      : [...tiposSelecionados, tipo];
    
    setTiposSelecionados(novosTipos);

    // Se o tipo foi desselecionado, remove suas destinações
    if (!novosTipos.includes(tipo)) {
      const novasDestinacoes = { ...destinacoes };
      delete novasDestinacoes[tipo];
      setDestinacoes(novasDestinacoes);
    }
  };

  // Handler para quando uma checkbox de destinação é alterada
  const handleDestinacaoChange = (tipo, dest) => {
    const destinosAtuais = destinacoes[tipo] || [];
    const novosDestinos = destinosAtuais.includes(dest)
      ? destinosAtuais.filter(d => d !== dest)
      : [...destinosAtuais, dest];

    setDestinacoes({
      ...destinacoes,
      [tipo]: novosDestinos
    });
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!nomeFantasia.trim() || !cnpj.trim()) {
      alert("Nome Fantasia e CNPJ são obrigatórios.");
      setIsSubmitting(false);
      return;
    }

    const outrosTiposArray = outroTipoInput.split(',').map(t => t.trim()).filter(Boolean);
    const todosOsTipos = [...new Set([...tiposSelecionados, ...outrosTiposArray])];

    if (todosOsTipos.length === 0) {
      alert("Selecione ou adicione pelo menos um tipo de resíduo.");
      setIsSubmitting(false);
      return;
    }

    // Validação da destinação
    const tiposComDestinacaoObrigatoria = tiposSelecionados.filter(t => TIPOS_RESIDUO_CONFIG[t]);
    for (const tipo of tiposComDestinacaoObrigatoria) {
      if (!destinacoes[tipo] || destinacoes[tipo].length === 0) {
        alert(`Por favor, selecione pelo menos uma destinação para "${tipo}".`);
        setIsSubmitting(false);
        return;
      }
    }

    const empresaData = {
      nomeFantasia: nomeFantasia.trim(),
      cnpj: cnpj.trim(),
      contatoNome: contatoNome.trim(),
      contatoTelefone: contatoTelefone.trim(),
      contatoEmail: contatoEmail.trim(),
      ativo,
      tiposResiduo: todosOsTipos,
      destinacoes: destinacoes, // Novo campo
    };

    await onSubmit(empresaData);
    setIsSubmitting(false);
  };

  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";

  return (
    <form onSubmit={handleLocalSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 mb-8 border border-gray-300">
      <h2 className="text-xl font-semibold text-gray-700">{isEditing ? "Editar Empresa de Coleta" : "Adicionar Nova Empresa"}</h2>
      
      {/* Seção de Informações Básicas */}
      <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <legend className="sr-only">Informações Básicas</legend>
        <div>
          <label htmlFor="form-empresa-nomeFantasia" className={labelStyle}>Nome Fantasia*</label>
          <input type="text" id="form-empresa-nomeFantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} required className={inputStyle} />
        </div>
        <div>
          <label htmlFor="form-empresa-cnpj" className={labelStyle}>CNPJ*</label>
          <input type="text" id="form-empresa-cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required className={inputStyle} />
        </div>
        <div>
          <label htmlFor="form-empresa-contatoNome" className={labelStyle}>Nome do Contato</label>
          <input type="text" id="form-empresa-contatoNome" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} className={inputStyle} />
        </div>
        <div>
          <label htmlFor="form-empresa-contatoTelefone" className={labelStyle}>Telefone do Contato</label>
          <input type="tel" id="form-empresa-contatoTelefone" value={contatoTelefone} onChange={(e) => setContatoTelefone(e.target.value)} className={inputStyle} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="form-empresa-contatoEmail" className={labelStyle}>Email do Contato</label>
          <input type="email" id="form-empresa-contatoEmail" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)} className={inputStyle} />
        </div>
      </fieldset>

      {/* Seção de Tipos de Resíduo e Destinação */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-medium text-gray-900">Gerenciamento de Resíduos</legend>
        
        {/* Tipos de Resíduo */}
        <div>
            <label className={`${labelStyle} mb-1`}>Tipos de Resíduo Coletados*</label>
            <div className="mt-2 space-y-2">
                {CATEGORIAS_RESIDUO_PADRAO.map((tipo) => (
                    <label key={tipo} htmlFor={`tipo-${tipo}`} className="flex items-center">
                        <input type="checkbox" id={`tipo-${tipo}`} value={tipo} checked={tiposSelecionados.includes(tipo)} onChange={() => handleTipoChange(tipo)} className={`${checkboxStyle} mr-2`} />
                        <span>{tipo}</span>
                    </label>
                ))}
                <div>
                    <label htmlFor="outro-tipo" className="flex items-center">
                        <span className="mr-2">Outros (separados por vírgula):</span>
                    </label>
                    <input type="text" id="outro-tipo" value={outroTipoInput} onChange={(e) => setOutroTipoInput(e.target.value)} className={inputStyle} placeholder="Ex: Lixo Eletrônico, Pilhas" />
                </div>
            </div>
        </div>

        {/* Destinações Condicionais */}
        {tiposSelecionados.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className={labelStyle}>Destinação por Tipo de Resíduo*</h3>
            {tiposSelecionados.filter(tipo => TIPOS_RESIDUO_CONFIG[tipo]).map((tipo) => (
              <div key={tipo} className="p-3 bg-gray-50 rounded-md">
                <p className="font-semibold text-gray-800">Destinação para {tipo}:</p>
                <div className="mt-2 space-y-1">
                  {TIPOS_RESIDUO_CONFIG[tipo].destinacoes.map(dest => (
                    <label key={dest} htmlFor={`dest-${tipo}-${dest}`} className="flex items-center">
                      <input type="checkbox" id={`dest-${tipo}-${dest}`} value={dest} checked={destinacoes[tipo]?.includes(dest) || false} onChange={() => handleDestinacaoChange(tipo, dest)} className={`${checkboxStyle} mr-2`}/>
                      <span>{dest}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {/* Status da Empresa */}
      <div>
        <label htmlFor="form-empresa-ativo" className="flex items-center">
          <input type="checkbox" id="form-empresa-ativo" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className={`${checkboxStyle} mr-2`} />
          <span className={labelStyle}>Empresa Ativa</span>
        </label>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-3 pt-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Empresa' : 'Adicionar Empresa')}
          </button>
      </div>
    </form>
  );
}
