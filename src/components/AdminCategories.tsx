import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { api } from '../services/api';

interface Category {
    id_categoria: number;
    nome: string;
}

const AdminCategories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            await api.addCategory(newCategory);
            setNewCategory('');
            loadCategories();
        } catch (error) {
            alert("Erro ao adicionar categoria");
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm("Tem a certeza que deseja apagar esta categoria?")) return;

        try {
            await api.deleteCategory(String(id));
            loadCategories();
        } catch (error) {
            alert("Erro ao apagar categoria");
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                    <Tag size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Categorias</h1>
                    <p className="text-slate-500 dark:text-slate-400">Adicione ou remova categorias de serviço.</p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Form */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-fit">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Nova Categoria</h3>
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Nome da categoria..."
                            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={!newCategory.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">Adicionar</span>
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Categorias Existentes</h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Carregando...</div>
                    ) : categories.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">Nenhuma categoria encontrada.</div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {categories.map((cat) => (
                                <div key={cat.id_categoria} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{cat.nome}</span>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id_categoria)}
                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Apagar categoria"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCategories;
