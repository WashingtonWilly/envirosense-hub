import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export type AppRole = 'super_admin' | 'admin' | 'user';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: AppRole;
  city: string;
  isActive: boolean;
  createdAt: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  suspended: boolean;
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
  const [suspended, setSuspended] = useState(false);
  const navigate = useNavigate();

  // Keep a ref to the profile snapshot unsubscribe so we can clean it up
  const profileUnsubRef = useRef<(() => void) | null>(null);

  // Flag to track if this is the first profile load (skip suspension toast on initial load)
  const initialLoadRef = useRef(true);

  function cleanupProfileListener() {
    if (profileUnsubRef.current) {
      profileUnsubRef.current();
      profileUnsubRef.current = null;
    }
  }

  function subscribeToProfile(user: User) {
    cleanupProfileListener();
    initialLoadRef.current = true;

    const docRef = doc(db, 'users', user.uid);

    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const resolvedRole = (data.role || data.rol || 'user') as AppRole;
          const isActive = data.isActive !== false; // default true

          if (!isActive) {
            // User is suspended — force logout
            setSuspended(true);
            setUserProfile(null);
            signOut(auth).then(() => {
              cleanupProfileListener();
              navigate('/login', { replace: true });

              // Only show toast if it's not the very first load (i.e. user was active and got suspended mid-session)
              // Also show on login attempt while suspended
              toast({
                variant: 'destructive',
                title: 'Cuenta suspendida',
                description:
                  'Tu cuenta ha sido suspendida por un administrador. Por favor, contáctate con soporte.',
              });
            });
            setLoading(false);
            return;
          }

          // User is active
          setSuspended(false);
          setUserProfile({
            uid: user.uid,
            name: data.name || user.displayName || 'Usuario',
            email: data.email || user.email || '',
            role: resolvedRole,
            city: data.city || 'Riobamba',
            isActive: true,
            createdAt: data.createdAt,
          });
        } else {
          // Document doesn't exist — create default profile
          const defaultProfile = {
            name: user.displayName || 'Usuario',
            email: user.email || '',
            role: 'user' as AppRole,
            city: 'Riobamba',
            isActive: true,
            createdAt: serverTimestamp(),
          };
          setDoc(docRef, defaultProfile);
          setUserProfile({ uid: user.uid, ...defaultProfile });
        }

        initialLoadRef.current = false;
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to profile:', error);
        // Fallback profile when Firestore is unavailable
        setUserProfile({
          uid: user.uid,
          name: user.displayName || 'Usuario',
          email: user.email || '',
          role: 'user',
          city: 'Riobamba',
          isActive: true,
          createdAt: null,
        });
        setLoading(false);
      },
    );

    profileUnsubRef.current = unsub;
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        subscribeToProfile(user);
      } else {
        cleanupProfileListener();
        setUserProfile(null);
        setSuspended(false);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      cleanupProfileListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    setSuspended(false);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string, name: string, city = 'Riobamba') {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    const profile = {
      name,
      email,
      role: 'user' as AppRole,
      city,
      isActive: true,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', credential.user.uid), profile);
    // onSnapshot will pick up the new profile automatically
  }

  async function logout() {
    cleanupProfileListener();
    await signOut(auth);
    setUserProfile(null);
    setSuspended(false);
  }

  function hasRole(role: AppRole | AppRole[]) {
    if (!userProfile) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(userProfile.role);
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, userProfile, loading, suspended, login, register, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}
