import { Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { authService, UserProfile } from '../services/authService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  notificationCount: number;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>) => Promise<void>;
  uploadProfilePicture: (imageUri: string) => Promise<string>;
  createProfile: (username?: string) => Promise<void>;
  refreshNotificationCount: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Restore session on mount and listen for auth state changes
  useEffect(() => {
    // Check for an existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          try {
            // ensureProfile creates the row on first session restore if needed
            const profile = await authService.ensureProfile(session.user);
            setUserProfile(profile);
            refreshNotificationCount(session.user.id);
          } catch {
            // Profile creation may fail if not fully authenticated yet
          }
        }
      } catch {
        // Session retrieval failed silently
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Listen for future auth state changes (token refresh, sign-out from another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setUserProfile(null);
          setNotificationCount(0);
        } else if (event === 'TOKEN_REFRESHED' && session.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshNotificationCount = async (userId?: string): Promise<void> => {
    const id = userId ?? user?.id;
    if (!id) return;

    try {
      const count = await authService.getUnreadNotificationCount(id);
      setNotificationCount(count);
    } catch {
      // Non-critical — ignore silently
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const profile = await authService.login(email, password);
      const currentUser = await authService.getCurrentUser();

      setUser(currentUser);
      setUserProfile(profile);

      if (currentUser) {
        refreshNotificationCount(currentUser.id);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: authUser, needsEmailConfirmation } = await authService.register(email, password, username, name);

      if (!needsEmailConfirmation) {
        // Auto-confirmed: set up session immediately
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const profile = await authService.ensureProfile(currentUser);
          setUserProfile(profile);
          refreshNotificationCount(currentUser.id);
        }
      }

      return needsEmailConfirmation;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setUserProfile(null);
      setNotificationCount(0);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>) => {
    if (!user) throw new Error('No user logged in');

    try {
      await authService.updateUserProfile(user.id, updates);
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates, updated_at: new Date().toISOString() });
      }
    } catch (error) {
      throw error;
    }
  };

  const uploadProfilePicture = async (imageUri: string): Promise<string> => {
    if (!user) throw new Error('No user logged in');

    try {
      const downloadURL = await authService.uploadProfilePicture(user.id, imageUri);
      if (userProfile) {
        setUserProfile({ ...userProfile, profile_picture: downloadURL, updated_at: new Date().toISOString() });
      }
      return downloadURL;
    } catch (error) {
      throw error;
    }
  };

  const createProfile = async (username?: string): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      const profile = await authService.createProfile(user.id, user.email || '', username);
      setUserProfile(profile);
    } catch (error) {
      throw error;
    }
  };

  const refreshUserData = async (): Promise<void> => {
    if (!user) return;

    try {
      await refreshNotificationCount(user.id);
    } catch {
      // Non-critical — ignore silently
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    notificationCount,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    updateProfile,
    uploadProfilePicture,
    createProfile,
    refreshNotificationCount: () => refreshNotificationCount(),
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
