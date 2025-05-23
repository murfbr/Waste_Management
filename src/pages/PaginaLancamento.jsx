// src/pages/PaginaLancamento.jsx

import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query } from 'firebase/firestore';

// Importar os componentes de UI necessários
import MessageBox from '../components/MessageBox';
import WasteForm from '../components/WasteForm';
import WasteRecordsList from '../components/WasteRecordsList';

// Ícone de exemplo para o colapso (pode usar react-icons para algo mais elaborado)
// import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function PaginaLancamento() {
  const { db, currentUser, appId, userProfile } = useContext(AuthContext);

  // Estados para mensagens, registos e carregamento
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [isRecordsVisible, setIsRecordsVisible] = useState(false);

  // Função para exibir mensagens (sucesso/erro)
  const showMessage = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 5000);
  };

  // useEffect para configurar o ouvinte de registos do Firestore em tempo real
  useEffect(() => {
    if (!db || !currentUser || !userProfile) {
      setLoadingRecords(false);
      return;
    }
    
    const canViewRecords = ['master', 'gerente', 'operacional'].includes(userProfile.role);

    if (!canViewRecords) {
      setLoadingRecords(false);
      setWasteRecords([]);
      return;
    }

    setLoadingRecords(true);
    const wasteRecordsCollectionRef = collection(db, `artifacts/${appId}/public/data/wasteRecords`);
    const q = query(wasteRecordsCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = [];
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });
      records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setWasteRecords(records);
      setLoadingRecords(false);
    }, (error) => {
      console.error("PAGINA LANCAMENTO - Erro ao buscar registos em tempo real:", error); // Mantido
      showMessage('Erro ao carregar registos. Tente recarregar a página.', true);
      setLoadingRecords(false);
    });

    return () => {
      unsubscribe();
    };
  }, [db, currentUser, appId, userProfile]);

  // Função para lidar com o envio do formulário de resíduos
  const handleAddWasteRecord = async (newRecordData) => {
    if (!currentUser || !userProfile || !['master', 'gerente', 'operacional'].includes(userProfile.role)) {
      showMessage('Você não tem permissão para registar resíduos.', true);
      return false;
    }
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/wasteRecords`), {
        ...newRecordData,
        timestamp: Date.now(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
      });
      showMessage('Resíduo registado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao registar resíduo:', error); // Mantido
      showMessage('Erro ao registar resíduo. Tente novamente.', true);
      return false;
    }
  };

  // Função para lidar com a exclusão de um registo
  const handleDeleteRecord = async (recordId) => {
    if (!currentUser || !userProfile || userProfile.role !== 'master') {
      showMessage('Você não tem permissão para excluir registos.', true);
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este registo?')) { // TODO: Substituir por modal
      try {
        const recordRef = doc(db, `artifacts/${appId}/public/data/wasteRecords`, recordId);
        await deleteDoc(recordRef);
        showMessage('Registo excluído com sucesso!');
      } catch (error) { 
        console.error('Erro ao excluir registo:', error); // Mantido
        showMessage('Erro ao excluir registo. Tente novamente.', true);
      }
    }
  };

  // Função para alternar a visibilidade dos registos
  const toggleRecordsVisibility = () => {
    setIsRecordsVisible(!isRecordsVisible);
  };

  if (!userProfile && currentUser) {
    return <div className="text-center text-gray-600 p-8">A carregar perfil do utilizador...</div>;
  }

  if (userProfile && !['master', 'gerente', 'operacional'].includes(userProfile.role)) {
    return (
      <div className="text-center text-red-600 p-8">
        Você não tem permissão para aceder à funcionalidade de Lançamento de Pesagem.
        (Seu nível: {userProfile.role})
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Lançamento de Pesagem</h1>
      
      <MessageBox message={message} isError={isError} />

      <div className="bg-white p-6 rounded-lg shadow">
        <WasteForm onAddWaste={handleAddWasteRecord} />
      </div>

      <div className="bg-white rounded-lg shadow">
        <button
          onClick={toggleRecordsVisibility}
          className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
          aria-expanded={isRecordsVisible}
          aria-controls="waste-records-list"
        >
          <h2 className="text-2xl font-semibold text-gray-700">Registos Recentes</h2>
          <span className="text-2xl text-gray-600 transform transition-transform duration-200">
            {isRecordsVisible ? '▲' : '▼'}
          </span>
        </button>
        
        {isRecordsVisible && (
          <div id="waste-records-list" className="p-6 border-t border-gray-200">
            <WasteRecordsList
              records={wasteRecords}
              loading={loadingRecords}
              onDelete={handleDeleteRecord}
              userRole={userProfile ? userProfile.role : null}
            />
          </div>
        )}
      </div>
    </div>
  );
}
