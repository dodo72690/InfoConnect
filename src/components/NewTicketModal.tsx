import React, { useState } from 'react';
import { X, Upload, AlertCircle, FileText } from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const NewTicketModal: React.FC<NewTicketModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description,
      file: file // Send the actual File object
    });
    // Reset form
    setDescription('');
    setFile(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Novo Pedido de Assistência</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição do Problema</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Descreva o que aconteceu, mensagens de erro, etc..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Anexo (Opcional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500" />
                <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                  <label className="relative cursor-pointer rounded-md bg-transparent font-medium text-blue-600 dark:text-blue-400 focus-within:outline-none hover:text-blue-500 dark:hover:text-blue-300">
                    <span>Carregar ficheiro</span>
                    <input type="file" className="sr-only" onChange={handleFileChange} />
                  </label>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">Um ficheiro (PNG, JPG, PDF)</p>
              </div>
            </div>

            {/* File Info */}
            {file && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-md">
                <FileText size={16} className="text-blue-500" />
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-start text-sm text-blue-800 dark:text-blue-200">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <p>Ao submeter, receberá uma confirmação. A equipa técnica irá analisar o seu pedido em breve.</p>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            Submeter Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTicketModal;