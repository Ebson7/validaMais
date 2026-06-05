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
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { createOrUpdateUserDocument, getUserProfile, loginSimulatedUser } from '../lib/auth';
import { Usuario, UserRole } from '../types';

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
  | 'admin-reservas';

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
  setAlert: (alert: Alert | null) => void;
  showAlert: (message: string, type: Alert['type']) => void;
  navigateTo: (screen: ScreenType, productId?: string | null) => void;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logoutUser: () => Promise<void>;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<Usuario | null>(() => {
    // Synchronous immediate check for offline/dev speed
    const saved = localStorage.getItem('validamais_currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [alert, setAlertState] = useState<Alert | null>(null);

  // Seed default demo accounts to local storage and Firestore on first load
  useEffect(() => {
    const existing = localStorage.getItem('validamais_usuarios');
    if (!existing) {
      localStorage.setItem('validamais_usuarios', JSON.stringify(DEFAULT_USERS));
    }

    const seedMockUsersInFirestore = async () => {
      try {
        for (const u of DEFAULT_USERS) {
          const simulatedUid = 'sim_' + u.email.replace(/[^a-zA-Z0-9]/g, '_');
          const existsProfile = await getUserProfile(simulatedUid);
          if (!existsProfile) {
            await createOrUpdateUserDocument(simulatedUid, u.email, u.nome, u.role, '123456');
          }
        }
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

  // Authenticated state listener
  useEffect(() => {
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
        // If google firebase logs out, we only log out locally if we were not in a robust offline-session
        const localSession = localStorage.getItem('validamais_currentUser');
        const isMockSession = localSession && JSON.parse(localSession).uid.startsWith('mock_');
        if (!isMockSession) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
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

    // 3. Fallback: Auto-create simulated user if not found at all, and persist it to Firestore
    try {
      const autoRole: UserRole = (emailLower.includes('admin') || emailLower.includes('lojista') || emailLower.includes('comerciante')) ? 'admin' : 'user';
      const autoName = emailLower.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Consumidor';
      const simulatedUid = 'sim_' + emailLower.replace(/[^a-zA-Z0-9]/g, '_');
      
      const newProfile = await createOrUpdateUserDocument(simulatedUid, emailLower, autoName, autoRole, password);
      setUser(newProfile);
      localStorage.setItem('validamais_currentUser', JSON.stringify(newProfile));
      showAlert(`Bem-vindo, ${newProfile.nome}! (Conta simulada criada e persistida no Firebase)`, 'success');
      if (newProfile.role === 'admin') {
        navigateTo('admin-dashboard');
      } else {
        navigateTo('home');
      }
    } catch (err: any) {
      console.error("Firestore write failed:", err);
      showAlert('Erro ao se conectar ao banco de dados.', 'error');
    } finally {
      setLoading(false);
    }
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
    try {
      const simulatedUid = 'sim_' + emailLower.replace(/[^a-zA-Z0-9]/g, '_');
      
      const existingProfile = await getUserProfile(simulatedUid);
      if (existingProfile) {
        showAlert('Este e-mail já está sendo utilizado.', 'error');
        setLoading(false);
        throw new Error('E-mail já está em uso.');
      }

      const userProfile = await createOrUpdateUserDocument(simulatedUid, emailLower, name.trim(), role, password);
      setUser(userProfile);
      localStorage.setItem('validamais_currentUser', JSON.stringify(userProfile));
      
      showAlert(`Sua conta de teste '${userProfile.nome}' foi criada e persistida no Firebase!`, 'success');
      if (role === 'admin') {
        navigateTo('admin-dashboard');
      } else {
        navigateTo('home');
      }
    } catch (err: any) {
      console.error("Firestore registration failure:", err);
      showAlert('Falha ao processar cadastro no banco de dados remoto.', 'error');
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

  return (
    <AppContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        currentScreen,
        selectedProductId,
        alert,
        setAlert,
        showAlert,
        navigateTo,
        loginUser,
        registerUser,
        logoutUser
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
