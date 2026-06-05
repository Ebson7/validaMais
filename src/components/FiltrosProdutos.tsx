/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, Filter } from 'lucide-react';

interface FiltrosProdutosProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cepQuery: string;
  setCepQuery: (cep: string) => void;
  cepResolvedRegion: string;
  setCepResolvedRegion: (region: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedStore: string;
  setSelectedStore: (store: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  categories: string[];
  stores: string[];
}

const getCachedCep = (cep: string): any => {
  try {
    const raw = sessionStorage.getItem('validamais_cep_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed[cep] || null;
    }
  } catch (e) {}
  return null;
};

const setCachedCep = (cep: string, data: any) => {
  try {
    const raw = sessionStorage.getItem('validamais_cep_cache') || '{}';
    const parsed = JSON.parse(raw);
    parsed[cep] = data;
    sessionStorage.setItem('validamais_cep_cache', JSON.stringify(parsed));
  } catch (e) {}
};

export const FiltrosProdutos: React.FC<FiltrosProdutosProps> = ({
  searchQuery,
  setSearchQuery,
  cepQuery,
  setCepQuery,
  cepResolvedRegion,
  setCepResolvedRegion,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              className="w-full text-sm ps-10 pe-4 py-2 border border-gray-200/60 bg-white/50 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all font-semibold"
            />
          </div>
        </div>

        {/* CEP Search */}
        <div>
          <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5 flex justify-between items-center">
            <span>Filtrar por CEP</span>
            {cepResolvedRegion && (
              <button 
                type="button"
                onClick={() => {
                  setCepQuery('');
                  setCepResolvedRegion('');
                }}
                className="text-[9px] text-red-500 font-mono font-bold uppercase hover:underline cursor-pointer"
              >
                Limpar
              </button>
            )}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-emerald-600" />
            <input
              type="text"
              maxLength={9}
              placeholder="Ex: 01311-000"
              value={cepQuery}
              onChange={async (e) => {
                const val = e.target.value;
                const cleaned = val.replace(/\D/g, '');
                let formatted = cleaned;
                if (cleaned.length > 5) {
                  formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5, 8)}`;
                }
                setCepQuery(formatted);
                
                if (cleaned.length === 8) {
                  // Check cache first
                  const cached = getCachedCep(cleaned);
                  if (cached) {
                    setCepResolvedRegion(cached.region);
                    return;
                  }

                  try {
                    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
                    const data = await response.json();
                    if (!data.erro) {
                      const region = data.bairro || data.localidade || '';
                      setCepResolvedRegion(region);
                      setCachedCep(cleaned, { region });
                    } else {
                      setCepResolvedRegion('');
                      alert('CEP não localizado no ViaCEP.');
                    }
                  } catch (err) {
                    setCepResolvedRegion('');
                  }
                } else if (cleaned.length < 8) {
                  setCepResolvedRegion('');
                }
              }}
              className="w-full text-sm ps-10 pe-4 py-2 border border-emerald-300 bg-emerald-50/10 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all font-mono font-bold text-emerald-850"
            />
          </div>
          {cepResolvedRegion && (
            <span className="block text-[10px] text-emerald-700 font-bold mt-1 truncate">
              📍 Região: {cepResolvedRegion}
            </span>
          )}
        </div>

        {/* Store Search / Select */}
        <div>
          <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5">Selecionar Mercado</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <select
              id="filter_select_store"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full text-sm ps-10 pe-4 py-2 border border-gray-200/60 rounded-xl bg-white/60 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all appearance-none cursor-pointer font-semibold text-gray-700"
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
              className="w-full text-sm ps-10 pe-4 py-2 border border-gray-200/60 rounded-xl bg-white/60 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all appearance-none cursor-pointer font-semibold text-gray-700"
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
                  : 'bg-white/60 hover:bg-white border-white/50 text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
