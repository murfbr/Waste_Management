// src/components/EmpresaColetaForm.jsx

import React, { useState, useEffect } from 'react';

const CATEGORIAS_RESIDUO_PADRAO = ["Reciclável", "Não Reciclável", "Rejeito"];

export default function EmpresaColetaForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing
}) {
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [tiposResiduoSelecionados, setTiposResiduoSelecionados] = useState([]);
  const [ativo, setAtivo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing && initialData) {
      setNomeFantasia(initialData.nomeFantasia || '');
      setCnpj(initialData.cnpj || '');
      setContatoNome(initialData.contatoNome || '');
      setContatoTelefone(initialData.contatoTelefone || '');
      setContatoEmail(initialData.contatoEmail || '');
      setTiposResiduoSelecionados(initialData.tiposResiduo && Array.isArray(initialData.tiposResiduo) ? initialData.tiposResiduo : []);
      setAtivo(initialData.ativo !== undefined ? initialData.ativo : true);
    } else {
      // Reset para formulário de criação
      setNomeFantasia('');
      setCnpj('');
      setContatoNome('');
      setContatoTelefone('');
      setContatoEmail('');
      setTiposResiduoSelecionados([]);
      setAtivo(true);
    }
  }, [initialData, isEditing]);

  const handleTipoResiduoChange = (tipo) => {
    setTiposResiduoSelecionados(prevSelecionados =>
      prevSelecionados.includes(tipo)
        ? prevSelecionados.filter(t => t !== tipo)
        : [...prevSelecionados, tipo]
    );
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validações básicas (podem ser expandidas)
    if (!nomeFantasia.trim()) {
      alert("O nome fantasia é obrigatório."); // Usar showMessage da prop se preferir
      setIsSubmitting(false);
      return;
    }
    if (!cnpj.trim()) {
      alert("O CNPJ é obrigatório.");
      setIsSubmitting(false);
      return;
    }
    if (tiposResiduoSelecionados.length === 0) {
      alert("Selecione pelo menos um tipo de resíduo que a empresa coleta.");
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
    };

    await onSubmit(empresaData); // Chama a função onSubmit passada pela página pai
    setIsSubmitting(false);
    // O reset do formulário será tratado pela página pai ao chamar onCancel ou após o submit bem-sucedido
  };

  // Estilos Tailwind para inputs e labels (consistentes)
  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";

  return (
    <form onSubmit={handleLocalSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-8 border border-gray-300">
      <h2 className="text-xl font-semibold text-gray-700 mb-3">{isEditing ? "Editar Empresa de Coleta" : "Adicionar Nova Empresa de Coleta"}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="md:col-span-2">
          <label className={`${labelStyle} mb-1`}>Tipos de Resíduo Coletados pela Empresa*</label>
          <div className="mt-2 space-y-2 sm:space-y-0 sm:flex sm:space-x-4 sm:flex-wrap">
            {CATEGORIAS_RESIDUO_PADRAO.map((tipo) => (
              <label key={tipo} htmlFor={`form-empresa-tipo-${tipo}`} className="flex items-center">
                <input
                  type="checkbox"
                  id={`form-empresa-tipo-${tipo}`}
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
          <label htmlFor="form-empresa-ativo" className="flex items-center text-sm font-medium text-gray-700">
            <input type="checkbox" id="form-empresa-ativo" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className={`${checkboxStyle} mr-2`} />
            Empresa Ativa
          </label>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-3">
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
            {isSubmitting ? (isEditing ? "A Atualizar..." : "A Adicionar...") : (isEditing ? "Atualizar Empresa" : "Adicionar Empresa")}
          </button>
      </div>
    </form>
  );
}
