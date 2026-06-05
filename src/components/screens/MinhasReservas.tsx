/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { ReservaCard } from '../ReservaCard';
import { Loader2, Calendar, ShoppingCart, HelpCircle } from 'lucide-react';

export const MinhasReservasValida: React.FC = () => {
  const { user, navigateTo, showAlert, reservas: allReservas, reservasLoading: loading, cancelReservation } = useApp();

  const reservas = allReservas.filter(r => r.usuarioId === user?.uid);

  // Handle cancellation atomically returning items directly to merchant's product catalog
  const handleCancelReserva = async (reservaId: string, newStatus: 'retirado' | 'cancelado') => {
    if (newStatus !== 'cancelado') return;

    try {
      await cancelReservation(reservaId);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div id="minhas_reservas_screen" className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-gray-905 text-gray-900 leading-tight">Suas Reservas</h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">Acompanhe seus lotes, apresente seu e-mail no balcão e retire na loja física</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-gray-500 font-mono">Resgatando histórico...</span>
        </div>
      ) : reservas.length > 0 ? (
        <div className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 gap-4">
            {reservas.map((res) => (
              <ReservaCard
                key={res.id}
                reserva={res}
                isAdminView={false}
                onStatusUpdate={handleCancelReserva}
              />
            ))}
          </div>

          <div className="glass border-white/40 rounded-2xl p-4 bg-white/40 flex gap-3 text-xs leading-relaxed text-slate-700">
            <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase font-mono tracking-wide mb-0.5 text-slate-800">Como Funciona a Retirada?</p>
              <p>Compareça ao estabelecimento indicado trazendo o endereço, informe seu nome/e-mail no balcão de checkout. O pagamento do produto promocional com desconto ocorre diretamente na boca do caixa físico durante o processo de retirada ordinária.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl border-white/50 py-16 text-center max-w-lg mx-auto p-6 space-y-3">
          <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center text-gray-400 mx-auto border border-white/50">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-gray-800">Você ainda não tem reservas</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Seu carrinho está livre do desperdício por enquanto. Navegue por nossa vitrine virtual para encontrar os menores preços e salvar os seus produtos preferidos.
          </p>
          <button
            onClick={() => navigateTo('produtos')}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 font-mono uppercase tracking-wider cursor-pointer mt-4"
          >
            Quero Economizar Agora &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
