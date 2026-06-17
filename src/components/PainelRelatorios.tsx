import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { api } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PainelRelatorios: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      // 1. Fetch all tickets
      const tickets = await api.getTickets();
      if (!tickets || tickets.length === 0) {
        alert("Não existem dados para gerar relatório.");
        return;
      }

      // 2. Create PDF
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text("Relatório de Pedidos - InfoConnect", 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 14, 30);

      // Table Data
      const tableData = tickets.map(t => [
        t.id,
        new Date(t.createdAt).toLocaleDateString(),
        t.clientName,
        t.status,
        t.description.substring(0, 50) + (t.description.length > 50 ? '...' : '')
      ]);

      // Generate Table
      autoTable(doc, {
        head: [['ID', 'Data', 'Cliente', 'Estado', 'Descrição']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] }, // Blue-600
        alternateRowStyles: { fillColor: [241, 245, 249] } // Slate-100
      });

      // Save
      doc.save(`relatorio_pedidos_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar relatório PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Relatórios</h1>
        <p className="text-slate-500 dark:text-slate-400">Exporte dados do sistema para análise externa.</p>
      </div>

      <div className="w-full max-w-xl mx-auto">
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
            {loading ? <span className="animate-spin">⌛</span> : <Download size={18} />}
            {loading ? "A gerar..." : "Baixar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PainelRelatorios;