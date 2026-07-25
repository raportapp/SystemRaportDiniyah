import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { dbService } from '../lib/db';
import { UserAccount } from '../types';
import { INITIAL_USERS } from '../utils/initialData';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserAccount | null;
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  login: (usernameOrEmail: string, password: string, usersList: UserAccount[]) => Promise<UserAccount>;
  logout: () => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  refreshAuthClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function usernameToEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@alhusna.app`;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  const refreshAuthClaims = async () => {
    if (auth.currentUser) {
      try {
        const idTokenResult = await auth.currentUser.getIdTokenResult(true);
        if (currentUser) {
          const hasAdminClaim = idTokenResult.claims.admin === true;
          setCurrentUser(prev => prev ? { ...prev, role: hasAdminClaim ? 'admin' : prev.role } : null);
        }
      } catch (err) {
        console.error("Gagal merefresh token auth:", err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const hasAdminClaim = idTokenResult.claims.admin === true;

          // Fetch users list from dbService to find profile corresponding to user
          const allUsers = await dbService.getUsers();
          const list = allUsers && allUsers.length > 0 ? allUsers : INITIAL_USERS;
          
          const emailLower = user.email ? user.email.toLowerCase() : '';
          const unameFromEmail = emailLower.split('@')[0];

          // Match by email or username
          let matched = list.find(u => 
            (u.email && u.email.toLowerCase() === emailLower) ||
            (u.username && u.username.toLowerCase() === unameFromEmail)
          );

          if (!matched) {
            // Default user fallback
            matched = {
              id: user.uid,
              username: unameFromEmail || 'user',
              fullname: user.displayName || unameFromEmail || 'Pengguna',
              role: hasAdminClaim ? 'admin' : (unameFromEmail === 'admin' ? 'admin' : 'teacher'),
              email: user.email || undefined
            };
          } else if (hasAdminClaim) {
            matched = { ...matched, role: 'admin' };
          }

          setCurrentUser(matched);
        } catch (err) {
          console.error("Error matching user profile on Auth state change:", err);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (usernameOrEmail: string, password: string, usersList: UserAccount[]): Promise<UserAccount> => {
    const email = usernameToEmail(usernameOrEmail);
    const username = usernameOrEmail.trim().toLowerCase().split('@')[0];

    // Find profile matching username in existing users list
    const profile = usersList.find(u => u.username.toLowerCase() === username);

    try {
      // Attempt standard Firebase Auth sign-in ONLY (no auto registration)
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      // Force token refresh to get updated custom claims
      const idTokenResult = await userCred.user.getIdTokenResult(true);
      const hasAdminClaim = idTokenResult.claims.admin === true;

      const userRole = hasAdminClaim ? 'admin' : (profile?.role || (username === 'admin' ? 'admin' : 'teacher'));

      const userProfile: UserAccount = profile ? {
        ...profile,
        role: userRole
      } : {
        id: userCred.user.uid,
        username,
        fullname: username === 'admin' ? 'Administrator PPTQ' : 'Ustadz / Guru',
        role: userRole,
        email
      };

      setCurrentUser(userProfile);
      return userProfile;
    } catch (err: any) {
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/wrong-password'
      ) {
        throw new Error('Username atau password tidak ditemukan / salah. Silakan hubungi Administrator untuk pembuatan akun.');
      }
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  const updateUserPassword = async (newPassword: string): Promise<void> => {
    if (auth.currentUser) {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    } else {
      throw new Error('User tidak terotentikasi di Firebase Auth.');
    }
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      currentUser,
      isLoggedIn: !!currentUser && !!firebaseUser,
      isLoadingAuth,
      login,
      logout,
      updateUserPassword,
      setCurrentUser,
      refreshAuthClaims
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

