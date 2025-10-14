// src/components/app/TransportadorForm.jsx (VERSÃO FINAL E CORRETA)
import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const TIPOS_RESIDUO_CONFIG = {
  'Reciclável': { destinacoes: ['Reciclagem', 'Aterro Sanitário', 'Incineração'] },
  'Orgânico': { destinacoes: ['Compostagem', 'Biometanização', 'Aterro Sanitário', 'Incineração'] },
  'Rejeito': { destinacoes: ['Aterro Sanitário', 'Incineração'] }
};
const DESTINACOES_PADRAO_OUTROS = ['Reciclagem', 'Compostagem', 'Biometanização', 'Aterro Sanitário', 'Incineração'];
const CATEGORIAS_RESIDUO_PADRAO = Object.keys(TIPOS_RESIDUO_CONFIG);

export default function TransportadorForm({ initialData, onSubmit, onCancel, isEditing }) {
  const { db } = useContext(AuthContext);

  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [codigoUnidade, setCodigoUnidade] = useState(''); // --- NOVO ESTADO ADICIONADO ---
  const [contatoNome, setContatoNome] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [tiposSelecionados, setTiposSelecionados] = useState([]);
  const [destinacoes, setDestinacoes] = useState({});
  const [outroTipoInput, setOutroTipoInput] = useState('');
  
  const [destinadoresDisponiveis, setDestinadoresDisponiveis] = useState([]);
  const [vinculos, setVinculos] = useState({});
  const [isLoadingDestinadores, setIsLoadingDestinadores] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!db) return;
    const fetchDestinadores = async () => {
      setIsLoadingDestinadores(true);
      try {
        const q = query(collection(db, "destinadores"), orderBy("nome"));
        const querySnapshot = await getDocs(q);
        const listaDestinadores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDestinadoresDisponiveis(listaDestinadores);
      } catch (error) {
        console.error("Erro ao carregar destinadores: ", error);
      } finally {
        setIsLoadingDestinadores(false);
      }
    };
    fetchDestinadores();
  }, [db]);

  useEffect(() => {
    if (isEditing && initialData) {
      setNomeFantasia(initialData.nomeFantasia || '');
      setCnpj(initialData.cnpj || '');
      setCodigoUnidade(initialData.codigoUnidade || ''); // --- NOVO CAMPO CARREGADO ---
      setContatoNome(initialData.contatoNome || '');
      setContatoTelefone(initialData.contatoTelefone || '');
      setContatoEmail(initialData.contatoEmail || '');
      setAtivo(initialData.ativo !== undefined ? initialData.ativo : true);
      
      const tiposSalvos = initialData.tiposResiduo || [];
      setTiposSelecionados(tiposSalvos);
      setDestinacoes(initialData.destinacoes || {});
      const outrosTipos = tiposSalvos.filter(t => !CATEGORIAS_RESIDUO_PADRAO.includes(t));
      setOutroTipoInput(outrosTipos.join(', '));
      
      setVinculos(initialData.destinadoresPorTipo || {});
    } else {
      // Reset de todos os campos
      setNomeFantasia(''); setCnpj(''); setCodigoUnidade(''); setContatoNome(''); setContatoTelefone(''); setContatoEmail('');
      setAtivo(true); setTiposSelecionados([]); setDestinacoes({}); setOutroTipoInput('');
      setVinculos({});
    }
  }, [initialData, isEditing]);

  const handleTipoChange = (tipo) => {
    const novosTipos = tiposSelecionados.includes(tipo) ? tiposSelecionados.filter(t => t !== tipo) : [...tiposSelecionados, tipo];
    setTiposSelecionados(novosTipos);

    if (!novosTipos.includes(tipo)) {
      const novasDestinacoes = { ...destinacoes };
      delete novasDestinacoes[tipo];
      setDestinacoes(novasDestinacoes);
      const novosVinculos = { ...vinculos };
      delete novosVinculos[tipo];
      setVinculos(novosVinculos);
    }
  };

  const handleDestinacaoChange = (tipo, dest) => {
    const destinosAtuais = destinacoes[tipo] || [];
    const novosDestinos = destinosAtuais.includes(dest) ? destinosAtuais.filter(d => d !== dest) : [...destinosAtuais, dest];
    setDestinacoes({ ...destinacoes, [tipo]: novosDestinos });
  };
  
  const handleVinculoChange = (tipoResiduo, destinadorId) => {
    setVinculos(prev => ({ ...prev, [tipoResiduo]: destinadorId }));
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const outrosTiposArray = outroTipoInput.split(',').map(t => t.trim()).filter(Boolean);
    const todosOsTipos = [...new Set([...tiposSelecionados, ...outrosTiposArray])];

    const transportadorData = {
      nomeFantasia: nomeFantasia.trim(),
      cnpj: cnpj.trim(),
      codigoUnidade: codigoUnidade.trim(), // --- DADO ADICIONADO AO OBJETO FINAL ---
      contatoNome: contatoNome.trim(),
      contatoTelefone: contatoTelefone.trim(),
      contatoEmail: contatoEmail.trim(),
      ativo,
      tiposResiduo: todosOsTipos,
      destinacoes: destinacoes,
      destinadoresPorTipo: vinculos, 
    };

    await onSubmit(transportadorData);
    setIsSubmitting(false);
  };
  
  const todosOsTiposParaGerenciar = [...new Set([...tiposSelecionados, ...outroTipoInput.split(',').map(t => t.trim()).filter(Boolean)])];
  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const checkboxStyle = "h-4 w-4 text-indigo-600 border-gray-300 rounded";

  return (
    <form onSubmit={handleLocalSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 mb-8 border">
      <h2 className="text-xl font-semibold">{isEditing ? "Editar Transportador" : "Adicionar Novo Transportador"}</h2>
      
      <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label htmlFor="nomeFantasia" className={labelStyle}>Nome Fantasia*</label><input id="nomeFantasia" type="text" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} required className={inputStyle} /></div>
        <div><label htmlFor="cnpj" className={labelStyle}>CNPJ*</label><input id="cnpj" type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required className={inputStyle} /></div>
        
        {/* --- CAMPO ADICIONADO NO JSX --- */}
        <div className="md:col-span-2"><label htmlFor="codigoUnidade" className={labelStyle}>Código da Unidade (SIGOR, etc)</label><input id="codigoUnidade" type="text" value={codigoUnidade} onChange={(e) => setCodigoUnidade(e.target.value)} className={inputStyle} /></div>

        <div><label htmlFor="contatoNome" className={labelStyle}>Nome do Contato</label><input id="contatoNome" type="text" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} className={inputStyle} /></div>
        <div><label htmlFor="contatoTelefone" className={labelStyle}>Telefone do Contato</label><input id="contatoTelefone" type="tel" value={contatoTelefone} onChange={(e) => setContatoTelefone(e.target.value)} className={inputStyle} /></div>
        <div className="md:col-span-2"><label htmlFor="contatoEmail" className={labelStyle}>Email do Contato</label><input id="contatoEmail" type="email" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)} className={inputStyle} /></div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-medium text-gray-900">Gerenciamento de Resíduos</legend>
        
        <div>
            <label className={`${labelStyle} mb-1`}>Tipos de Resíduo Coletados*</label>
            <div className="mt-2 space-y-2">
                {CATEGORIAS_RESIDUO_PADRAO.map((tipo) => (
                    <label key={tipo} className="flex items-center"><input type="checkbox" value={tipo} checked={tiposSelecionados.includes(tipo)} onChange={() => handleTipoChange(tipo)} className={`${checkboxStyle} mr-2`} /><span>{tipo}</span></label>
                ))}
                <div>
                    <label className="flex items-center"><span className="mr-2">Outros (separados por vírgula):</span></label>
                    <input type="text" value={outroTipoInput} onChange={(e) => setOutroTipoInput(e.target.value)} className={inputStyle} placeholder="Ex: Lixo Eletrônico, Vidro"/>
                </div>
            </div>
        </div>

        {todosOsTiposParaGerenciar.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className={labelStyle}>Destinação por Tipo de Resíduo*</h3>
              {todosOsTiposParaGerenciar.map((tipo) => {
                  const listaDeDestinacoes = TIPOS_RESIDUO_CONFIG[tipo]?.destinacoes || DESTINACOES_PADRAO_OUTROS;
                  return (
                      <div key={tipo} className="p-3 bg-gray-50 rounded-md">
                          <p className="font-semibold text-gray-800">Destinação para {tipo}:</p>
                          <div className="mt-2 space-y-1">
                              {listaDeDestinacoes.map(dest => (
                                  <label key={dest} className="flex items-center"><input type="checkbox" value={dest} checked={destinacoes[tipo]?.includes(dest) || false} onChange={() => handleDestinacaoChange(tipo, dest)} className={`${checkboxStyle} mr-2`} /><span>{dest}</span></label>
                              ))}
                          </div>
                      </div>
                  );
              })}
          </div>
        )}
      </fieldset>
      
      {todosOsTiposParaGerenciar.length > 0 && (
        <fieldset className="space-y-4 pt-4 border-t">
            <legend className="text-lg font-medium">Atrelar Destinador por Tipo de Resíduo</legend>
            <p className="text-sm text-gray-500">Para cada tipo de resíduo, selecione a empresa que fará a destinação final.</p>
            {isLoadingDestinadores && <p>Carregando destinadores...</p>}
            {todosOsTiposParaGerenciar.map(tipo => (
                <div key={tipo}>
                    <label htmlFor={`vinculo-${tipo}`} className="font-medium text-gray-800">Destinador para {tipo}:</label>
                    <select id={`vinculo-${tipo}`} value={vinculos[tipo] || ''} onChange={(e) => handleVinculoChange(tipo, e.target.value)} className={inputStyle} disabled={isLoadingDestinadores}>
                        <option value="">Selecione um destinador...</option>
                        {destinadoresDisponiveis.map(dest => (
                            <option key={dest.id} value={dest.id}>{dest.nome}</option>
                        ))}
                    </select>
                </div>
            ))}
        </fieldset>
      )}

      <div><label className="flex items-center"><input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className={`${checkboxStyle} mr-2`} /><span className={labelStyle}>Transportador Ativo</span></label></div>

      <div className="flex justify-end space-x-3 pt-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-md">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Transportador' : 'Adicionar Transportador')}
          </button>
      </div>
    </form>
  );
}