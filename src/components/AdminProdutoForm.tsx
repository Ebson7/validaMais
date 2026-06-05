/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Produto } from '../types';
import { Check, ArrowLeft, Image as ImageIcon, Send, Percent, Tag, ShieldAlert, Trash2, Camera, UploadCloud, Info, Sparkles } from 'lucide-react';

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
  const { user, categorias, navigateTo } = useApp();

  const [nomeProduto, setNomeProduto] = useState('');
  const [categoria, setCategoria] = useState(() => {
    if (initialProduto && initialProduto.categoria) {
      return initialProduto.categoria;
    }
    return 'Laticínios';
  });
  const [descricao, setDescricao] = useState('');
  const [precoOriginal, setPrecoOriginal] = useState<number | ''>('');
  const [precoPromocional, setPrecoPromocional] = useState<number | ''>('');
  const [dataValidade, setDataValidade] = useState('');
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState<number | ''>('');
  const [endereco, setEndereco] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagens, setImagens] = useState<string[]>(['', '', '']);
  const [submitting, setSubmitting] = useState(false);

  // CEP Search State inside Admin form
  const [cepInput, setCepInput] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  const handleCepChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5, 8)}`;
    }
    setCepInput(formatted);

    if (cleaned.length === 8) {
      // Check cache first to avoid slow HTTP requests
      try {
        const raw = sessionStorage.getItem('validamais_cep_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed[cleaned] && parsed[cleaned].address) {
            setEndereco(parsed[cleaned].address);
            return;
          }
        }
      } catch (e) {}

      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await response.json();
        if (data.erro) {
          alert('CEP não encontrado. Por favor, digite manualmente.');
        } else {
          const street = data.logradouro ? `${data.logradouro}` : '';
          const neighborhood = data.bairro ? ` - ${data.bairro}` : '';
          const cityState = `, ${data.localidade}/${data.uf}`;
          const fullAddress = `${street}${neighborhood}${cityState}`;
          setEndereco(fullAddress);

          // Save to cache
          try {
            const raw = sessionStorage.getItem('validamais_cep_cache') || '{}';
            const parsed = JSON.parse(raw);
            parsed[cleaned] = { region: data.bairro || data.localidade || '', address: fullAddress };
            sessionStorage.setItem('validamais_cep_cache', JSON.stringify(parsed));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Erro ao conectar ao ViaCEP:', err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

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
      if (initialProduto.imagens && initialProduto.imagens.length > 0) {
        const loaded = [...initialProduto.imagens];
        while (loaded.length < 3) loaded.push('');
        setImagens(loaded.slice(0, 3));
      } else if (initialProduto.imageUrl) {
        setImagens([initialProduto.imageUrl, '', '']);
      } else {
        setImagens(['', '', '']);
      }
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
    setImagens(prev => {
      const copy = [...prev];
      copy[0] = url; // front photo slot
      return copy;
    });
  };

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validExtensions.includes(file.type)) {
        alert('Formato inválido! Envie apenas imagens PNG, JPG, JPEG ou WEBP.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem é muito pesada! Escolha um arquivo de no máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setImagens(prev => {
              const copy = [...prev];
              copy[index] = event.target?.result as string;
              return copy;
            });
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
          setImagens(prev => {
            const copy = [...prev];
            copy[index] = compressedBase64;
            return copy;
          });
        };
        img.onerror = () => alert('Erro estruturando imagem.');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar a imagem.');
    }
  };

  const clearSlot = (index: number) => {
    setImagens(prev => {
      const copy = [...prev];
      copy[index] = '';
      return copy;
    });
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

    const cleanImagens = imagens.filter(img => img !== '');
    const firstImage = cleanImagens[0] || imageUrl.trim() || undefined;

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
        imageUrl: firstImage,
        imagens: cleanImagens.length > 0 ? cleanImagens : (imageUrl.trim() ? [imageUrl.trim()] : [])
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-500 font-mono uppercase">Categoria</label>
                <button
                  type="button"
                  onClick={() => navigateTo('admin-categorias')}
                  className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold font-mono uppercase cursor-pointer transition-colors"
                >
                  + Gerenciar
                </button>
              </div>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full text-sm px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
              >
                {categorias.map((cat) => (
                  <option key={cat.id || cat.nome} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))}
                {categorias.length === 0 && (
                  <>
                    <option value="Laticínios">Laticínios</option>
                    <option value="Padaria">Padaria</option>
                    <option value="Hortifrúti">Hortifrúti</option>
                    <option value="Carnes">Carnes</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Mercearia">Mercearia</option>
                  </>
                )}
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

          {/* Physical Address of store with CEP search helper */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Buscar por CEP</label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={9}
                  placeholder="01000-000"
                  value={cepInput}
                  onChange={(e) => handleCepChange(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold"
                />
                {loadingCep && (
                  <span className="absolute right-3 top-3 text-xs text-emerald-600 animate-pulse font-mono font-extrabold">...</span>
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Endereço de Retirada Física</label>
              <input
                type="text"
                required
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo / SP"
                className="w-full text-sm px-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:border-emerald-500 focus:bg-white/75 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-semibold text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Visual assets (Multi-photo system and guide instructions) */}
        <div className="space-y-4">
          
          {/* Photos Positioning Standards Guideline Card */}
          <div className="bg-amber-50/60 border border-amber-200/50 rounded-2xl p-4 text-left">
            <h4 className="text-xs font-bold text-amber-900 font-mono uppercase mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              Padrão Fotográfico Recomendado
            </h4>
            <p className="text-[11px] text-amber-800 leading-normal mb-3">
              Para o catálogo seguir um padrão visual atraente, recomendamos subir até 3 fotos conforme abaixo:
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-1.5 text-amber-900">
                <span className="font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md leading-none mt-0.5">FRENTE</span>
                <span className="leading-tight">A primeira foto <strong>deve ser de frente</strong>, apresentando o rótulo principal e identificação da marca.</span>
              </div>
              <div className="flex items-start gap-1.5 text-amber-900">
                <span className="font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md leading-none mt-0.5">DIREITO</span>
                <span className="leading-tight">A segunda foto mostra a <strong>lateral direita</strong>, ideal para código de barras, peso líquido ou avisos.</span>
              </div>
              <div className="flex items-start gap-1.5 text-amber-900">
                <span className="font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md leading-none mt-0.5">ESQUERDO</span>
                <span className="leading-tight">A terceira foto exibe a <strong>lateral esquerda</strong> (ou traseira), provando a data e o lote do produto.</span>
              </div>
            </div>
          </div>

          {/* Interactive slots container */}
          <div>
            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-2">Fotos do Lote (Até 3 fotos / PNG, JPG, WEBP / Comprimido)</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Frente', detail: 'Frente' },
                { label: 'Direito', detail: 'Lado Dir.' },
                { label: 'Esquerdo', detail: 'Lado Esq.' }
              ].map((slot, idx) => (
                <div key={idx} className="flex flex-col gap-1 text-center">
                  <div className="relative aspect-square rounded-xl border-2 border-dashed border-gray-205 border-gray-300 hover:border-emerald-500 bg-white/30 hover:bg-emerald-50/10 transition-all flex flex-col justify-center items-center overflow-hidden group">
                    {imagens[idx] ? (
                      <>
                        <img src={imagens[idx]} alt={`Slot ${slot.label}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center gap-1.5 p-1">
                          <button
                            type="button"
                            onClick={() => clearSlot(idx)}
                            className="p-1 rounded-lg bg-red-650 bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer"
                            title="Remover foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <label className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer">
                            <Camera className="w-3.5 h-3.5" />
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg,.webp"
                              onChange={(e) => handleFileChange(idx, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col justify-center items-center p-2 cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500">
                        <Camera className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-emerald-600 transition-colors mt-1 leading-none">{slot.label}</span>
                        <span className="text-[7.5px] font-mono text-gray-300 mt-1 uppercase">Subir</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp"
                          onChange={(e) => handleFileChange(idx, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 font-mono uppercase">{slot.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Predefined presets helper */}
          <div className="bg-white/30 backdrop-blur-xs rounded-2xl p-4 border border-white/40 text-left">
            <h4 className="text-xs font-bold text-gray-600 font-mono uppercase mb-3 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets de Imagem (Carrega Frente)
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {IMAGE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset.url)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 text-left cursor-pointer transition-all ${
                    imagens[0] === preset.url ? 'border-emerald-500 scale-95' : 'border-transparent opacity-85 hover:opacity-100 hover:scale-98'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 p-1.5 flex items-end">
                    <span className="text-[9px] font-bold text-white tracking-tight line-clamp-1 leading-none">{preset.name}</span>
                  </div>
                  {imagens[0] === preset.url && (
                    <div className="absolute top-1 right-1 bg-emerald-505 bg-emerald-500 text-white p-0.5 rounded-full shadow-xs">
                      <Check className="w-2.5 h-2.5 font-bold" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <label className="block text-[10px] font-bold text-gray-400 font-mono uppercase mb-1">Ou edite o Link da Primeira Foto (URL)</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={imagens[0] || imageUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setImageUrl(val);
                  setImagens(prev => {
                    const copy = [...prev];
                    copy[0] = val;
                    return copy;
                  });
                }}
                placeholder="Insira URL https://..."
                className="w-full text-xs ps-8 pe-3 py-2 bg-white/40 border border-white/50 rounded-lg focus:border-emerald-500 focus:bg-white/75 focus:outline-none transition-all"
              />
            </div>
          </div>
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
