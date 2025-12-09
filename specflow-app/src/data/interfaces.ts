/**
 * ===========================================
 * 1. Required TypeScript Data Models (Interfaces)
 * ===========================================
 */

//import type { Auth } from "firebase/auth/web-extension";
//import type { Firestore } from "firebase/firestore/lite";
import React, { createContext } from "react";
// --- 1.1 User and Authentication ---

export type UserRole = 'client' | 'designer' | 'gc';

export interface IUser {
    uid: string;
    email: string;
    role: UserRole;
}

// --- 1.2 Project and Cost Tracking ---

export interface IProject {
    id: string;
    name: string;
    ownerId: string;
    /** The initial budget for the project. */
    initialBudget: number;
    /** The cumulative sum of all approved option costImpacts. */
    runningCostDelta: number; 
    /** Defines members as a map of { [user_id]: user_role } for efficient lookup. */
    members: { [uid: string]: UserRole }; 
}

// --- 1.3 Decision Card Details ---

export interface IOption {
    name: string;
    vendorLink: string;
    /** The cost change associated with selecting this option (e.g., 500 for +$500). */
    costImpact: number; 
}

export type DecisionStatus = 'Pending' | 'Approved' | 'Rejected';

export interface IDecisionCard {
    id: string;
    projectId: string;
    roomId: string; // e.g., "Kitchen", "Master Bath"
    title: string; // e.g., "Kitchen Countertop Material"
    description: string;
    status: DecisionStatus;
    options: IOption[];
    
    // Set when the decision is made
    approvedOption?: IOption;
    
    approvalMetadata?: {
        approvedBy: string; // userId of the approver
        approvedAt: number; // Timestamp
        finalCostImpact: number; // Snapshot of the costImpact at time of approval
    };
}


// --- Auth Context and Hook (Simplified for single-file MVP) ---

export interface AuthContextType {
    user: IUser | null;
    userId: string | null;
    appId: string;
    mockSetRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
export { AuthContext, useAuth };