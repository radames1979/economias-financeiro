import * as XLSX from 'xlsx';
import { ImportTransaction } from './pdfImportData';

export interface ExcelTransaction {
  Data: string | number | Date;
  Descrição: string;
  Categoria: string;
  Subcategoria: string;
  Tipo: 'Receita' | 'Despesa' | 'Transferência';
  Valor: number;
}

export const parseExcelFile = async (file: File): Promise<ImportTransaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<ExcelTransaction>(worksheet);
        
        const transactions: ImportTransaction[] = jsonData.map((row) => {
          // Handle Excel date format
          let dateStr = '';
          if (typeof row.Data === 'number') {
            const date = XLSX.SSF.parse_date_code(row.Data);
            dateStr = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else if (row.Data instanceof Date) {
            dateStr = row.Data.toISOString().split('T')[0];
          } else {
            dateStr = String(row.Data);
          }

          return {
            date: dateStr,
            description: row.Descrição || 'Sem descrição',
            category: row.Categoria || 'Outros',
            subcategory: row.Subcategoria || '',
            type: row.Tipo === 'Receita' ? 'income' : row.Tipo === 'Despesa' ? 'expense' : 'transfer',
            amount: Math.abs(Number(row.Valor)) || 0,
          };
        });
        
        resolve(transactions);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const downloadExcelTemplate = () => {
  const templateData = [
    {
      Data: '2025-04-01',
      Descrição: 'Exemplo de Receita',
      Categoria: 'Receita',
      Subcategoria: 'Salário',
      Tipo: 'Receita',
      Valor: 5000.00
    },
    {
      Data: '2025-04-02',
      Descrição: 'Exemplo de Despesa',
      Categoria: 'Alimentação',
      Subcategoria: 'Restaurante',
      Tipo: 'Despesa',
      Valor: 150.00
    },
    {
      Data: '2025-04-03',
      Descrição: 'Exemplo de Transferência',
      Categoria: 'Transferência',
      Subcategoria: 'Investimento',
      Tipo: 'Transferência',
      Valor: 1000.00
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  
  XLSX.writeFile(workbook, 'modelo_importacao_financeira.xlsx');
};
