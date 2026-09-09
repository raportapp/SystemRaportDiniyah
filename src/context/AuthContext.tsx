import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { dbService } from '../lib/db';
import { UserAccount } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserAccount | null;
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  login: (
    username: string,
    password: string,
    users?: UserAccount[],
  ) => Promise<UserAccount>;
  logout: () => Promise<void>;
  updateUserPassword: (
    newPassword: string,
    currentPassword?: string,
  ) => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  refreshAuthClaims: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function usernameToEmail(input: string) {
  const value = input.trim().toLowerCase();
  return value.includes('@') ? value : `${value}@alhusna.app`;
}
async function resolveProfile(user: FirebaseUser): Promise<UserAccount> {
  const token = await user.getIdTokenResult();
  let profile: UserAccount | undefined;
  try {
    const users = await dbService.getUsers();
    profile =
      users.find((u) => u.id === user.uid) ||
      users.find((u) => u.email?.toLowerCase() === user.email?.toLowerCase());
  } catch {
    /* The data-loading screen separately offers a retry on database failure. */
  }
  return {
    ...profile,
    id: user.uid,
    username: profile?.username || user.email?.split('@')[0] || 'user',
    fullname: profile?.fullname || user.displayName || 'Pengguna',
    email: user.email || '',
    // Only verified claims grant administrative privileges.
    role: token.claims.admin === true ? 'admin' : 'teacher',
  };
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  useEffect(() => {
    let version = 0;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const request = ++version;
      setIsLoadingAuth(true);
      setFirebaseUser(user);
      setCurrentUser(null);
      try {
        const profile = user ? await resolveProfile(user) : null;
        if (request === version) setCurrentUser(profile);
      } finally {
        if (request === version) setIsLoadingAuth(false);
      }
    });
    return () => {
      version++;
      unsubscribe();
    };
  }, []);
  const login = async (username: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        usernameToEmail(username),
        password,
      );
      return await resolveProfile(result.user);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (
        [
          'auth/invalid-credential',
          'auth/wrong-password',
          'auth/user-not-found',
          'auth/invalid-email',
        ].includes(code || '')
      ) {
        throw new Error(
          'Username, email, atau password salah. Periksa kembali data akun Anda.',
        );
      }
      if (code === 'auth/too-many-requests')
        throw new Error(
          'Terlalu banyak percobaan. Silakan tunggu sebelum mencoba lagi.',
        );
      if (code === 'auth/network-request-failed')
        throw new Error(
          'Koneksi terputus. Periksa jaringan Anda dan coba lagi.',
        );
      throw error;
    }
  };
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };
  const updateUserPassword = async (next: string, current?: string) => {
    if (!auth.currentUser?.email)
      throw new Error('Silakan masuk kembali terlebih dahulu.');
    if (next.length < 6) throw new Error('Password minimal 6 karakter.');
    if (current)
      await reauthenticateWithCredential(
        auth.currentUser,
        EmailAuthProvider.credential(auth.currentUser.email, current),
      );
    await updatePassword(auth.currentUser, next);
  };
  const refreshAuthClaims = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.getIdToken(true);
    setCurrentUser(await resolveProfile(auth.currentUser));
  };
  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentUser,
        isLoggedIn: !!firebaseUser && !!currentUser,
        isLoadingAuth,
        login,
        logout,
        updateUserPassword,
        setCurrentUser,
        refreshAuthClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
}
