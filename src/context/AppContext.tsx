/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { doc, getDoc, onSnapshot, collection, getDocs, deleteDoc, addDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, messaging } from '../lib/firebase';
import { createOrUpdateUserDocument, getUserProfile, loginSimulatedUser } from '../lib/auth';
import { Usuario, UserRole, Produto, Reserva, Categoria, AvaliacaoLoja, NotificacaoPreferencias, NotificacaoFeedItem } from '../types';
import { 
  getProducts, 
  getStoreProducts, 
  getProductById, 
  saveProduct as dbSaveProduct, 
  deleteProduct as dbDeleteProduct, 
  getReservations as dbGetReservations, 
  createReservation as dbCreateReservation, 
  cancelReservation as dbCancelReservation, 
  updateReservationStatus as dbUpdateReservationStatus,
  seedDefaultProducts
} from '../lib/db-wrapper';

export type ScreenType = 
  | 'home' 
  | 'produtos' 
  | 'produto-detalhe' 
  | 'login' 
  | 'cadastro' 
  | 'minhas-reservas' 
  | 'admin-dashboard' 
  | 'admin-produtos' 
  | 'admin-produtos-novo' 
  | 'admin-produtos-editar'
  | 'admin-reservas'
  | 'admin-categorias';

interface Alert {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  user: Usuario | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  currentScreen: ScreenType;
  selectedProductId: string | null;
  alert: Alert | null;
  produtos: Produto[];
  reservas: Reserva[];
  categorias: Categoria[];
  produtosLoading: boolean;
  reservasLoading: boolean;
  setAlert: (alert: Alert | null) => void;
  showAlert: (message: string, type: Alert['type']) => void;
  navigateTo: (screen: ScreenType, productId?: string | null) => void;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logoutUser: () => Promise<void>;
  saveProduct: (formData: any, productId: string | null) => Promise<Produto>;
  deleteProduct: (id: string) => Promise<void>;
  createReservation: (produtoId: string, quantidade: number) => Promise<Reserva>;
  cancelReservation: (reservaId: string) => Promise<void>;
  updateReservationStatus: (reservaId: string, status: 'retirado' | 'cancelado') => Promise<void>;
  addCategory: (nome: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  avaliacoes: AvaliacaoLoja[];
  addAvaliacaoLoja: (reservaId: string, nomeLoja: string, estrelas: number, comentario: string) => Promise<void>;
  seedProducts: () => Promise<void>;
  clearAllDatabaseUsers: () => Promise<void>;
  notificacoes: NotificacaoFeedItem[];
  notificacoesPreferencias: NotificacaoPreferencias | null;
  notificationsPermission: NotificationPermission;
  isFCMSupported: boolean;
  requestNotificationPermissionAndToken: (customVapidKey?: string) => Promise<string | null>;
  updateNotificacaoPreferencias: (ceps: string[], notificarNovosDescontos: boolean) => Promise<void>;
  marcarNotificacaoComoLida: (id: string) => Promise<void>;
  apagarNotificacao: (id: string) => Promise<void>;
  testSendNotificationPreview: (produto: Produto) => Promise<void>;
}

const DEFAULT_USERS: Usuario[] = [
  {
    uid: 'mock_userId_cliente1',
    email: 'cliente@validamais.com',
    nome: 'Maria Consumidora',
    role: 'user',
    criadoEm: new Date().toISOString()
  },
  {
    uid: 'mock_userId_admin1',
    email: 'admin@validamais.com',
    nome: 'João Lojista (Administrador)',
    role: 'admin',
    criadoEm: new Date().toISOString()
  }
];

const DEFAULT_CATEGORIES: Categoria[] = [
  { id: 'cat_laticinios', nome: 'Laticínios' },
  { id: 'cat_padaria', nome: 'Padaria' },
  { id: 'cat_hortifruti', nome: 'Hortifrúti' },
  { id: 'cat_carnes', nome: 'Carnes' },
  { id: 'cat_bebidas', nome: 'Bebidas' },
  { id: 'cat_mercearia', nome: 'Mercearia' }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<Usuario | null>(() => {
    // Synchronous immediate check for offline/dev speed
    const saved = localStorage.getItem('validamais_currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(() => {
    const saved = localStorage.getItem('validamais_currentUser');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.uid) {
          return false; // Instant load if user session already exists in cache
        }
      } catch (e) {}
    }
    return true;
  });
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [alert, setAlertState] = useState<Alert | null>(null);

  const [produtos, setProdutos] = useState<Produto[]>(() => {
    const saved = localStorage.getItem('validamais_produtos');
    return saved ? JSON.parse(saved) : [];
  });
  const [reservas, setReservas] = useState<Reserva[]>(() => {
    const saved = localStorage.getItem('validamais_reservas');
    return saved ? JSON.parse(saved) : [];
  });
  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    const saved = localStorage.getItem('validamais_categorias');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoLoja[]>(() => {
    const saved = localStorage.getItem('validamais_avaliacoes');
    return saved ? JSON.parse(saved) : [];
  });

  const [notificacoes, setNotificacoes] = useState<NotificacaoFeedItem[]>([]);
  const [notificacoesPreferencias, setNotificacoesPreferencias] = useState<NotificacaoPreferencias | null>(null);
  const [notificationsPermission, setNotificationsPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const [produtosLoading, setProdutosLoading] = useState(() => {
    const saved = localStorage.getItem('validamais_produtos');
    return !saved; // Only show spinner if cache is empty
  });
  const [reservasLoading, setReservasLoading] = useState(() => {
    const saved = localStorage.getItem('validamais_reservas');
    return !saved; // Only show spinner if cache is empty
  });

  // Real-time synchronization for 'produtos'
  useEffect(() => {
    const colRef = collection(db, 'produtos');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const results: Produto[] = [];
        snapshot.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...docSnap.data() } as Produto);
        });
        setProdutos(results);
        localStorage.setItem('validamais_produtos', JSON.stringify(results));
        setProdutosLoading(false);
      },
      (error) => {
        console.warn("Real-time snapshot products subscription failed: ", error);
        setProdutosLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Real-time synchronization for 'reservas'
  useEffect(() => {
    const colRef = collection(db, 'reservas');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const results: Reserva[] = [];
        snapshot.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...docSnap.data() } as Reserva);
        });
        setReservas(results);
        localStorage.setItem('validamais_reservas', JSON.stringify(results));
        setReservasLoading(false);
      },
      (error) => {
        console.warn("Real-time snapshot reservations subscription failed: ", error);
        setReservasLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Real-time synchronization for 'categorias'
  useEffect(() => {
    const colRef = collection(db, 'categorias');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const results: Categoria[] = [];
        snapshot.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...docSnap.data() } as Categoria);
        });
        if (results.length > 0) {
          setCategorias(results);
          localStorage.setItem('validamais_categorias', JSON.stringify(results));
        } else {
          // If Firestore collection 'categorias' is empty, seed it on demand asynchronously
          const seedCategoriesAsync = async () => {
            const hasSeeded = localStorage.getItem('validamais_categorias_seeded');
            if (!hasSeeded) {
              console.log("Firestore 'categorias' collection is empty. Auto-seeding DEFAULT_CATEGORIES...");
              try {
                const batchSeeds = DEFAULT_CATEGORIES.map(async (cat) => {
                  const docRef = await addDoc(collection(db, 'categorias'), {
                    nome: cat.nome,
                    criadoEm: new Date().toISOString()
                  });
                  return { id: docRef.id, nome: cat.nome, criadoEm: new Date().toISOString() };
                });
                await Promise.all(batchSeeds);
                localStorage.setItem('validamais_categorias_seeded', 'true');
              } catch (e) {
                console.warn("Failed automatic categories seeding in background:", e);
              }
            }
          };
          seedCategoriesAsync();
        }
      },
      (error) => {
        console.warn("Real-time snapshot categories subscription failed: ", error);
      }
    );
    return unsubscribe;
  }, []);

  // Real-time synchronization for 'avaliacoes'
  useEffect(() => {
    const colRef = collection(db, 'avaliacoes');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const results: AvaliacaoLoja[] = [];
        snapshot.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...docSnap.data() } as AvaliacaoLoja);
        });
        setAvaliacoes(results);
        localStorage.setItem('validamais_avaliacoes', JSON.stringify(results));
      },
      (error) => {
        console.warn("Real-time snapshot reviews subscription failed: ", error);
      }
    );
    return unsubscribe;
  }, []);

  // Real-time synchronization for 'notificacoes_preferencias'
  useEffect(() => {
    if (!user) {
      setNotificacoesPreferencias(null);
      return;
    }
    const docRef = doc(db, 'notificacoes_preferencias', user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setNotificacoesPreferencias(docSnap.data() as NotificacaoPreferencias);
        } else {
          // Initialize default empty preferences
          const initial: NotificacaoPreferencias = {
            uid: user.uid,
            cepsDesejados: [],
            distanciaKm: 5,
            notificarNovosDescontos: true,
            fcmTokens: []
          };
          setDoc(docRef, initial).catch((e) => console.warn("Failed to initialize user push preferences:", e));
          setNotificacoesPreferencias(initial);
        }
      },
      (error) => {
        console.warn("Sync preferences failed:", error);
      }
    );
    return unsubscribe;
  }, [user]);

  // Real-time synchronization for 'notificacoes' (user-specific feed)
  useEffect(() => {
    if (!user) {
      setNotificacoes([]);
      return;
    }
    const colRef = collection(db, 'notificacoes');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const results: NotificacaoFeedItem[] = [];
        snapshot.forEach((docSnap) => {
          const item = { id: docSnap.id, ...docSnap.data() } as NotificacaoFeedItem;
          if (item.usuarioId === user.uid) {
            results.push(item);
          }
        });
        
        // Sort notifications by date (newest first)
        results.sort((a,b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
        
        // Detect additions of unread notifications to trigger visual & physical feedback (sounds & alerts)
        setNotificacoes((prev) => {
          const prevIds = new Set(prev.map(p => p.id));
          const newUnreadItems = results.filter(r => !r.lido && !prevIds.has(r.id));
          
          if (newUnreadItems.length > 0) {
            newUnreadItems.forEach(item => {
              // Standard Browser Push Notification (if permitted)
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(item.titulo, {
                    body: item.mensagem,
                    icon: '/logo.png',
                    tag: item.id
                  });
                } catch (e) {
                  console.warn("Browser notification trigger skipped due to iframe constraints:", e);
                }
              }
              // Advanced Synthesized Digital Sound Alert (Digital chime that works perfectly inside standard frames!)
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                if (audioCtx.state === 'suspended') {
                  // Some browsers suspend audio until user interaction
                  const resumeAudio = () => {
                    audioCtx.resume();
                    window.removeEventListener('click', resumeAudio);
                  };
                  window.addEventListener('click', resumeAudio);
                }
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'sine';
                // Success sound progression (D5 -> A5)
                oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.12); // A5
                gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.45);
              } catch (soundError) {
                console.log("Audio synthesis skipper: ", soundError);
              }
            });
          }
          return results;
        });
      },
      (error) => {
        console.warn("Real-time snapshot notifications subscription failed: ", error);
      }
    );
    return unsubscribe;
  }, [user]);

  // Monitor newly added discounted products in real time and automatically deliver a notification matching preferences
  useEffect(() => {
    const colRef = collection(db, 'produtos');
    let isInitialBatch = true;
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      if (isInitialBatch) {
        isInitialBatch = false;
        return; // ignore initial loading items
      }
      
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const newProd = { id: change.doc.id, ...change.doc.data() } as Produto;
          const isDiscounted = newProd.precoPromocional < newProd.precoOriginal;
          
          if (isDiscounted && newProd.status === 'disponivel') {
            const prodId = change.doc.id;
            
            // Deliver notification to logged-in customer matching preferences
            if (user && user.role === 'user') {
              const prefs = notificacoesPreferencias;
              if (prefs && prefs.notificarNovosDescontos) {
                // If they have CEP search filters, check if address CEP overlaps, or matches store names
                const matchesCep = prefs.cepsDesejados.length === 0 || prefs.cepsDesejados.some(cep => {
                  const cleanPref = cep.replace(/\D/g, '').substring(0, 5);
                  const cleanProd = (newProd.endereco || '').replace(/\D/g, '');
                  return (cleanProd && cleanProd.includes(cleanPref)) || 
                    (newProd.nomeLoja || '').toLowerCase().includes(cep.toLowerCase()) ||
                    (newProd.endereco || '').toLowerCase().includes(cep.toLowerCase());
                });
                
                if (matchesCep) {
                  // Avoid duplicating notifications for the same product
                  const exists = notificacoes.some(n => n.produtoId === prodId);
                  if (!exists) {
                    const discountPct = Math.round(((newProd.precoOriginal - newProd.precoPromocional) / newProd.precoOriginal) * 100);
                    try {
                      await addDoc(collection(db, 'notificacoes'), {
                        usuarioId: user.uid,
                        titulo: `🚨 Novo Desconto Próximo: ${newProd.nomeProduto}!`,
                        mensagem: `${newProd.nomeLoja} adicionou um item com ${discountPct}% OFF! De R$ ${newProd.precoOriginal.toFixed(2)} por R$ ${newProd.precoPromocional.toFixed(2)}. Corra para reservar!`,
                        produtoId: prodId,
                        nomeLoja: newProd.nomeLoja,
                        precoOriginal: newProd.precoOriginal,
                        precoPromocional: newProd.precoPromocional,
                        lido: false,
                        criadoEm: new Date().toISOString()
                      });
                    } catch (e) {
                      console.warn("Auto-creation of notification failed: ", e);
                    }
                  }
                }
              }
            }
          }
        }
      });
    });
    
    return unsubscribe;
  }, [user, notificacoesPreferencias, notificacoes]);

  // Seed default demo accounts to local storage and Firestore on first load
  useEffect(() => {
    const existing = localStorage.getItem('validamais_usuarios');
    if (!existing) {
      localStorage.setItem('validamais_usuarios', JSON.stringify(DEFAULT_USERS));
    }

    const seedMockUsersInFirestore = async () => {
      // Performance guard: Check if already seeded once on this client
      const alreadySeeded = localStorage.getItem('validamais_mock_seeded');
      if (alreadySeeded === 'true') return;

      try {
        for (const u of DEFAULT_USERS) {
          const simulatedUid = 'sim_' + u.email.replace(/[^a-zA-Z0-9]/g, '_');
          const existsProfile = await getUserProfile(simulatedUid);
          if (!existsProfile) {
            await createOrUpdateUserDocument(simulatedUid, u.email, u.nome, u.role, '123456');
          }
        }
        localStorage.setItem('validamais_mock_seeded', 'true');
      } catch (err) {
        console.warn("Firestore user seeding skipped or failed:", err);
      }
    };

    seedMockUsersInFirestore();
  }, []);

  // Custom alert timer
  const setAlert = (newAlert: Alert | null) => {
    setAlertState(newAlert);
  };

  const showAlert = (message: string, type: Alert['type']) => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlertState(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // Screen routing agent
  const navigateTo = (screen: ScreenType, productId: string | null = null) => {
    // Guards
    if (screen === 'minhas-reservas' && !user) {
      showAlert('Você precisa fazer login para visualizar suas reservas.', 'warning');
      setCurrentScreen('login');
      return;
    }

    if (screen.startsWith('admin') && (!user || user.role !== 'admin')) {
      showAlert('Acesso restrito para administradores.', 'error');
      setCurrentScreen('home');
      return;
    }

    setSelectedProductId(productId);
    setCurrentScreen(screen);
    setAlert(null); // Clear any floating alerts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Authenticated state listener with safe loader fallback
  useEffect(() => {
    // 1. Core listener on Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          if (profile) {
            setUser(profile);
            localStorage.setItem('validamais_currentUser', JSON.stringify(profile));
          } else {
            // Self-repair case if authenticated but Firestore document was skipped
            const fallbackProfile = await createOrUpdateUserDocument(
              fbUser.uid,
              fbUser.email || '',
              fbUser.displayName || 'Usuário',
              'user'
            );
            setUser(fallbackProfile);
            localStorage.setItem('validamais_currentUser', JSON.stringify(fallbackProfile));
          }
        } catch (error) {
          console.warn("Could not load user profile from Firestore, keeping local session if any.", error);
        }
      } else {
        // If google firebase logs out, we only log out locally if we were not in a robust offline-session (supports mock_ and sim_ tokens)
        const localSession = localStorage.getItem('validamais_currentUser');
        if (localSession) {
          try {
            const parsed = JSON.parse(localSession);
            const isMockOrSimulated = parsed.uid && (parsed.uid.startsWith('mock_') || parsed.uid.startsWith('sim_'));
            if (!isMockOrSimulated) {
              setUser(null);
            }
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    // 2. Guaranteed Boot Fallback: sets loading to false anyway after 300ms (optimized for snappy boot)
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Login handler
  const loginUser = async (email: string, password: string) => {
    setLoading(true);
    const emailLower = email.trim().toLowerCase();

    try {
      // 1. Try real Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(cred.user.uid);
      if (profile) {
        setUser(profile);
        localStorage.setItem('validamais_currentUser', JSON.stringify(profile));
        showAlert(`Bem-vindo de volta, ${profile.nome}!`, 'success');
        if (profile.role === 'admin') {
          navigateTo('admin-dashboard');
        } else {
          navigateTo('home');
        }
        return;
      }
    } catch (err: any) {
      console.warn("Firebase Auth login failed. Trying simulated persistent login on Firestore:", err);
    }

    // 2. Try simulated credentials from Firestore (persistent across different browsers)
    try {
      const dbProfile = await loginSimulatedUser(emailLower, password);
      setUser(dbProfile);
      localStorage.setItem('validamais_currentUser', JSON.stringify(dbProfile));
      showAlert(`Bem-vindo de volta, ${dbProfile.nome}! (Login de Teste)`, 'success');
      if (dbProfile.role === 'admin') {
        navigateTo('admin-dashboard');
      } else {
        navigateTo('home');
      }
      return;
    } catch (err: any) {
      if (err.message && err.message.includes('incorretos')) {
        showAlert('E-mail ou senha incorretos.', 'error');
        setLoading(false);
        throw err;
      }
    }

    // 3. Try fallback to simulated user in local storage (perfect for offline/unconfigured environments)
    try {
      const localUsersStr = localStorage.getItem('validamais_usuarios');
      const localUsers: Usuario[] = localUsersStr ? JSON.parse(localUsersStr) : DEFAULT_USERS;
      const matched = localUsers.find(u => u.email.toLowerCase() === emailLower);
      
      if (matched) {
        const matchedAny = matched as any;
        const expectedPass = matchedAny.senha || '123456';
        if (expectedPass === password) {
          setUser(matched);
          localStorage.setItem('validamais_currentUser', JSON.stringify(matched));
          showAlert(`Bem-vindo de volta, ${matched.nome}! (Sessão Local)`, 'success');
          if (matched.role === 'admin') {
            navigateTo('admin-dashboard');
          } else {
            navigateTo('home');
          }
          return;
        } else {
          showAlert('E-mail ou senha incorretos.', 'error');
          setLoading(false);
          throw new Error('E-mail ou senha incorretos.');
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('incorretos')) {
        throw err;
      }
    }

    // 4. Deny access for non-existent users - explicit registration required
    showAlert('Usuário não cadastrado. Por favor, cadastre-se para acessar o sistema.', 'error');
    setLoading(false);
    throw new Error('Usuário não cadastrado.');
  };

  // Register handler
  const registerUser = async (email: string, password: string, name: string, role: UserRole) => {
    setLoading(true);
    const emailLower = email.trim().toLowerCase();

    try {
      // 1. Try real Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userProfile = await createOrUpdateUserDocument(cred.user.uid, email, name, role);
      setUser(userProfile);
      localStorage.setItem('validamais_currentUser', JSON.stringify(userProfile));
      showAlert('Sua conta foi criada no Firebase e conectada com sucesso!', 'success');
      if (role === 'admin') {
        navigateTo('admin-dashboard');
      } else {
        navigateTo('home');
      }
      return;
    } catch (err: any) {
      console.warn("Firebase Auth register failed. Creating simulated persistent user on Firestore:", err);
    }

    // 2. Simulated registration in Firestore (allows cross-browser testing for anyone)
    const simulatedUid = 'sim_' + emailLower.replace(/[^a-zA-Z0-9]/g, '_');
    try {
      const existingProfile = await getUserProfile(simulatedUid);
      if (existingProfile) {
        showAlert('Este e-mail já está sendo utilizado.', 'error');
        setLoading(false);
        throw new Error('E-mail já está em uso.');
      }

      const userProfile = await createOrUpdateUserDocument(simulatedUid, emailLower, name.trim(), role, password);
      
      // Update local storage too
      const localUsersStr = localStorage.getItem('validamais_usuarios');
      const localUsers: Usuario[] = localUsersStr ? JSON.parse(localUsersStr) : [...DEFAULT_USERS];
      if (!localUsers.some(u => u.uid === userProfile.uid)) {
        localUsers.push({
          ...userProfile,
          senha: password
        } as any);
        localStorage.setItem('validamais_usuarios', JSON.stringify(localUsers));
      }

      setUser(userProfile);
      localStorage.setItem('validamais_currentUser', JSON.stringify(userProfile));
      
      showAlert(`Sua conta de teste '${userProfile.nome}' foi criada e cadastrada com sucesso!`, 'success');
      if (role === 'admin') {
        navigateTo('admin-dashboard');
      } else {
        navigateTo('home');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('em uso')) {
        throw err;
      }

      console.warn("Firestore registration failed, falling back to local storage-only registration:", err);
      
      // Local storage fallback
      const localUsersStr = localStorage.getItem('validamais_usuarios');
      const localUsers: Usuario[] = localUsersStr ? JSON.parse(localUsersStr) : [...DEFAULT_USERS];
      const emailExists = localUsers.some(u => u.email.toLowerCase() === emailLower);
      if (emailExists) {
        showAlert('Este e-mail já está sendo utilizado.', 'error');
        setLoading(false);
        throw new Error('E-mail já está em uso.');
      }

      const userProfile: Usuario = {
        uid: simulatedUid,
        email: emailLower,
        nome: name.trim(),
        role: role,
        criadoEm: new Date().toISOString()
      };

      localUsers.push({
        ...userProfile,
        senha: password
      } as any);
      localStorage.setItem('validamais_usuarios', JSON.stringify(localUsers));

      setUser(userProfile);
      localStorage.setItem('validamais_currentUser', JSON.stringify(userProfile));

      showAlert(`Sua conta de teste '${userProfile.nome}' foi criada localmente com sucesso!`, 'success');
      if (role === 'admin') {
        navigateTo('admin-dashboard');
      } else {
        navigateTo('home');
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logoutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth).catch(() => {});
    } catch (err) {
      // Ignore
    }
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('validamais_currentUser');
    showAlert('Você se desconectou com sucesso.', 'info');
    navigateTo('home');
    setLoading(false);
  };

  // CRUD wraps
  const saveProduct = async (formData: any, productId: string | null = null): Promise<Produto> => {
    setLoading(true);
    try {
      const adminId = user?.uid || 'mock_userId_admin1';
      const savedProd = await dbSaveProduct(formData, productId, adminId);
      showAlert(productId ? 'Lote promocional atualizado!' : 'Novo lote cadastrado com sucesso!', 'success');
      return savedProd;
    } catch (err: any) {
      showAlert('Erro ao processar salvamento do produto.', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await dbDeleteProduct(id);
      showAlert('Lote promocional excluído com sucesso.', 'success');
    } catch (err: any) {
      showAlert('Erro ao excluir lote do sistema.', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async (produtoId: string, quantidade: number): Promise<Reserva> => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error('Identificação necessária: faça login para reservar.');
      }
      const res = await dbCreateReservation(user.uid, user.email, produtoId, quantidade);
      showAlert('Reserva efetuada com sucesso! Retire em loja física.', 'success');
      return res;
    } catch (err: any) {
      showAlert(err.message || 'Erro ao processar reserva.', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservaId: string): Promise<void> => {
    setLoading(true);
    try {
      await dbCancelReservation(reservaId);
      showAlert('Reserva cancelada com sucesso.', 'info');
    } catch (err: any) {
      showAlert('Erro ao processar cancelamento.', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (reservaId: string, status: 'retirado' | 'cancelado'): Promise<void> => {
    setLoading(true);
    try {
      await dbUpdateReservationStatus(reservaId, status);
      showAlert(status === 'retirado' ? 'Entrega registrada com sucesso!' : 'Reserva cancelada com sucesso.', 'success');
    } catch (err: any) {
      showAlert('Erro ao atualizar status da retirada.', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (nome: string) => {
    if (!nome.trim()) return;
    setLoading(true);
    try {
      const colRef = collection(db, 'categorias');
      const docRef = await addDoc(colRef, {
        nome: nome.trim(),
        criadoEm: new Date().toISOString()
      });
      const newCat: Categoria = { id: docRef.id, nome: nome.trim(), criadoEm: new Date().toISOString() };
      setCategorias((prev) => [...prev, newCat]);
      showAlert(`Categoria '${nome.trim()}' cadastrada com sucesso!`, 'success');
    } catch (err) {
      console.warn("Firestore category addition failed, executing locally:", err);
      const newCatId = `cat_${Date.now()}`;
      const newCat: Categoria = { id: newCatId, nome: nome.trim(), criadoEm: new Date().toISOString() };
      const updated = [...categorias, newCat];
      setCategorias(updated);
      localStorage.setItem('validamais_categorias', JSON.stringify(updated));
      showAlert(`Categoria '${nome.trim()}' criada localmente.`, 'success');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'categorias', id));
      setCategorias((prev) => prev.filter(c => c.id !== id));
      showAlert('Categoria removida com sucesso!', 'success');
    } catch (err) {
      console.warn("Firestore category delete failed, executing locally:", err);
      const updated = categorias.filter(c => c.id !== id);
      setCategorias(updated);
      localStorage.setItem('validamais_categorias', JSON.stringify(updated));
      showAlert('Categoria removida localmente.', 'success');
    } finally {
      setLoading(false);
    }
  };

  const addAvaliacaoLoja = async (reservaId: string, nomeLoja: string, estrelas: number, comentario: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const colRef = collection(db, 'avaliacoes');
      const docRef = await addDoc(colRef, {
        reservaId,
        nomeLoja,
        usuarioId: user.uid,
        usuarioEmail: user.email,
        estrelas,
        comentario: comentario.trim(),
        criadoEm: new Date().toISOString()
      });
      
      const newReview: AvaliacaoLoja = {
        id: docRef.id,
        reservaId,
        nomeLoja,
        usuarioId: user.uid,
        usuarioEmail: user.email,
        estrelas,
        comentario: comentario.trim(),
        criadoEm: new Date().toISOString()
      };
      const updated = [...avaliacoes, newReview];
      setAvaliacoes(updated);
      localStorage.setItem('validamais_avaliacoes', JSON.stringify(updated));
      showAlert('Avaliação enviada com sucesso! Obrigado pelo seu feedback.', 'success');
    } catch (err) {
      console.warn("Firestore reviews creation failed, executing locally:", err);
      const newReviewId = `rev_${Date.now()}`;
      const newReview: AvaliacaoLoja = {
        id: newReviewId,
        reservaId,
        nomeLoja,
        usuarioId: user.uid,
        usuarioEmail: user.email,
        estrelas,
        comentario: comentario.trim(),
        criadoEm: new Date().toISOString()
      };
      const updated = [...avaliacoes, newReview];
      setAvaliacoes(updated);
      localStorage.setItem('validamais_avaliacoes', JSON.stringify(updated));
      showAlert('Avaliação salva localmente. Obrigado!', 'success');
    } finally {
      setLoading(false);
    }
  };

  const seedProducts = async (): Promise<void> => {
    setLoading(true);
    try {
      const creatorId = user?.uid || 'mock_userId_admin1';
      const count = await seedDefaultProducts(creatorId);
      showAlert(`Sucesso! ${count} produtos de massa de teste gerados com sucesso.`, 'success');
    } catch (err: any) {
      showAlert('Erro ao preencher produtos de teste.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAllDatabaseUsers = async (): Promise<void> => {
    setLoading(true);
    try {
      // 1. Reset LocalStorage
      localStorage.setItem('validamais_usuarios', JSON.stringify(DEFAULT_USERS));
      localStorage.setItem('validamais_reservas', JSON.stringify([]));

      // 2. Clear ALL user documents from Firestore *except* default models
      const defaultUids = [
        'sim_cliente_validamais_com',
        'sim_admin_validamais_com',
        'mock_userId_cliente1',
        'mock_userId_admin1'
      ];

      const usuariosSnap = await getDocs(collection(db, 'usuarios'));
      const userDeletes: Promise<void>[] = [];
      usuariosSnap.forEach((docSnap) => {
        if (!defaultUids.includes(docSnap.id)) {
          userDeletes.push(deleteDoc(doc(db, 'usuarios', docSnap.id)));
        }
      });
      if (userDeletes.length > 0) {
        await Promise.all(userDeletes);
      }

      // 3. Delete ALL reservations from Firestore
      const reservasSnap = await getDocs(collection(db, 'reservas'));
      const reservaDeletes: Promise<void>[] = [];
      reservasSnap.forEach((docSnap) => {
        reservaDeletes.push(deleteDoc(doc(db, 'reservas', docSnap.id)));
      });
      if (reservaDeletes.length > 0) {
        await Promise.all(reservaDeletes);
      }

      // 4. Delete ALL products and seed defaults
      const produtosSnap = await getDocs(collection(db, 'produtos'));
      const productDeletes: Promise<void>[] = [];
      produtosSnap.forEach((docSnap) => {
        productDeletes.push(deleteDoc(doc(db, 'produtos', docSnap.id)));
      });
      if (productDeletes.length > 0) {
        await Promise.all(productDeletes);
      }

      const creatorId = user?.uid || 'mock_userId_admin1';
      await seedDefaultProducts(creatorId);

      // 5. Check if we should logout
      if (user && !defaultUids.includes(user.uid)) {
        setUser(null);
        localStorage.removeItem('validamais_currentUser');
        navigateTo('home');
        showAlert('Todos os dados foram reiniciados do zero! Faça login com uma conta padrão.', 'success');
      } else {
        showAlert('Base de dados limpa com sucesso! Somente dados de modelo/padrão mantidos.', 'success');
      }
    } catch (err: any) {
      console.error("Erro ao redefinir base de dados:", err);
      showAlert('Não foi possível realizar a limpeza remota completa.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermissionAndToken = async (customVapidKey?: string): Promise<string | null> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showAlert('A API de Notificações não é suportada por esse navegador.', 'error');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationsPermission(permission);
      
      if (permission !== 'granted') {
        showAlert('A permissão de notificações nativas foi negada ou bloqueada.', 'warning');
        return null;
      }

      // If FCM is loaded and operational, attempt to register real Device Token from user's Firebase console settings!
      if (messaging) {
        // Fallback default VAPID or custom user VAPID key
        const vapid = customVapidKey || "BEnSg1r-S-F472PuyunT6ZJ5G-TID-rP9v9mI-j9Z584-placeholder";
        try {
          const token = await getToken(messaging, { vapidKey: vapid });
          if (token) {
            console.log("FCM Device Token retrieved:", token);
            if (user) {
              const prefRef = doc(db, 'notificacoes_preferencias', user.uid);
              const currentPrefs = notificacoesPreferencias || {
                uid: user.uid,
                cepsDesejados: [],
                distanciaKm: 5,
                notificarNovosDescontos: true,
                fcmTokens: []
              };
              const updatedTokens = Array.from(new Set([...(currentPrefs.fcmTokens || []), token]));
              const updatedPrefs = { ...currentPrefs, fcmTokens: updatedTokens };
              await setDoc(prefRef, updatedPrefs);
              setNotificacoesPreferencias(updatedPrefs);
            }
            showAlert('Configuração FCM efetuada! Token registrado no perfil do banco.', 'success');
            return token;
          }
        } catch (fcmErr: any) {
          console.warn("FCM dynamic Token retrieval bypassed (common inside browser sandboxed iframe previews). Sincronização em tempo real continua ativa!", fcmErr);
        }
      }

      // Fallback/Simulated FCM device registration inside sandbox previews
      const virtualToken = `virtual_fcm_token_${Date.now()}`;
      if (user) {
        const prefRef = doc(db, 'notificacoes_preferencias', user.uid);
        const currentPrefs = notificacoesPreferencias || {
          uid: user.uid,
          cepsDesejados: [],
          distanciaKm: 5,
          notificarNovosDescontos: true,
          fcmTokens: []
        };
        const updatedTokens = Array.from(new Set([...(currentPrefs.fcmTokens || []), virtualToken]));
        const updatedPrefs = { ...currentPrefs, fcmTokens: updatedTokens };
        await setDoc(prefRef, updatedPrefs);
        setNotificacoesPreferencias(updatedPrefs);
      }
      showAlert('Notificações ativadas com sucesso para esta sessão do navegador!', 'success');
      return virtualToken;
    } catch (err) {
      console.error("Permission request error:", err);
      showAlert('Ocorreu um erro ao ativar notificações.', 'error');
      return null;
    }
  };

  const updateNotificacaoPreferencias = async (ceps: string[], notificarNovosDescontos: boolean): Promise<void> => {
    if (!user) return;
    try {
      const prefRef = doc(db, 'notificacoes_preferencias', user.uid);
      const updated: NotificacaoPreferencias = {
        uid: user.uid,
        cepsDesejados: ceps,
        distanciaKm: 5,
        notificarNovosDescontos,
        fcmTokens: notificacoesPreferencias?.fcmTokens || []
      };
      await setDoc(prefRef, updated);
      setNotificacoesPreferencias(updated);
      showAlert('Preferências de monitoramento registradas com sucesso!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notificacoes_preferencias/${user.uid}`);
    }
  };

  const marcarNotificacaoComoLida = async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'notificacoes', id);
      await updateDoc(docRef, { lido: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notificacoes/${id}`);
    }
  };

  const apagarNotificacao = async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'notificacoes', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notificacoes/${id}`);
    }
  };

  const testSendNotificationPreview = async (produto: Produto): Promise<void> => {
    if (!user) {
      showAlert('É necessário estar logado para simular notificações.', 'warning');
      return;
    }
    const discountPct = Math.round(((produto.precoOriginal - produto.precoPromocional) / produto.precoOriginal) * 100);
    try {
      await addDoc(collection(db, 'notificacoes'), {
        usuarioId: user.uid,
        titulo: `🚨 Desconto Especial em ${produto.nomeLoja}!`,
        mensagem: `${produto.nomeProduto} baixou de R$ ${produto.precoOriginal.toFixed(2)} para R$ ${produto.precoPromocional.toFixed(2)} (${discountPct}% de economia direta). Aproveite!`,
        produtoId: produto.id || 'teste',
        nomeLoja: produto.nomeLoja,
        precoOriginal: produto.precoOriginal,
        precoPromocional: produto.precoPromocional,
        lido: false,
        criadoEm: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notificacoes');
    }
  };

  const isFCMSupported = !!messaging;

  return (
    <AppContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        currentScreen,
        selectedProductId,
        alert,
        produtos,
        reservas,
        categorias,
        avaliacoes,
        produtosLoading,
        reservasLoading,
        setAlert,
        showAlert,
        navigateTo,
        loginUser,
        registerUser,
        logoutUser,
        saveProduct,
        deleteProduct,
        createReservation,
        cancelReservation,
        updateReservationStatus,
        addCategory,
        deleteCategory,
        addAvaliacaoLoja,
        seedProducts,
        clearAllDatabaseUsers,
        notificacoes,
        notificacoesPreferencias,
        notificationsPermission,
        isFCMSupported,
        requestNotificationPermissionAndToken,
        updateNotificacaoPreferencias,
        marcarNotificacaoComoLida,
        apagarNotificacao,
        testSendNotificationPreview
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
