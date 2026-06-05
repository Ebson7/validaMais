/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Produto } from '../../types';
import { AdminProdutoForm } from '../AdminProdutoForm';
import { CirclePlus, Edit, Trash2, ShieldAlert, Tag, Calendar, ShoppingCart, Loader2 } from 'lucide-react';

export const AdminProdutosValida: React.FC = () => {
  const { user, navigateTo, currentScreen, selectedProductId, showAlert, produtos, produtosLoading: loading, saveProduct, deleteProduct } = useApp();
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);

  const products = produtos.filter(p => p.adminId === user?.uid);

  // Load product to edit if editing scale is selected
  useEffect(() => {
    if (currentScreen === 'admin-produtos-editar' && selectedProductId) {
      const p = products.find(prod => prod.id === selectedProductId);
      if (p) {
        setEditingProduto(p);
      }
    } else {
      setEditingProduto(null);
    }
  }, [currentScreen, selectedProductId, products]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este lote de produtos do catálogo público?')) {
      return;
    }

    try {
      await deleteProduct(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit trigger for creation/editing
  const handleFormSubmit = async (formData: any) => {
    if (!user) return;

    try {
      if (currentScreen === 'admin-produtos-editar' && selectedProductId) {
        await saveProduct(formData, selectedProductId);
      } else {
        await saveProduct(formData, null);
      }

      navigateTo('admin-produtos');
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation controller for forms
  if (currentScreen === 'admin-produtos-novo' || currentScreen === 'admin-produtos-editar') {
    return (
      <div className="glass rounded-3xl border-white/50 p-6 md:p-8 max-w-4xl mx-auto shadow-xs">
        <AdminProdutoForm
          produtoId={currentScreen === 'admin-produtos-editar' ? selectedProductId : null}
          initialProduto={editingProduto}
          onSubmit={handleFormSubmit}
          onCancel={() => navigateTo('admin-produtos')}
        />
      </div>
    );
  }

  return (
    <div id="admin_products_panel" className="space-y-6">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Meus Lotes Postados</h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">Veja e gerencie a lista de perecíveis cadastrados por seu estabelecimento</p>
        </div>
        <button
          onClick={() => navigateTo('admin-produtos-novo')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 transition-all font-mono uppercase tracking-wide font-bold text-xs text-white rounded-xl cursor-pointer"
        >
          <CirclePlus className="w-4 h-4 text-amber-50 shrink-0" />
          Cadastrar Lote
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-sm font-semibold text-gray-500 font-mono">Carregando catálogo...</span>
        </div>
      ) : products.length > 0 ? (
        <div className="glass rounded-3xl border-white/50 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/40 border-b border-white/30 font-mono text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4 md:px-6">Produto</th>
                  <th className="p-4 hidden md:table-cell">Categoria</th>
                  <th className="p-4">Estoque (Disp/Reserv)</th>
                  <th className="p-4">Preço (Original/Promo)</th>
                  <th className="p-4">Validade</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 text-sm font-semibold text-gray-700">
                {products.map((p) => {
                  const totalLeft = p.quantidadeDisponivel - p.quantidadeReservada;
                  const isEsgotado = totalLeft <= 0 || p.status === 'esgotado';
                  
                  // Verification label for date expiry
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const expiry = new Date(p.dataValidade + 'T00:00:00');
                  expiry.setHours(0,0,0,0);
                  const isExpired = expiry.getTime() < today.getTime();

                  return (
                    <tr key={p.id} className={`hover:bg-white/40 transition-all ${isEsgotado ? 'bg-white/10' : ''}`}>
                      {/* Name & Photo */}
                      <td className="p-4 md:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=150'}
                            alt={p.nomeProduto}
                            className="w-10 h-10 rounded-xl object-cover border border-white/35"
                          />
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-extrabold text-sm">{p.nomeProduto}</span>
                            <span className="text-[10px] font-mono text-gray-404 capitalize">{p.nomeLoja}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category field */}
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-xs bg-white/50 px-2 py-0.5 border border-white/40 rounded-md text-gray-600 font-mono">
                          {p.categoria}
                        </span>
                      </td>

                      {/* Stock sizes */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className={`${isEsgotado ? 'text-rose-600 font-bold' : 'text-gray-800'}`}>
                            {totalLeft} restam
                          </span>
                          <span className="text-[10px] text-gray-400">
                            de {p.quantidadeDisponivel} unidades
                          </span>
                        </div>
                      </td>

                      {/* Price labels */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-emerald-700 font-black">
                            {p.precoPromocional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="text-[10px] text-gray-405 line-through">
                            {p.precoOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </td>

                      {/* Expiration warning badge */}
                      <td className="p-4 font-mono text-xs">
                        {isExpired ? (
                          <span className="text-rose-600 bg-rose-55 border border-rose-100 px-1.5 py-0.5 rounded font-bold">VENCIDO</span>
                        ) : (
                          <span className="text-amber-800">{p.dataValidade}</span>
                        )}
                      </td>

                      {/* Interactive Buttons */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => navigateTo('admin-produtos-editar', p.id)}
                            className="p-1.5 hover:bg-amber-100 text-gray-500 hover:text-amber-700 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id!)}
                            className="p-1.5 hover:bg-rose-100 text-gray-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl border-white/50 py-16 text-center max-w-lg mx-auto p-6 space-y-3">
          <div className="w-12 h-12 bg-white/40 border border-white/50 rounded-2xl flex items-center justify-center text-gray-400 mx-auto">
            <Tag className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-extrabold text-gray-800">Nenhum lote foi registrado</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Sua estante virtual está limpa. Comece a divulgar seus alimentos perecíveis com preços de liquidação e conquiste novos clientes locais.
          </p>
          <button
            onClick={() => navigateTo('admin-produtos-novo')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 transition-colors font-mono uppercase tracking-wide font-bold text-xs text-white rounded-xl cursor-pointer mt-4"
          >
            Cadastrar Lote Inicial &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
