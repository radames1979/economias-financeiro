
export interface ImportAccount {
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'investment' | 'credit_card' | 'other';
}

export const ACCOUNT_IMPORT_DATA: ImportAccount[] = [
  { name: 'Banco - BB', balance: 122.18, type: 'checking' },
  { name: 'Banco - Itaú', balance: 46.75, type: 'checking' },
  { name: 'Banco - Itaú - Be', balance: 5478.99, type: 'checking' },
  { name: 'Banco - Itaú - Luiza', balance: 130.63, type: 'checking' },
  { name: 'Banco - PicPay', balance: 118.00, type: 'checking' },
  { name: 'Banco - Santander', balance: 184.18, type: 'checking' },
  { name: 'Banco - c6 bank - fá', balance: 21.04, type: 'checking' },
  { name: 'Banco - inter - Rani', balance: 3273.30, type: 'checking' },
  { name: 'Caixa - 4FC', balance: -1962.39, type: 'checking' },
  { name: 'Caixa - Carteira', balance: 550.00, type: 'checking' },
  { name: 'Empréstimo', balance: 0.00, type: 'other' },
  { name: 'Nomad', balance: 3000.00, type: 'checking' },
  { name: 'Vale - COC', balance: 0.88, type: 'other' },
  { name: 'Vale - Seara', balance: 7.66, type: 'other' },
];
