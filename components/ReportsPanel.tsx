import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';

const ReportsPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      // Para download de ficheiros, usamos window.open ou criamos um link temporário
      // Como a API retorna um stream, o browser lida com o download
      window.open('http://localhost:3000/api/reports/tickets/pdf', '_blank');
    } catch (error) {
      console.error("Erro ao baixar relatório:", error);
      alert("Erro ao gerar relatório PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Relatórios</h1>
        <p className="text-slate-500 dark:text-slate-400">Exporte dados do sistema para análise externa.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card PDF */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-red-600 dark:text-red-400">
              <FileText size={32} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Relatório de Pedidos (PDF)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Lista completa de todos os pedidos e estados.</p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={loading}
            className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Baixar PDF
          </button>
        </div>

        {/* Card Excel (Placeholder) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all opacity-75">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Exportar Excel (CSV)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Dados brutos para análise em folha de cálculo.</p>
            </div>
          </div>
          <button
            disabled
            className="w-full py-2 px-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <Download size={18} />
            Em breve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;