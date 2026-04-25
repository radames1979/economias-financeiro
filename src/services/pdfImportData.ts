
export interface ImportTransaction {
  category: string;
  subcategory: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  description: string;
}

export const PDF_IMPORT_DATA: ImportTransaction[] = [
  // --- Entradas (Income) ---
  // Salário
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 10819.16, date: '2025-04-01', description: 'Salário - Abr/25' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 10831.89, date: '2025-05-01', description: 'Salário - Mai/25' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 10850.97, date: '2025-06-01', description: 'Salário - Jun/25' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 11381.73, date: '2025-07-01', description: 'Salário - Jul/25' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 10299.59, date: '2025-08-01', description: 'Salário - Ago/25' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 10580.24, date: '2025-09-01', description: 'Salário - Set/25' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 10682.69, date: '2025-10-01', description: 'Salário - Out/25' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 10335.57, date: '2025-11-01', description: 'Salário - Nov/25' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 12536.31, date: '2025-12-01', description: 'Salário - Dez/25' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 6374.56, date: '2026-01-01', description: 'Salário - Jan/26' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 8626.08, date: '2026-02-01', description: 'Salário - Fev/26' },
  { category: 'Receita', subcategory: 'Salário', type: 'income', amount: 8910.63, date: '2026-03-01', description: 'Salário - Mar/26' },

  // Bônus
  { category: 'Receita', subcategory: 'Bônus', type: 'income', amount: 200.00, date: '2025-04-01', description: 'Bônus - Abr/25' },
  { category: 'Receita', subcategory: 'Bônus', type: 'income', amount: 568.08, date: '2025-08-01', description: 'Bônus - Ago/25' },
  { category: 'Receita', subcategory: 'Bônus', type: 'income', amount: 792.11, date: '2025-09-01', description: 'Bônus - Set/25' },
  { category: 'Receita', subcategory: 'Bônus', type: 'income', amount: 2237.90, date: '2025-10-01', description: 'Bônus - Out/25' },
  { category: 'Receita', subcategory: 'Bônus', type: 'income', amount: 400.00, date: '2025-11-01', description: 'Bônus - Nov/25' },
  { category: 'Receita', subcategory: 'Bônus', type: 'income', amount: 250.00, date: '2025-12-01', description: 'Bônus - Dez/25' },
  { category: 'Receita', subcategory: 'Bônus', type: 'income', amount: 469.23, date: '2026-01-01', description: 'Bônus - Jan/26' },
  { category: 'Receita', subcategory: 'Bônus', type: 'income', amount: 400.00, date: '2026-02-01', description: 'Bônus - Fev/26' },
  { category: 'Receita', subcategory: 'Bônus', type: 'income', amount: 931.70, date: '2026-03-01', description: 'Bônus - Mar/26' },

  // --- Saídas (Expenses) ---
  // Alimentação - Almoço
  { category: 'Alimentação', subcategory: 'Almoço', type: 'expense', amount: 479.50, date: '2025-04-01', description: 'Almoço - Abr/25' },
  { category: 'Alimentação', subcategory: 'Almoço', type: 'expense', amount: 32.00, date: '2025-05-01', description: 'Almoço - Mai/25' },
  { category: 'Alimentação', subcategory: 'Almoço', type: 'expense', amount: 145.00, date: '2025-06-01', description: 'Almoço - Jun/25' },
  { category: 'Alimentação', subcategory: 'Almoço', type: 'expense', amount: 113.00, date: '2025-07-01', description: 'Almoço - Jul/25' },
  { category: 'Alimentação', subcategory: 'Almoço', type: 'expense', amount: 199.69, date: '2025-08-01', description: 'Almoço - Ago/25' },
  { category: 'Alimentação', subcategory: 'Almoço', type: 'expense', amount: 189.00, date: '2025-10-01', description: 'Almoço - Out/25' },
  { category: 'Alimentação', subcategory: 'Almoço', type: 'expense', amount: 390.50, date: '2025-11-01', description: 'Almoço - Nov/25' },
  { category: 'Alimentação', subcategory: 'Almoço', type: 'expense', amount: 84.46, date: '2026-01-01', description: 'Almoço - Jan/26' },
  { category: 'Alimentação', subcategory: 'Almoço', type: 'expense', amount: 266.22, date: '2026-02-01', description: 'Almoço - Fev/26' },

  // Casa - Água
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 38.40, date: '2025-04-01', description: 'Água - Abr/25' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 38.40, date: '2025-05-01', description: 'Água - Mai/25' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 45.29, date: '2025-06-01', description: 'Água - Jun/25' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 38.40, date: '2025-07-01', description: 'Água - Jul/25' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 38.40, date: '2025-08-01', description: 'Água - Ago/25' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 38.40, date: '2025-09-01', description: 'Água - Set/25' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 41.70, date: '2025-10-01', description: 'Água - Out/25' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 41.07, date: '2025-11-01', description: 'Água - Nov/25' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 90.88, date: '2025-12-01', description: 'Água - Dez/25' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 41.70, date: '2026-02-01', description: 'Água - Fev/26' },
  { category: 'Casa', subcategory: 'Água', type: 'expense', amount: 49.18, date: '2026-03-01', description: 'Água - Mar/26' },

  // Lazer - Futebol
  { category: 'Lazer', subcategory: 'Futebol', type: 'expense', amount: 478.00, date: '2025-03-01', description: 'Futebol - Mar/25' },
  { category: 'Lazer', subcategory: 'Futebol', type: 'expense', amount: 100.00, date: '2025-05-01', description: 'Futebol - Mai/25' },
  { category: 'Lazer', subcategory: 'Futebol', type: 'expense', amount: 10.00, date: '2025-06-01', description: 'Futebol - Jun/25' },
  { category: 'Lazer', subcategory: 'Futebol', type: 'expense', amount: 470.00, date: '2025-07-01', description: 'Futebol - Jul/25' },
  { category: 'Lazer', subcategory: 'Futebol', type: 'expense', amount: 845.00, date: '2025-11-01', description: 'Futebol - Nov/25' },

  // Transporte - Combustível
  { category: 'Transporte', subcategory: 'Combustível', type: 'expense', amount: 460.04, date: '2025-04-01', description: 'Combustível - Abr/25' },
  { category: 'Transporte', subcategory: 'Combustível', type: 'expense', amount: 350.00, date: '2025-05-01', description: 'Combustível - Mai/25' },
  { category: 'Transporte', subcategory: 'Combustível', type: 'expense', amount: 265.99, date: '2025-06-01', description: 'Combustível - Jun/25' },
  { category: 'Transporte', subcategory: 'Combustível', type: 'expense', amount: 406.00, date: '2025-07-01', description: 'Combustível - Jul/25' },
  { category: 'Transporte', subcategory: 'Combustível', type: 'expense', amount: 200.00, date: '2025-08-01', description: 'Combustível - Ago/25' },
  { category: 'Transporte', subcategory: 'Combustível', type: 'expense', amount: 290.00, date: '2025-09-01', description: 'Combustível - Set/25' },
  { category: 'Transporte', subcategory: 'Combustível', type: 'expense', amount: 153.50, date: '2025-10-01', description: 'Combustível - Out/25' },
  { category: 'Transporte', subcategory: 'Combustível', type: 'expense', amount: 260.00, date: '2026-01-01', description: 'Combustível - Jan/26' },
  { category: 'Transporte', subcategory: 'Combustível', type: 'expense', amount: 100.00, date: '2026-02-01', description: 'Combustível - Fev/26' },
];
