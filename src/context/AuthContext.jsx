// src/context/AuthContext.jsx

import { createContext } from 'react';

// Cria e exporta o AuthContext.
// Ele será usado para prover (AuthContext.Provider) as instâncias do Firebase
// e o usuário logado para todos os componentes que precisarem delas,
// sem a necessidade de passar props manualmente em cada nível da árvore de componentes.
const AuthContext = createContext(null);

export default AuthContext;