/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Trash2, Plus, Tag, HelpCircle } from 'lucide-react';

export const AdminCategoriasValida: React.FC = () => {
  const { categorias, addCategory, deleteCategory, navigateTo } = useApp();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    // Check if category already exists (case-insensitive)
    const exists = categorias.some(c => c.nome.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert(`A categoria '${name}' já existe no sistema.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addCategory(name);
      setNewCategoryName('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Deseja mesmo excluir a categoria "${name}"?`);
    if (!confirmDelete) return;

    try {
      await deleteCategory(id);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div id="admin_categorias_screen" className="space-y-6">
      {/* Header & Back Action */}
      <div className="flex items-center gap-3 border-b border-gray-150 pb-4">
        <button
          onClick={() => navigateTo('admin-dashboard')}
          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Categorias de Produtos</h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">Gerencie as divisões e classificações dos mantimentos ofertados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form to Add New Category */}
        <div className="md:col-span-1">
          <div className="glass border-white/50 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Tag className="w-5 h-5" />
              <h2 className="font-bold text-sm text-gray-900">Cadastrar Categoria</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-2">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Frutas e Vegetais"
                  className="w-full text-sm px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newCategoryName.trim()}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 transition-all text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Cadastrar
              </button>
            </form>

            <div className="rounded-xl bg-amber-50/50 border border-amber-200/50 p-3 flex gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                As novas categorias adicionadas aqui estarão imediatamente disponíveis na ficha de criação e edição de lotes promocionais para todos os lojistas cadastrados.
              </p>
            </div>
          </div>
        </div>

        {/* Existing Categories List */}
        <div className="md:col-span-2">
          <div className="glass border-white/50 p-6 rounded-2xl shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-gray-900">Categorias Ativas ({categorias.length})</h2>
            
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-2">
              {categorias.length === 0 ? (
                <p className="text-sm font-semibold text-gray-400 font-mono py-6">Nenhuma categoria cadastrada.</p>
              ) : (
                categorias.map((cat, idx) => (
                  <div key={cat.id || idx} className="py-3.5 flex items-center justify-between group transition-colors hover:bg-gray-50/40 px-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-sm font-extrabold text-gray-800">{cat.nome}</span>
                        {cat.criadoEm && (
                          <span className="block text-[9px] text-gray-400 font-mono mt-0.5">
                            Cadastrado em: {new Date(cat.criadoEm).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Exclude button if its a fundamental category or allow deleting with caution */}
                    <button
                      onClick={() => cat.id && handleDelete(cat.id, cat.nome)}
                      title="Excluir categoria"
                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-650 hover:text-red-600 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
