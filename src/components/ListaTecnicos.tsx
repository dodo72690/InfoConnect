import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Mail, Phone, Wrench, Loader2, Building2 } from 'lucide-react';
import { api } from '../services/api';

const ListaTecnicos: React.FC = () => {
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTechnicians();
    }, []);

    const loadTechnicians = async () => {
        try {
            const allUsers = await api.getUsers();
            // Filtrar apenas técnicos
            const techUsers = allUsers.filter(u => u.role === UserRole.TECHNICIAN);
            setTechnicians(techUsers);
        } catch (error) {
            console.error("Erro ao carregar técnicos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 w-full flex justify-center items-center text-slate-500">
                <Loader2 className="animate-spin mr-2" size={24} /> Carregando técnicos...
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 w-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Equipa Técnica</h1>
                <p className="text-slate-500 dark:text-slate-400">Lista de técnicos disponíveis.</p>
            </div>

            {technicians.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p>Nenhum técnico encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {technicians.map(tech => (
                        <div key={tech.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-4 mb-4">
                                <img src={tech.avatarUrl} alt={tech.name} className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 object-cover" />
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{tech.name}</h3>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full w-fit mt-1">
                                        <Wrench size={12} />
                                        <span>{tech.specialty || 'Técnico Geral'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="truncate">{tech.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-slate-400" />
                                    <span>{tech.phone || 'Sem contacto'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building2 size={16} className="text-slate-400" />
                                    <span>{tech.companyName || 'InfoConnect'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ListaTecnicos;
