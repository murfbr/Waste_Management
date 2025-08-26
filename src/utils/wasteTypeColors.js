// --- 1. Definir as cores base como constantes ---
const RECYCLABLE_COLOR = { bg: '#0D4F5F', text: '#FFFFFF' };
const ORGANIC_COLOR =    { bg: '#51321D', text: '#FFFFFF' };
const REJECT_COLOR =     { bg: '#BCBCBC', text: '#FFFFFF' };
const PAPER_COLOR =      { bg: '#0000FF', text: '#FFFFFF' };
const PLASTIC_COLOR =    { bg: '#FF0000', text: '#FFFFFF' };
const GLASS_COLOR =      { bg: '#008000', text: '#FFFFFF' };
const METAL_COLOR =      { bg: '#FFFF00', text: '#000000' };
const WOOD_COLOR =       { bg: '#000000', text: '#FFFFFF' };
const HAZARDOUS_COLOR =  { bg: '#FFA500', text: '#FFFFFF' };
const ELECTRONICS_COLOR ={ bg: '#f26c22', text: '#FFFFFF' };
const DEFAULT_COLOR =    { bg: '#6b7280', text: '#FFFFFF' };

// --- 2. Mapear todas as chaves para as cores base ---
export const wasteTypeColors = {
  // Padrão
  default: DEFAULT_COLOR,

  // Reciclável
  'Reciclável': RECYCLABLE_COLOR,
  'Recyclable': RECYCLABLE_COLOR,
  'Reciclable': RECYCLABLE_COLOR,

  // Orgânico
  'Orgânico': ORGANIC_COLOR,
  'Organic': ORGANIC_COLOR,

  // Rejeito
  'Rejeito': REJECT_COLOR,
  'Reject': REJECT_COLOR,
  'Rechazo': REJECT_COLOR,

  // Papel
  'Papel': PAPER_COLOR,
  'Paper': PAPER_COLOR,

  // Plástico
  'Plástico': PLASTIC_COLOR,
  'Plastic': PLASTIC_COLOR,

  // Vidro
  'Vidro': GLASS_COLOR,
  'Glass': GLASS_COLOR,

  // Metal
  'Metal': METAL_COLOR,

  // Madeira
  'Madeira': WOOD_COLOR,
  'Wood': WOOD_COLOR,

  // Perigosos / Baterias
  'Perigosos': HAZARDOUS_COLOR,
  'Hazardous': HAZARDOUS_COLOR,
  'Peligrosos': HAZARDOUS_COLOR,
  'Baterias': HAZARDOUS_COLOR,
  'Batteries': HAZARDOUS_COLOR,
  'Baterías': HAZARDOUS_COLOR,

  // Eletrônicos
  'Eletrônicos': ELECTRONICS_COLOR,
  'Electronics': ELECTRONICS_COLOR,
  'Electrónicos': ELECTRONICS_COLOR,

  // Outros (Estes parecem ser específicos e talvez não precisem de tradução, mas adicione se necessário)
  'Pré-serviço': { bg: '#d4a373', text: '#FFFFFF' },
  'Pós-serviço': { bg: '#6f4e37', text: '#FFFFFF' },
};