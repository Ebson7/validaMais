/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { ReservaCard } from '../ReservaCard';
import { Loader2, ClipboardList, Info } from 'lucide-react';

export const AdminReservasValida: React.FC = () => {
  const { showAlert, reservas, reservasLoading: loading, updateReservationStatus, cancelReservation } = useApp();

  // Admin changing status: either confirming physical collection (withdraw) or canceling a voided booking
  const handleAdminStatusUpdate = async (reservaId: string, newStatus: 'retirado' | 'cancelado') => {
    try {
      if (newStatus === 'cancelado') {
        await cancelReservation(reservaId);
      } else {
        await updateReservationStatus(reservaId, newStatus);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div id="admin_reservas_panel" className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight">Reservas Solicitadas</h1>
        <p className="text-sm text-gray-500 font-semibold mt-1">Veja a listagem de reservas feitas por clientes, confira o email de retirada e dê as baixas pertinentes</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-sm font-semibold text-gray-500 font-mono">Buscando chamados...</span>
        </div>
      ) : reservas.length > 0 ? (
        <div className="space-y-4 max-w-4xl">
          <div className="glass border-white/40 rounded-2xl p-4 bg-white/40 flex gap-3 text-xs leading-relaxed text-slate-700">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase font-mono tracking-wide mb-0.5 text-slate-800">Dica de Atendimento ao Cliente:</p>
              <p>Confirme a identidade do cliente comparando o e-mail ou o nome fornecido no momento do atendimento presencial. Uma vez que o cliente realizar o pagamento físico no caixa tradicional do mercado, clique em <strong>"Confirmar Retirada"</strong> para dar baixa oficial do saldo correspondente.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reservas.map((res) => (
              <ReservaCard
                key={res.id}
                reserva={res}
                isAdminView={true}
                onStatusUpdate={handleAdminStatusUpdate}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl border-white/50 py-16 text-center max-w-lg mx-auto p-6 space-y-3">
          <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center text-gray-400 mx-auto border border-white/50">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-gray-800">Nenhuma reserva recebida</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Assim que os consumidores começarem a reservar seus lotes promocionais de produtos perecíveis no catálogo público, as solicitações aparecerão consolidadas nesta fila.
          </p>
        </div>
      )}
    </div>
  );
};
