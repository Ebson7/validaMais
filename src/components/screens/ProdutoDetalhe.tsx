/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Store, Calendar, MapPin, DollarSign, Plus, Minus, CreditCard, ShieldCheck, ShoppingCart, Loader2, Info, Star } from 'lucide-react';

export const ProdutoDetalheValida: React.FC = () => {
  const { selectedProductId, navigateTo, user, showAlert, produtos, produtosLoading: loading, createReservation, avaliacoes } = useApp();
  const [quantidade, setQuantidade] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const produto = produtos.find(p => p.id === selectedProductId) || null;

  const avaliacoesLoja = avaliacoes.filter(
    a => a.nomeLoja.toLowerCase().trim() === (produto?.nomeLoja || '').toLowerCase().trim()
  );

  const mediaAvaliacao = avaliacoesLoja.length > 0
    ? (avaliacoesLoja.reduce((sum, a) => sum + a.estrelas, 0) / avaliacoesLoja.length).toFixed(1)
    : null;

  useEffect(() => {
    if (!selectedProductId) {
      navigateTo('home');
      return;
    }
    if (!loading && !produto) {
      showAlert('Produto não localizado.', 'error');
      navigateTo('home');
    }
  }, [selectedProductId, loading, produto]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-sm font-semibold text-gray-500 font-mono">Carregando lote...</span>
      </div>
    );
  }

  if (!produto) return null;

  const original = produto.precoOriginal;
  const promo = produto.precoPromocional;
  const discountPercent = original > 0 ? Math.round(((original - promo) / original) * 100) : 0;

  // Calculo de Validade
  const checkExpiryStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr + 'T00:00:00');
    expiry.setHours(0, 0, 0, 0);

    const timeDiff = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft < 0) {
      return { label: 'VENCIDO', color: 'text-rose-600 bg-rose-50 border-rose-100', isExpired: true, days: daysLeft };
    } else if (daysLeft === 0) {
      return { label: 'VENCE HOJE', color: 'text-amber-700 bg-amber-50 border-amber-200 animate-pulse', isExpired: false, days: 0 };
    } else if (daysLeft === 1) {
      return { label: 'VENCE AMANHÃ', color: 'text-amber-700 bg-amber-50 border-amber-200', isExpired: false, days: 1 };
    } else {
      return { label: `Validade: ${daysLeft} dias restantes (${produto.dataValidade})`, color: 'text-emerald-800 bg-emerald-50 border-emerald-100', isExpired: false, days: daysLeft };
    }
  };

  const expiry = checkExpiryStatus(produto.dataValidade);
  const totalAvailable = produto.quantidadeDisponivel - produto.quantidadeReservada;
  const isEsgotado = totalAvailable <= 0 || produto.status === 'esgotado';

  const handleIncrement = () => {
    if (quantidade < totalAvailable) {
      setQuantidade(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantidade > 1) {
      setQuantidade(prev => prev - 1);
    }
  };

  // Atomic database transaction to prevent double reservation or over-booking
  const handleReserve = async () => {
    if (!user) {
      showAlert('Você precisa fazer login para reservar produtos.', 'warning');
      navigateTo('login');
      return;
    }

    if (user.role === 'admin') {
      showAlert('Lojistas/Admins não podem reservar produtos para permitir rotatividade honesta.', 'warning');
      return;
    }

    if (isEsgotado || expiry.isExpired) return;

    setReserving(true);
    try {
      await createReservation(produto.id!, quantidade);
      navigateTo('minhas-reservas');
    } catch (err: any) {
      console.error(err);
    } finally {
      setReserving(false);
    }
  };

  return (
    <div id="product_details_screen" className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigateTo('produtos')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-700 transition-colors uppercase font-mono cursor-pointer"
      >
        &larr; Voltar para o Catálogo
      </button>

      <div className="glass rounded-3xl border-white/50 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
        {/* Photo Container */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/40 border border-white/30">
            <img
              src={(produto.imagens && produto.imagens[activeImageIndex]) || produto.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=600'}
              alt={produto.nomeProduto}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {discountPercent > 0 && (
              <div className="absolute top-4 left-4 bg-rose-600 text-white font-extrabold text-sm px-3.5 py-1.5 rounded-xl shadow-md font-mono">
                {discountPercent}% DESCONTO
              </div>
            )}
          </div>

          {/* Interactive Multi-angle Thumbnails Row */}
          {produto.imagens && produto.imagens.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {produto.imagens.map((imgUrl, idx) => {
                const viewpointLabels = ["Frente", "Lado Dir.", "Lado Esq."];
                const label = viewpointLabels[idx] || `Ângulo ${idx + 1}`;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex flex-col items-center gap-1.5 p-1 rounded-xl border transition-all cursor-pointer bg-white/40 hover:bg-white/70 ${
                      activeImageIndex === idx ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-gray-200'
                    }`}
                  >
                    <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-50">
                      <img src={imgUrl} alt={`Ângulo ${label}`} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold font-sans text-gray-500 tracking-tight leading-none truncate w-full uppercase">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="glass border-white/40 rounded-2xl p-4 space-y-2 bg-white/40">
            <h4 className="text-xs font-bold text-gray-500 font-mono uppercase">Local de Retirada Física</h4>
            <div className="flex items-start gap-2 text-xs text-gray-700 font-semibold leading-relaxed">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{produto.endereco}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-2 leading-tight">
              * Nota: não oferecemos serviço de entrega. Toda a logística de compra e transporte do produto é feita pessoalmente por você na loja parceira.
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{produto.nomeLoja}</span>
              </div>
              {mediaAvaliacao ? (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-lg text-amber-750 text-amber-700 font-mono text-[10px] font-black">
                  <span>★ {mediaAvaliacao}</span>
                  <span className="text-gray-400 font-normal">({avaliacoesLoja.length})</span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-gray-405 text-gray-400 font-mono uppercase bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">Novo parceiro</span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
              {produto.nomeProduto}
            </h1>

            <div className="inline-flex items-center gap-1 text-xs font-bold border px-3 py-1 rounded-full uppercase font-mono leading-none tracking-wide text-center">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span className={`px-1 rounded-sm ${expiry.color}`}>{expiry.label}</span>
            </div>

            {/* Custom Category Tag */}
            <div className="text-xs font-medium text-gray-600">
              Categoria:{' '}
              <span className="font-bold text-gray-900 underline decoration-slate-300">
                {produto.categoria}
              </span>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">Descrição do Lote</div>
              <p className="text-sm text-gray-650 text-gray-600 leading-relaxed font-medium">
                {produto.descricao || 'O vendedor não adicionou notas adicionais sobre este exemplar promocional.'}
              </p>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Pricing visualization */}
            <div className="bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">Preço Original</span>
                <span className="text-sm font-semibold text-slate-400 line-through">
                  {produto.precoOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="space-y-0.5 text-right flex-1">
                <span className="text-[10px] font-extrabold text-emerald-700 font-mono uppercase block">Preço Líquido Promo</span>
                <span className="text-2xl font-black text-emerald-600 leading-none">
                  {produto.precoPromocional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive reservations control bucket */}
          <div className="mt-8 space-y-4">
            {isEsgotado ? (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center">
                <span className="text-rose-700 text-sm font-bold uppercase font-mono tracking-wider">Lote Esgotado / Retirado</span>
                <p className="text-xs text-rose-600 mt-1">Este produto já foi totalmente reservado por outros consumidores.</p>
              </div>
            ) : expiry.isExpired ? (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center">
                <span className="text-rose-700 text-sm font-bold uppercase font-mono tracking-wider">Lote Expirado (Vencido)</span>
                <p className="text-xs text-rose-600 mt-1">Por regras de vigilância sanitária, produtos vencidos não podem ser reservados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quantity selector */}
                <div className="flex items-center justify-between bg-gray-50 p-3.5 rounded-2xl border border-gray-150">
                  <span className="text-xs font-bold text-gray-700 shrink-0">Quantidade à reservar:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={quantidade <= 1}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100 transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-mono font-bold text-lg text-gray-900 w-6 text-center">{quantidade}</span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={quantidade >= totalAvailable}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtotal calculator */}
                <div className="flex justify-between items-center text-sm font-mono font-semibold px-2">
                  <span className="text-gray-500">Subtotal Líquido:</span>
                  <span className="text-emerald-700 font-extrabold text-base">
                    {(promo * quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* Submit action */}
                {user ? (
                  user.role === 'admin' ? (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-800 leading-relaxed space-y-1">
                      <p className="font-bold flex items-center gap-1 uppercase font-mono"><Info className="w-3.5 h-3.5" /> Atenção Lojista:</p>
                      <p>Sua conta está cadastrada como Administrador/Lojista. Contas administrativas não estão autorizadas a efetuar reservas no catálogo público.</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleReserve}
                      disabled={reserving}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 hover:scale-101 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {reserving ? (
                        <span className="font-mono">Processando...</span>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 text-emerald-100" />
                          Confirmar Reserva Grátis
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <div className="space-y-2.5">
                    <button
                      onClick={() => navigateTo('login')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Conectar e Reservar
                    </button>
                    <p className="text-[10px] text-gray-500 leading-tight text-center">
                      * Reservar e reter itens exige login por razões de auditoria e limitação individual de desperdício. Cadastro leva 30 segundos!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consumer Reviews Board */}
      <div className="glass rounded-3xl border-white/50 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-tight">Avaliações do Estabelecimento</h2>
            <p className="text-xs text-gray-500 font-medium">Veja o que outros consumidores relataram sobre suas experiências com {produto.nomeLoja}</p>
          </div>
          {mediaAvaliacao && (
            <div className="text-right">
              <div className="text-2xl font-black text-amber-500 leading-none">★ {mediaAvaliacao}</div>
              <span className="text-[10px] font-bold text-gray-400 font-mono uppercase">{avaliacoesLoja.length} feedbacks</span>
            </div>
          )}
        </div>

        {avaliacoesLoja.length > 0 ? (
          <div className="divide-y divide-gray-100 space-y-4">
            {avaliacoesLoja.map((av, index) => (
              <div key={av.id || index} className={`pt-4 ${index === 0 ? 'pt-0' : ''} space-y-2`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {/* Tiny avatar representation */}
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-xs uppercase font-mono">
                      {av.usuarioEmail.substring(0, 2)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block leading-tight">{av.usuarioEmail}</span>
                      <span className="text-[9px] font-semibold text-gray-400 font-mono">{new Date(av.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  {/* Stars display */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= av.estrelas ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {av.comentario && (
                  <p className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-55/60 bg-slate-50/50 p-3 rounded-xl border border-gray-100">
                    "{av.comentario}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 space-y-2">
            <p className="text-xs font-semibold font-mono uppercase tracking-wider">Ainda Sem Avaliações</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
              Este mercado ainda não recebeu avaliações de retirada. Reserve um lote perecível, conclua e seja o primeiro a deixar um feedback honesto de resgate!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
