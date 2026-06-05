/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Produto } from '../../types';
import { getProducts, seedDefaultProducts } from '../../lib/db-wrapper';
import { ProdutoCard } from '../ProdutoCard';
import { Calendar, Store, Percent, ShieldAlert, Sparkles, AlertCircle, ShoppingBag, Leaf, ChevronRight, Info } from 'lucide-react';

export const HomeValida: React.FC = () => {
  const { navigateTo, user, showAlert } = useApp();
  const [loading, setLoading] = useState(true);
  const [highlights, setHighlights] = useState<Produto[]>([]);
  const [dbEmpty, setDbEmpty] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchHighlights = async () => {
    setLoading(true);
    try {
      const allProds = await getProducts();
      // Sort by validity date and limit to 3 items
      const sorted = [...allProds]
        .filter(p => p.status === 'disponivel')
        .sort((a, b) => new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime())
        .slice(0, 3);
      setHighlights(sorted);
      setDbEmpty(allProds.length === 0);
    } catch (error) {
      console.error("Error drawing highlights: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHighlights();
  }, []);

  const handleCreateMockData = async () => {
    setSeeding(true);
    try {
      // Seed using the logged-in admin's ID, or a default string
      const creatorId = user?.uid || 'mock_userId_admin1';
      const count = await seedDefaultProducts(creatorId);
      showAlert(`Sucesso! ${count} produtos de teste gerados com datas calculadas no futuro.`, 'success');
      fetchHighlights();
    } catch (err) {
      showAlert('Erro ao gerar dados de teste.', 'error');
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div id="home_screen" className="space-y-12">
      {/* Premium Hero Banner Section */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 rounded-3xl text-white p-8 md:p-12 relative overflow-hidden shadow-xl border border-emerald-800">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-emerald-800/10 rounded-l-full blur-3xl pointer-events-none" />
        <div className="absolute left-12 bottom-0 w-[45%] h-64 bg-emerald-500/10 rounded-t-full blur-2xl pointer-events-none" />

        <div className="max-w-2xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-emerald-500/30">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Economize com Sustentabilidade
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
            Salve alimentos, pague <span className="text-emerald-400 underline decoration-wavy decoration-emerald-500/50">muito menos</span>.
          </h1>

          <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed font-sans font-medium">
            O <strong>ValidaMais</strong> conecta você a pequenos mercados locais que vendem lotes excelentes de produtos próximos da validade com até <strong>70% de desconto</strong>. Reserve online agora e retire na loja física mais próxima!
          </p>

          <div className="pt-4 flex flex-wrap gap-4.5">
            <button
              onClick={() => navigateTo('produtos')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:scale-102 font-bold text-sm rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-1.5"
            >
              Navegar no Catálogo
              <ChevronRight className="w-4 h-4" />
            </button>
            {!user ? (
              <button
                onClick={() => navigateTo('cadastro')}
                className="px-6 py-3 border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 font-bold text-sm rounded-xl cursor-pointer transition-all"
              >
                Criar Conta Gratuita
              </button>
            ) : user.role === 'admin' ? (
              <button
                onClick={() => navigateTo('admin-produtos')}
                className="px-6 py-3 border border-amber-400/30 text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 font-bold text-xs font-mono uppercase tracking-wide rounded-xl cursor-pointer transition-all"
              >
                Gerenciar Seus Lotes
              </button>
            ) : (
              <button
                onClick={() => navigateTo('minhas-reservas')}
                className="px-6 py-3 border border-emerald-500/30 text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 font-bold text-xs font-mono uppercase tracking-wide rounded-xl cursor-pointer transition-all"
              >
                Suas Reservas Realizadas
              </button>
            )}
          </div>
        </div>

        {/* Floating visual indicators */}
        <div className="absolute right-8 bottom-8 hidden lg:flex flex-col gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-64 shadow-lg font-sans">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-300 font-bold text-base">70%</div>
            <div>
              <span className="block text-[11px] font-bold text-white uppercase tracking-wider font-mono">Maiores descontos</span>
              <span className="text-[10px] text-emerald-200">Em laticínios e padaria</span>
            </div>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-white uppercase tracking-wider font-mono">Zero Desperdício</span>
              <span className="text-[10px] text-emerald-200">Consumo consciente local</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seeding Box Trigger - visible primarily if database is empty */}
      {dbEmpty && (
        <section id="empty_db_seed_section" className="bg-amber-50/50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-amber-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
              Nenhum produto cadastrado ainda!
            </h3>
            <p className="text-xs text-amber-800 font-medium leading-relaxed max-w-xl">
              Como você está testando a aplicação recém-criada, o catálogo está vazio. Clique no botão ao lado para gerar <strong>massa de dados de simulação</strong> contendo 6 produtos predefinidos com contagens de validade em tempo real!
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateMockData}
            disabled={seeding}
            className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs tracking-wide uppercase font-mono rounded-xl shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            {seeding ? 'Gerando...' : 'Carregar Produtos de Teste'}
          </button>
        </section>
      )}

      {/* Main Section Highlights */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Urgência Máxima 🔥</h2>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Lotes com menor data de validade que esgotam primeiro</p>
          </div>
          <button
            onClick={() => navigateTo('produtos')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase font-mono cursor-pointer tracking-wider shrink-0 flex items-center gap-1"
          >
            Ver Catálogo Inteiro <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-100 rounded-2xl h-80 border border-gray-100" />
            ))}
          </div>
        ) : highlights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((prod) => (
              <ProdutoCard key={prod.id} produto={prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-extrabold text-gray-800">Vitrine vazia no momento</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">Nenhum lote promocional de urgência cadastrado no sistema.</p>
          </div>
        )}
      </section>

      {/* Info Boxes Bento Grid block */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-6 border-white/50 space-y-2">
          <span className="text-emerald-700 font-extrabold text-lg">1. Reserve Online</span>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Selecione o produto de interesse, informe a quantidade de retirada desejada e finalize a reserva sem realizar nenhum pagamento prévio pela web.
          </p>
        </div>
        <div className="glass rounded-3xl p-6 border-white/50 space-y-2">
          <span className="text-emerald-700 font-extrabold text-lg">2. Retire na Loja</span>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Vá até o endereço físico indicado de retirada correspondente à loja parceira cadastrada portando seu e-mail de identificação de reserva.
          </p>
        </div>
        <div className="glass rounded-3xl p-6 border-white/50 space-y-2">
          <span className="text-emerald-700 font-extrabold text-lg">3. Pague no Balcão</span>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            O pagamento final da liquidação ocorre diretamente na retirada no caixa da loja física através do método tradicional de sua escolha.
          </p>
        </div>
      </section>
    </div>
  );
};
