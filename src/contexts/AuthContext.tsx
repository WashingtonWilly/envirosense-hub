import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
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

const PROFILE_TIMEOUT_MS = 10000; // 10s max wait for profile

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

/** Ensures a user profile doc exists in Firestore; creates one with defaults if missing. */
async function ensureProfileDoc(user: User): Promise<void> {
  const docRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        name: user.displayName || user.email?.split('@')[0] || 'Usuario',
        email: user.email || '',
        role: 'user' as AppRole,
        city: 'Riobamba',
        isActive: true,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('ensureProfileDoc: could not verify/create profile doc', err);
    // Non-fatal — the onSnapshot listener will handle fallback
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspended, setSuspended] = useState(false);
  const navigate = useNavigate();

  const profileUnsubRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cleanupProfileListener() {
    if (profileUnsubRef.current) {
      profileUnsubRef.current();
      profileUnsubRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function subscribeToProfile(user: User) {
    cleanupProfileListener();

    // Safety timeout — if profile never loads, build a fallback so the user isn't stuck
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.warn('Profile load timed out — using fallback profile');
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
      }
    }, PROFILE_TIMEOUT_MS);

    const docRef = doc(db, 'users', user.uid);

    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        // Clear timeout since we got a response
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (docSnap.exists()) {
          const data = docSnap.data();
          const resolvedRole = (data.role || data.rol || 'user') as AppRole;
          const isActive = data.isActive !== false;

          if (!isActive) {
            setSuspended(true);
            setUserProfile(null);
            signOut(auth).then(() => {
              cleanupProfileListener();
              navigate('/login', { replace: true });
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
          // Document doesn't exist yet — create it (this is the sync fix)
          const defaultProfile = {
            name: user.displayName || user.email?.split('@')[0] || 'Usuario',
            email: user.email || '',
            role: 'user' as AppRole,
            city: 'Riobamba',
            isActive: true,
            createdAt: serverTimestamp(),
          };
          setDoc(docRef, defaultProfile).catch((err) =>
            console.error('Failed to create profile doc from listener:', err)
          );
          // Set local state immediately so user isn't stuck
          setUserProfile({ uid: user.uid, ...defaultProfile });
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error listening to profile:', error);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
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
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Ensure the Firestore profile doc exists before subscribing
        await ensureProfileDoc(user);
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
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string, name: string, city = 'Riobamba') {
    setLoading(true);
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
