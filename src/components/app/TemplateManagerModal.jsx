// src/components/app/TemplateManagerModal.jsx

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Modal para gerenciar modelos de cliente (templates).
 * Permite criar, editar e excluir configurações pré-definidas.
 */
export default function TemplateManagerModal({ db, isOpen, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateAreas, setTemplateAreas] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Define o caminho correto e reutilizável para a coleção de modelos.
  const templatesCollectionPath = 'systemPresets/clientConfiguration/clientTemplates';

  // Efeito para buscar os modelos do Firestore usando o caminho correto
  useEffect(() => {
    if (!db || !isOpen) return;
    setLoading(true);
    
    const templatesCollection = collection(db, templatesCollectionPath);
    const unsubscribe = onSnapshot(templatesCollection, (snapshot) => {
      const templatesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTemplates(templatesData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar modelos:", error);
      setErrorMessage("Não foi possível carregar os modelos.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, isOpen]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setTemplateName(template.name || '');
    setTemplateCategory(template.category || '');
    setTemplateAreas(Array.isArray(template.areas) ? template.areas.join(', ') : '');
    setErrorMessage('');
  };

  const handleNewTemplate = () => {
    setSelectedTemplateId(null);
    setTemplateName('');
    setTemplateCategory('');
    setTemplateAreas('');
    setErrorMessage('');
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateName.trim() || !templateCategory.trim()) {
      setErrorMessage('O nome e a categoria do modelo são obrigatórios.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    
    const areasArray = templateAreas.split(',').map(a => a.trim()).filter(Boolean);
    const dataToSave = {
      name: templateName.trim(),
      category: templateCategory.trim(),
      areas: areasArray,
      lastUpdated: serverTimestamp(),
    };

    try {
      if (selectedTemplateId) {
        // Atualiza um modelo existente
        const templateRef = doc(db, templatesCollectionPath, selectedTemplateId);
        await updateDoc(templateRef, dataToSave);
      } else {
        // Cria um novo modelo
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, templatesCollectionPath), dataToSave);
      }
      handleNewTemplate();
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      setErrorMessage('Ocorreu um erro ao salvar. Verifique as permissões do banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Tem certeza que deseja excluir este modelo?')) {
      setErrorMessage('');
      try {
        // Exclui um modelo
        await deleteDoc(doc(db, templatesCollectionPath, templateId));
        handleNewTemplate();
      } catch (error) {
        console.error("Erro ao excluir modelo:", error);
        setErrorMessage('Ocorreu um erro ao excluir o modelo.');
      }
    }
  };

  if (!isOpen) return null;

  const inputStyle = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Gerenciar Modelos de Cliente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>

        <div className="flex-grow flex overflow-hidden">
          <div className="w-1/3 border-r overflow-y-auto p-4">
            <button onClick={handleNewTemplate} className="w-full mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm">
              + Novo Modelo
            </button>
            {loading ? <p>Carregando...</p> : (
              <ul className="space-y-2">
                {templates.map(template => (
                  <li key={template.id}>
                    <button onClick={() => handleSelectTemplate(template)} className={`w-full text-left p-2 rounded-md ${selectedTemplateId === template.id ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100'}`}>
                      <p className="font-semibold">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.category}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="w-2/3 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {selectedTemplateId ? 'Editando Modelo' : 'Criar Novo Modelo'}
            </h3>
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label htmlFor="templateName" className={labelStyle}>Nome do Modelo*</label>
                <input type="text" id="templateName" value={templateName} onChange={e => setTemplateName(e.target.value)} required className={inputStyle} placeholder="Ex: Hotel Padrão, Escola Infantil" />
              </div>
              <div>
                <label htmlFor="templateCategory" className={labelStyle}>Categoria do Cliente*</label>
                <input type="text" id="templateCategory" value={templateCategory} onChange={e => setTemplateCategory(e.target.value)} required className={inputStyle} placeholder="Ex: Hotel, Escola, Condomínio" />
              </div>
              <div>
                <label htmlFor="templateAreas" className={labelStyle}>Áreas Padrão (separadas por vírgula)</label>
                <textarea id="templateAreas" value={templateAreas} onChange={e => setTemplateAreas(e.target.value)} rows="4" className={inputStyle} placeholder="Ex: Cozinha, Recepção, Quartos"></textarea>
              </div>
              
              {errorMessage && <p className="text-red-600 text-sm mt-2">{errorMessage}</p>}

              <div className="flex justify-between items-center pt-4">
                <div>
                  {selectedTemplateId && (
                    <button type="button" onClick={() => handleDeleteTemplate(selectedTemplateId)} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50" disabled={isSaving}>
                      Excluir
                    </button>
                  )}
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50" disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Modelo'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
