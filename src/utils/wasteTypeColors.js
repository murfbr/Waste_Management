/**
 * Mapa de cores associadas aos tipos de resíduos.
 * Cada tipo possui uma cor de fundo (bg) e uma cor de texto (text),
 * que podem ser aplicadas dinamicamente em componentes visuais.
 */

export const wasteTypeColors = {
  Reciclável: {
    bg: '#0D4F5F',  // rain-forest
    text: '#FFFFFF'
  },
  Orgânico: {
    bg: '#51321D',   // rich-soil
    text: '#FFFFFF'
  },
  Rejeito: {
    bg: '#BCBCBC',   // early-frost
    text: '#FFFFFF'
  },
  Papel: {
    bg: '#0000FF',   // Azul puro
    text: '#FFFFFF'
  },
  Plástico: {
    bg: '#FF0000',   // Vermelho
    text: '#FFFFFF'
  },
  Vidro: {
    bg: '#008000',   // Verde
    text: '#FFFFFF'
  },
  Metal: {
    bg: '#FFFF00',   // Amarelo
    text: '#000000'
  },
  Madeira: {
    bg: '#000000',   // Preto
    text: '#FFFFFF'
  },
  Perigosos: {
    bg: '#FFA500',   // Laranja
    text: '#FFFFFF'
  },
  Baterias: {
    bg: '#FFA500',   // Laranja (mesmo dos perigosos)
    text: '#FFFFFF'
  },
  Eletrônicos: {
    bg: '#f26c22',   // 
    text: '#FFFFFF'
  },
  'Pré-serviço': {
    bg: '#d4a373',   // Bege médio
    text: '#FFFFFF'
  },
  'Pós-serviço': {
    bg: '#6f4e37',   // Marrom avermelhado
    text: '#FFFFFF'
  },
  default: {
    bg: '#6b7280',   // Gray-500 do Tailwind
    text: '#FFFFFF'
  }
};
