export const APP_VERSION = "1.3.4";

export const VERSION_HISTORY = [
  {
    version: "1.3.4",
    date: "2026-05-16",
    changes: [
      "Remoção da barra de navegação secundária no mobile por redundância",
      "Limpeza do topo do layout para melhor visibilidade do Balanço Mensal",
      "Otimização do espaçamento vertical (header fixo vs conteúdo)"
    ]
  },
  {
    version: "1.3.3",
    date: "2026-05-16",
    changes: [
      "Correção de erro de referência (density) no painel de atividades",
      "Melhoria na estabilidade do Dashboard em diferentes modos de visualização"
    ]
  },
  {
    version: "1.3.2",
    date: "2026-05-16",
    changes: [
      "Otimização massiva de espaço em dispositivos móveis",
      "Navegação por abas e seletor de datas mais compactos",
      "Refinamento dos cartões de resumo (Balanço) para melhor aproveitamento vertical",
      "Redução de paddings e gaps em grids mobile",
      "Melhoria na legibilidade do fluxo de atividade em telas pequenas"
    ]
  },
  {
    version: "1.3.1",
    date: "2026-05-16",
    changes: [
      "Header Mobile fixo: barra superior agora permanece travada no topo",
      "Compensação dinâmica de layout para evitar sobreposição sob o Header fixo",
      "Ajuste fino de paddings para Safe Areas em dispositivos iOS"
    ]
  },
  {
    version: "1.3.0",
    date: "2026-05-16",
    changes: [
      "Lançamento do Layout Premium Mobile-First (específico iOS PWA)",
      "Nova 'Bottom Navigation Bar' adaptativa com suporte a Safe Areas",
      "Micro-interações de escala e feedback tátil em todos os botões",
      "Sistema de glass-morphism aprimorado para light e dark mode",
      "Tipografia e geometria (rounded-3xl) otimizadas para apps bancários modernos"
    ]
  },
  {
    version: "1.2.7",
    date: "2026-05-16",
    changes: [
      "Refinamento completo de Safe Areas para PWA no iOS",
      "Correção de paddings em headers e navbars para dispositivos com notch",
      "Padronização de meta tags para melhor integração nativa em dispositivos Apple"
    ]
  },
  {
    version: "1.2.6",
    date: "2026-05-16",
    changes: [
      "Extrato reorganizado: transações agrupadas por mês e dia",
      "Resumo diário de Receitas vs. Despesas adicionado ao Extrato",
      "Otimização da visualização de transações em listas longas"
    ]
  },
  {
    version: "1.2.5",
    date: "2026-05-16",
    changes: [
      "Otimização PWA para iOS: tratamento de safe areas (notch e barra inferior)",
      "Ajuste de min-height do HTML para eliminar barras brancas no modo PWA",
      "Melhoria na renderização em tela cheia para dispositivos móveis"
    ]
  },
  {
    version: "1.2.4",
    date: "2026-05-16",
    changes: [
      "Adicionado registro de versão no rodapé do menu",
      "Habilitado zoom/pinch no mobile para melhor acessibilidade",
      "Novo menu lateral mobile com suporte a gestos (swipe)"
    ]
  },
  {
    version: "1.2.3",
    date: "2026-05-15",
    changes: [
      "Correção de erro de inicialização do dashboard",
      "Novo gráfico de fluxo de caixa diário nas análises",
      "Botão de atalho rápido do Dashboard para o Extrato"
    ]
  }
];
