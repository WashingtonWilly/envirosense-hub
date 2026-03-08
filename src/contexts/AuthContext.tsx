import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type AppRole = 'super_admin' | 'admin' | 'user';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: AppRole;
  city: string;
  createdAt: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, city?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: AppRole | AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(user: User) {
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Firestore user data:', JSON.stringify(data));
        // Firestore uses 'rol' (Spanish), map to 'role'
        const resolvedRole = data.role || data.rol || 'user';
        console.log('Resolved role:', resolvedRole);
        setUserProfile({
          uid: user.uid,
          name: data.name || user.displayName || 'Usuario',
          email: data.email || user.email || '',
          role: resolvedRole as AppRole,
          city: data.city || 'Riobamba',
          createdAt: data.createdAt,
        });
      } else {
        // Create default profile if it doesn't exist
        const defaultProfile: Omit<UserProfile, 'uid'> = {
          name: user.displayName || 'Usuario',
          email: user.email || '',
          role: 'user',
          city: 'Riobamba',
          createdAt: serverTimestamp(),
        };
        await setDoc(docRef, defaultProfile);
        setUserProfile({ uid: user.uid, ...defaultProfile });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback profile when Firestore is unavailable
      setUserProfile({
        uid: user.uid,
        name: user.displayName || 'Usuario',
        email: user.email || '',
        role: 'user',
        city: 'Riobamba',
        createdAt: null,
      });
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string, name: string, city = 'Riobamba') {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    const profile: Omit<UserProfile, 'uid'> = {
      name,
      email,
      role: 'user',
      city,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', credential.user.uid), profile);
    setUserProfile({ uid: credential.user.uid, ...profile });
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  function hasRole(role: AppRole | AppRole[]) {
    if (!userProfile) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(userProfile.role);
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}
