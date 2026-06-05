/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Produto } from '../../types';
import { FiltrosProdutos } from '../FiltrosProdutos';
import { ProdutoCard } from '../ProdutoCard';
import { AlertCircle, SlidersHorizontal, Loader2 } from 'lucide-react';

export const ProdutosValida: React.FC = () => {
  const { produtos, categorias, produtosLoading: loading } = useApp();

  // States of the filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cepQuery, setCepQuery] = useState('');
  const [cepResolvedRegion, setCepResolvedRegion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedStore, setSelectedStore] = useState('');
  const [sortBy, setSortBy] = useState('URGENTE_PRIMEIRO');

  // Derive unique categories and stores for filter dropdowns
  const availableCategories = Array.from(new Set(produtos.map(p => p.categoria))).filter(Boolean);
  const availableStores = Array.from(new Set(produtos.map(p => p.nomeLoja))).filter(Boolean);

  // Filter application pipeline
  const filteredProducts = produtos.filter((product) => {
    // 1. Search filter (text search)
    if (searchQuery) {
      const matchText = searchQuery.toLowerCase();
      const nameMatch = product.nomeProduto.toLowerCase().includes(matchText);
      const descMatch = product.descricao?.toLowerCase().includes(matchText) || false;
      const catMatch = product.categoria.toLowerCase().includes(matchText);
      if (!nameMatch && !descMatch && !catMatch) return false;
    }

    // 2. Category filter
    if (selectedCategory !== 'Todos' && product.categoria !== selectedCategory) {
      return false;
    }

    // 3. Store filter
    if (selectedStore && product.nomeLoja !== selectedStore) {
      return false;
    }

    // 4. CEP filter (match resolved region in product address or store name)
    if (cepResolvedRegion) {
      const matchRegion = cepResolvedRegion.toLowerCase().trim();
      const addressMatch = product.endereco?.toLowerCase().includes(matchRegion);
      const storeNameMatch = product.nomeLoja?.toLowerCase().includes(matchRegion);
      if (!addressMatch && !storeNameMatch) return false;
    }

    return true;
  });

  // Sort order application pipeline
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'URGENTE_PRIMEIRO') {
      return new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime();
    }
    if (sortBy === 'MENOR_PRECO') {
      return a.precoPromocional - b.precoPromocional;
    }
    if (sortBy === 'MAIOR_PRECO') {
      return b.precoPromocional - a.precoPromocional;
    }
    if (sortBy === 'MAIOR_DESCONTO') {
      const discountA = a.precoOriginal > 0 ? (a.precoOriginal - a.precoPromocional) / a.precoOriginal : 0;
      const discountB = b.precoOriginal > 0 ? (b.precoOriginal - b.precoPromocional) / b.precoOriginal : 0;
      return discountB - discountA;
    }
    return 0;
  });

  return (
    <div id="produtos_catalog_screen" className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight">Lotes Promocionais Próximos da Validade</h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">Navegue, selecione as quantidades que precisa, reserve e retire pessoalmente</p>
      </div>

      {/* Interactive Filters Grid Utility */}
      <FiltrosProdutos
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cepQuery={cepQuery}
        setCepQuery={setCepQuery}
        cepResolvedRegion={cepResolvedRegion}
        setCepResolvedRegion={setCepResolvedRegion}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categorias.length > 0 ? categorias.map(c => c.nome) : ['Laticínios', 'Padaria', 'Hortifrúti', 'Carnes', 'Bebidas', 'Mercearia']}
        stores={availableStores}
      />

      {/* Catalog Render Panel */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-gray-500 font-mono">Processando estoque...</span>
        </div>
      ) : sortedProducts.length > 0 ? (
        <div id="products_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((p) => (
            <ProdutoCard key={p.id} produto={p} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl border-white/50 py-16 text-center max-w-lg mx-auto p-6 space-y-3">
          <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center text-gray-400 mx-auto border border-white/50">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-gray-800">Nenhum lote corresponde aos filtros</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Experimente alterar as palavras de busca, escolher outra categoria ou desmarcar o filtro de estabelecimentos para encontrar novas oportunidades de economia.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Todos');
              setSelectedStore('');
              setSortBy('URGENTE_PRIMEIRO');
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 font-mono uppercase tracking-wider cursor-pointer mt-3"
          >
            Limpar Filtros de Busca
          </button>
        </div>
      )}
    </div>
  );
};
