/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cores Primárias
        "blue-coral": "#0D4F5F", // Tom de azul. Uso: Principal, fundos.
        "apricot-orange": "#CE603E", // Outro tom de laranja. Uso: Destaques, acolhimento.

        // Cores Secundárias
        "rain-forest": "#0D3520", // Verde escuro.
        "early-frost": "#BCBCBC", // Cinza claro e neutro.
        "golden-orange": "#DB8D37", // Laranja dourado.
        "rich-soil": "#51321D", // Marrom escuro.

        // Subtons para Texto
        "abundant-green": "#174C2F", // Variação clara do verde.
        "exotic-plume": "#156172", // Variação clara do azul.
      },
      fontFamily: {
        lexend: ['"Lexend"', "sans-serif"], // Fonte para títulos e destaques.
        comfortaa: ['"Comfortaa"', "cursive"], // Fonte para textos corridos.
      },
      fontSize: {
        // [Tamanho da Fonte, Altura da Linha]
        corpo: ["0.875rem", "1.6"], // 14px. Para parágrafos e textos longos.
        acao: ["1.5rem", "1.4"], // 24px. Para botões e chamadas de ação.
        subtitulo: ["2.25rem", "1.25"], // 36px. Para subtítulos.
        titulo: ["3.5rem", "1.2"], // 56px. Para títulos principais.
        teste1: ["3rem", "1.2"], // 48px
        teste2: ["2rem", "1.2"], // 32px
      },
    },
  },
  plugins: [],
};
