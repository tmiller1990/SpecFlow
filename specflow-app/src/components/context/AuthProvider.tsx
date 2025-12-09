import React, { useState, useCallback, useEffect } from 'react';
import { auth, db, appId } from '../../firebaseInit';
import { onAuthStateChanged, signInAnonymously, type User as FirebaseAuthUser, type Auth } from 'firebase/auth';
import type { IUser, UserRole } from '../../data/interfaces';
import { ensureMockDataExists } from '../../firestore';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getMockRole = (uid: string): UserRole => {
        if (uid.endsWith('00')) return 'designer';
        if (uid.endsWith('11')) return 'gc';
        return 'client';
    };

    const setRole = useCallback((newRole: UserRole) => {
        if (user) {
            setUser({ ...user, role: newRole });
        }
    }, [user]);

    const loginAsDemo = useCallback(async () => {
        if (!auth) {
            throw new Error("Firebase Auth not initialized");
        }
        try {
            setIsLoading(true);
            await signInAnonymously(auth);
            // The onAuthStateChanged listener will handle setting the user
        } catch (error) {
            console.error("Failed to sign in anonymously:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Set up the auth state listener
        if (!auth) {
            setIsLoading(false);
            return;
        }

        let isInitialAuthCheckComplete = false;

        const unsubscribe = onAuthStateChanged(auth as Auth, async (authUser) => {
            setFirebaseUser(authUser);
            if (authUser) {
                const role = getMockRole(authUser.uid);
                setUser({
                    uid: authUser.uid,
                    email: authUser.email || `anonymous-${authUser.uid.substring(0, 8)}@specflow.app`,
                    role: role
                });

                // Await the mock data creation to ensure data is present before loading ends
                await ensureMockDataExists(authUser.uid);
            } else {
                setUser(null);
            }

            if (!isInitialAuthCheckComplete) {
                setIsLoading(false);
                isInitialAuthCheckComplete = true;
            }
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        userId: firebaseUser?.uid || null,
        isLoading,
        appId,
        setRole,
        loginAsDemo,
        authInstance: auth,
        dbInstance: db,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
