/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Produto } from '../types';
import { Check, ArrowLeft, Image as ImageIcon, Send, Percent, Tag, ShieldAlert } from 'lucide-react';

interface AdminProdutoFormProps {
  produtoId?: string | null;
  initialProduto?: Produto | null;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  'Laticínios',
  'Padaria',
  'Hortifrúti',
  'Carnes',
  'Bebidas',
  'Mercearia'
];

interface PresetImage {
  name: string;
  category: string;
  url: string;
}

const IMAGE_PRESETS: PresetImage[] = [
  { name: 'Leite Integral', category: 'Laticínios', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=60&w=400' },
  { name: 'Iogurte Natural', category: 'Laticínios', url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=60&w=400' },
  { name: 'Queijo Prato', category: 'Laticínios', url: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&q=60&w=400' },
  { name: 'Pão Italiano', category: 'Padaria', url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=60&w=400' },
  { name: 'Bolo de Chocolate', category: 'Padaria', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=60&w=400' },
  { name: 'Frutas Mistas', category: 'Hortifrúti', url: 'https://images.unsplash.com/photo-1610450915206-337c76a540b1?auto=format&fit=crop&q=60&w=400' },
  { name: 'Alface Fresca', category: 'Hortifrúti', url: 'https://images.unsplash.com/photo-1622484211148-716598e04143?auto=format&fit=crop&q=60&w=400' },
  { name: 'Carne Moída Prime', category: 'Carnes', url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=60&w=400' },
  { name: 'Frango Inteiro', category: 'Carnes', url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=60&w=400' },
  { name: 'Cerveja Artesanal', category: 'Bebidas', url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=60&w=400' },
  { name: 'Suco de Laranja 1L', category: 'Bebidas', url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=60&w=400' },
  { name: 'Chocolate Barra', category: 'Mercearia', url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=60&w=400' },
  { name: 'Macarrão Espaguete', category: 'Mercearia', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=60&w=400' }
];

export const AdminProdutoForm: React.FC<AdminProdutoFormProps> = ({
  produtoId,
  initialProduto,
  onSubmit,
  onCancel
}) => {
  const { user } = useApp();

  const [nomeProduto, setNomeProduto] = useState('');
  const [categoria, setCategoria] = useState('Laticínios');
  const [descricao, setDescricao] = useState('');
  const [precoOriginal, setPrecoOriginal] = useState<number | ''>('');
  const [precoPromocional, setPrecoPromocional] = useState<number | ''>('');
  const [dataValidade, setDataValidade] = useState('');
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState<number | ''>('');
  const [endereco, setEndereco] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Hydrate fields on edit
  useEffect(() => {
    if (initialProduto && produtoId) {
      setNomeProduto(initialProduto.nomeProduto);
      setCategoria(initialProduto.categoria);
      setDescricao(initialProduto.descricao || '');
      setPrecoOriginal(initialProduto.precoOriginal);
      setPrecoPromocional(initialProduto.precoPromocional);
      setDataValidade(initialProduto.dataValidade);
      setQuantidadeDisponivel(initialProduto.quantidadeDisponivel);
      setEndereco(initialProduto.endereco);
      setNomeLoja(initialProduto.nomeLoja);
      setImageUrl(initialProduto.imageUrl || '');
    } else {
      // Set sensible default values for creation
      setNomeLoja(user?.nome || '');
      setEndereco('Av. Paulista, 1000 - Bela Vista, São Paulo/SP');
      // Set expiration to 5 days from now automatically as a starting baseline
      const future = new Date();
      future.setDate(future.getDate() + 5);
      setDataValidade(future.toISOString().split('T')[0]);
    }
  }, [initialProduto, produtoId, user]);

  const handlePresetSelect = (url: string) => {
    setImageUrl(url);
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeProduto || !categoria || !precoOriginal || !precoPromocional || !dataValidade || !quantidadeDisponivel || !endereco) {
      alert('Favor preencher todos os campos obrigatórios.');
      return;
    }

    if (Number(precoPromocional) >= Number(precoOriginal)) {
      alert('O preço promocional de liquidação deve ser menor que o preço original do produto.');
      return;
    }

    if (Number(precoOriginal) <= 0 || Number(precoPromocional) < 0) {
      alert('Os valores de preço devem ser positivos.');
      return;
    }

    if (Number(quantidadeDisponivel) <= 0) {
      alert('A quantidade disponível deve ser pelo menos 1 unidade.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        nomeProduto,
        categoria,
        descricao,
        precoOriginal: Number(precoOriginal),
        precoPromocional: Number(precoPromocional),
        dataValidade,
        quantidadeDisponivel: Number(quantidadeDisponivel),
        endereco,
        nomeLoja: nomeLoja || user?.nome || 'Mercado Geral',
        imageUrl: imageUrl.trim() || undefined
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const discountVal = (precoOriginal && precoPromocional) 
    ? Math.round(((Number(precoOriginal) - Number(precoPromocional)) / Number(precoOriginal)) * 100) 
    : 0;

  return (
    <form id="admin_produto_form" onSubmit={handleLocalSubmit} className="space-y-6">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              {produtoId ? 'Editar Produto' : 'Cadastrar Novo Lote'}
            </h2>
            <p className="text-xs text-gray-500 font-medium">Preencha as informações do produto próximo da validade</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core details column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Nome do Estabelecimento</label>
              <input
                type="text"
                required
                value={nomeLoja}
                onChange={(e) => setNomeLoja(e.target.value)}
                placeholder="Ex: Mercadinho Vila das Flores"
                className="w-full text-sm px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
              />
            </div>

            {/* Product Category dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full text-sm px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Name input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Nome do Produto</label>
            <input
              id="form_input_p_nome"
              type="text"
              required
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder="Ex: Leite Integral Longevita 1 Litro"
              className="w-full text-sm px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
            />
          </div>

          {/* Description input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Motivo do Desconto & Detalhes (Opcional)</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Embalagem externa levemente amassada, lote perfeitamente íntegro e conservador. Ótima oportunidade."
              rows={3}
              className="w-full text-sm px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Preço Original */}
            <div>
              <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Preço Original (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-gray-405 font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="6.90"
                  value={precoOriginal}
                  onChange={(e) => setPrecoOriginal(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full text-sm ps-9 pe-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold"
                />
              </div>
            </div>

            {/* Preço Promocional */}
            <div>
              <label className="block text-xs font-bold text-emerald-800 font-mono uppercase mb-1 flex items-center gap-0.5">
                Preço ValidaMais (R$)
                <Percent className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-emerald-600 font-extrabold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="3.50"
                  value={precoPromocional}
                  onChange={(e) => setPrecoPromocional(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full text-sm ps-9 pe-4 py-2.5 bg-emerald-50/20 border border-emerald-300 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold text-emerald-850"
                />
              </div>
            </div>

            {/* Calculated Discount visualization */}
            <div className="bg-emerald-50/30 border border-emerald-200/50 backdrop-blur-xs rounded-xl p-2.5 flex flex-col justify-center items-center">
              <span className="text-[10px] font-bold text-emerald-700 font-mono uppercase">Desconto Oferecido</span>
              <span className="text-xl font-black text-rose-600 font-mono">
                {discountVal > 0 ? `${discountVal}% OFF` : '0%'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expiry Date input */}
            <div>
              <label className="block text-xs font-bold text-amber-800 font-mono uppercase mb-1 flex items-center gap-1">
                Data de Validade MÁXIMA
                <Tag className="w-3 h-3 text-amber-500" />
              </label>
              <input
                type="date"
                required
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                className="w-full text-sm px-4 py-2.5 border border-amber-300 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold text-amber-900 bg-amber-50/20"
              />
            </div>

            {/* Total Quantity */}
            <div>
              <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Quantidade do Lote (Unidades)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="10"
                value={quantidadeDisponivel}
                onChange={(e) => setQuantidadeDisponivel(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="w-full text-sm px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-semibold"
              />
            </div>
          </div>

          {/* Physical Address of store */}
          <div>
            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Endereço de Retirada Física</label>
            <input
              type="text"
              required
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo / SP"
              className="w-full text-sm px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-505 transition-all"
            />
          </div>
        </div>

        {/* Visual asset/image and presets column */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Link da Imagem ou Preset</label>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Insira URL https://... ou use um preset abaixo"
                className="w-full text-sm ps-10 pe-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Preset Picker list */}
          <div className="bg-white/30 backdrop-blur-xs rounded-2xl p-4 border border-white/40">
            <h4 className="text-xs font-bold text-gray-600 font-mono uppercase mb-3 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Predefinições Rápidas de Imagem
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {IMAGE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset.url)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 text-left cursor-pointer transition-all ${
                    imageUrl === preset.url ? 'border-emerald-500 scale-95 ring-2 ring-emerald-500/20' : 'border-transparent opacity-85 hover:opacity-100 hover:scale-98'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 p-1.5 flex items-end">
                    <span className="text-[9px] font-bold text-white tracking-tight line-clamp-1 leading-none">{preset.name}</span>
                  </div>
                  {imageUrl === preset.url && (
                    <div className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-xs">
                      <Check className="w-2.5 h-2.5 font-bold" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time image preview */}
          {imageUrl && (
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs relative">
              <span className="absolute top-2 right-2 bg-black/55 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-lg">PRÉVIA</span>
              <img src={imageUrl} alt="Preview" className="w-full aspect-video object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Trigger Buttons */}
      <div className="border-t border-gray-150 border-gray-100 pt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-5 py-2.5 border border-gray-200 text-sm font-semibold rounded-xl text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 transition-all font-semibold font-sans text-sm text-white rounded-xl shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          {submitting ? (
            'Enviando...'
          ) : (
            <>
              <Send className="w-4 h-4 text-emerald-100" />
              {produtoId ? 'Salvar Alterações' : 'Disponibilizar no Catálogo'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
