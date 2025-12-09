import React from 'react';
import type { IUser, UserRole } from '../../data/interfaces';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export interface AuthContextType {
    user: IUser | null;
    userId: string | null;
    isLoading: boolean;
    appId: string;
    setRole: (role: UserRole) => void;
    loginAsDemo: () => Promise<void>;
    authInstance: Auth | null;
    dbInstance: Firestore | null;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);
