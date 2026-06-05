/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, Filter } from 'lucide-react';

interface FiltrosProdutosProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedStore: string;
  setSelectedStore: (store: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  categories: string[];
  stores: string[];
}

export const FiltrosProdutos: React.FC<FiltrosProdutosProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedStore,
  setSelectedStore,
  sortBy,
  setSortBy,
  categories,
  stores
}) => {
  return (
    <div id="filter_component" className="glass rounded-3xl border-white/50 p-6 shadow-sm mb-8">
      {/* Search Input Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5">Buscar Produto</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              id="filter_input_search"
              type="text"
              placeholder="Ex: Leite Integral, Iogurte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm ps-10 pe-4 py-2 border border-gray-200/60 bg-white/50 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Store Search / Select */}
        <div>
          <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5 font-sans">Selecionar Mercado</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <select
              id="filter_select_store"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full text-sm ps-10 pe-4 py-2 border border-gray-200/60 rounded-xl bg-white/60 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Todos os Mercados</option>
              {stores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort By Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5">Ordenar Por</label>
          <div className="relative">
            <ArrowUpDown className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <select
              id="filter_select_sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-sm ps-10 pe-4 py-2 border border-gray-200/60 rounded-xl bg-white/60 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="URGENTE_PRIMEIRO">Mais Urgente (Vence logo)</option>
              <option value="MENOR_PRECO">Menor Preço (R$)</option>
              <option value="MAIOR_PRECO">Maior Preço (R$)</option>
              <option value="MAIOR_DESCONTO">Maior Desconto (%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories chips filter */}
      <div className="mt-5 pt-4 border-t border-white/40">
        <span className="block text-xs font-bold text-gray-400 font-mono uppercase mb-3 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Filtrar por Categoria
        </span>
        <div id="category_chips_container" className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('Todos')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
              selectedCategory === 'Todos'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white/60 hover:bg-white border-white/50 text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            Todas as Categorias
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-white/60 hover:bg-white border-white/50 text-gray-600 hover:text-gray-900 hover:border-gray-305 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
