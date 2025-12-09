import { db, appId } from './firebaseInit.ts';
import {
    collection,
    doc,
    setDoc,
    runTransaction,
    type DocumentData,
    Firestore,
    DocumentReference,
    getDocs,
    deleteDoc
} from 'firebase/firestore';
import type { IProject, IDecisionCard, IOption, DecisionStatus } from './data/interfaces';

// ======================================
// Data Access Path Helpers
// ======================================

const MOCK_PROJECT_ID = 'lake-house-addition';
const MOCK_DECISION_ID = 'floor-selection-001'; // Explicit ID for the mock card

/**
 * Constructs the base path for public data.
 * @param collectionName The name of the top-level collection (e.g., 'projects').
 */
const getPublicCollectionPath = (collectionName: string): string => {
    // Path: /artifacts/{appId}/public/data/{collectionName}
    return `artifacts/${appId}/public/data/${collectionName}`;
};

/**
 * Gets a reference to a specific collection (e.g., 'projects', 'decisions').
 * @param collectionName The name of the collection.
 */
export const getCollectionRef = (collectionName: string) => {
    if (!db) return null;
    return collection(db as Firestore, getPublicCollectionPath(collectionName));
};

/**
 * Gets a reference to a specific project document.
 * @param projectId The ID of the project.
 */
export const getProjectDocRef = (projectId: string): DocumentReference<DocumentData> | null => {
    if (!db) return null;
    return doc(db as Firestore, getPublicCollectionPath('projects'), projectId);
}

/**
 * Gets a reference to the decisions subcollection for a given project.
 * @param projectId The ID of the project.
 */
export const getDecisionCollectionRef = (projectId: string) => {
    if (!db) return null;
    return collection(db as Firestore, getPublicCollectionPath('projects'), projectId, 'decisions');
}

/**
 * Gets a reference to a specific decision card document.
 * @param projectId The ID of the project.
 * @param cardId The ID of the decision card.
 */
export const getDecisionDocRef = (projectId: string, cardId: string): DocumentReference<DocumentData> | null => {
    if (!db) return null;
    return doc(db as Firestore, getPublicCollectionPath('projects'), projectId, 'decisions', cardId);
}

// ======================================
// Mock Data Seeding
// ======================================

const MOCK_PROJECT_NAME = 'Lake House Addition';

const mockOptions: IOption[] = [
    {
        name: 'Standard Oak Flooring (Budget)',
        vendorLink: 'https://example.com/oak',
        costImpact: 0, 
    },
    {
        name: 'Wide-Plank Italian Walnut (+Upgrade)',
        vendorLink: 'https://example.com/walnut',
        costImpact: 4500, 
    },
    {
        name: 'Polished Concrete (-Downgrade)',
        vendorLink: 'https://example.com/concrete',
        costImpact: -1200, 
    },
];

const mockProjectData = (ownerId: string): IProject => ({
    id: MOCK_PROJECT_ID,
    name: MOCK_PROJECT_NAME,
    ownerId: ownerId,
    initialBudget: 100000,
    runningCostDelta: 0, 
    members: {
        [ownerId]: 'designer', 
        'client-mock-uid': 'client', 
        'gc-mock-uid': 'gc' 
    }
});

const mockDecisionCard: Omit<IDecisionCard, 'id'> = {
    projectId: MOCK_PROJECT_ID,
    roomId: 'Living Room',
    title: 'Flooring Material Selection',
    description: 'The client must choose between three flooring options for the main living area. The budget is based on the Standard Oak option.',
    status: 'Pending',
    options: mockOptions,
};

/**
 * Creates the initial mock project and decision card data in Firestore if they don't exist.
 */
export const ensureMockDataExists = async (currentUserId: string): Promise<void> => {
    if (!db) {
        console.error('Firestore DB not initialized. Cannot seed data.');
        return;
    }

    const projectRef = getProjectDocRef(MOCK_PROJECT_ID);
    const decisionRef = getDecisionDocRef(MOCK_PROJECT_ID, MOCK_DECISION_ID);
    if (!projectRef || !decisionRef) return;

    try {
        // Delete existing mock project to create fresh state
        try {
            await deleteDoc(projectRef);
        } catch {
            // Project might not exist, that's fine
        }

        // Create fresh project with current user
        const projectData = mockProjectData(currentUserId);
        await setDoc(projectRef, projectData as DocumentData);

        // Create decision card
        await setDoc(decisionRef, mockDecisionCard as DocumentData);
    } catch (error) {
        console.error('Firestore Seeder: Failed to create mock data:', error);
    }
};

// ======================================
// Transactions
// ======================================

/**
 * Atomically approves a decision card and updates the project's running cost delta.
 */
export const approveDecisionCardTransaction = async (
    projectId: string, 
    cardId: string, 
    option: IOption, 
    userId: string
): Promise<void> => {
    if (!db) {
        throw new Error("Firestore DB not initialized.");
    }

    const projectRef = getProjectDocRef(projectId);
    const decisionRef = getDecisionDocRef(projectId, cardId);

    if (!projectRef || !decisionRef) {
        throw new Error("Invalid project or decision reference.");
    }

    console.log(`[Transaction Debug] Attempting to approve card:`, {
        projectId,
        cardId,
        projectPath: projectRef.path,
        decisionPath: decisionRef.path
    });

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get the current state of the Project and Decision Card
            const projectSnap = await transaction.get(projectRef);
            const decisionSnap = await transaction.get(decisionRef);

            console.log(`[Transaction Debug] Snapshot check:`, {
                projectExists: projectSnap.exists(),
                decisionExists: decisionSnap.exists()
            });

            if (!projectSnap.exists()) {
                throw new Error("Project document does not exist!");
            }
            if (!decisionSnap.exists()) {
                throw new Error("Decision card does not exist!");
            }

            const currentProject = projectSnap.data() as IProject;
            const currentDecision = decisionSnap.data() as IDecisionCard;

            // 2. Validation: Only update if the card is still Pending
            if (currentDecision.status !== 'Pending') {
                console.warn(`Decision Card ${cardId} is already ${currentDecision.status}. Skipping update.`);
                return; // Exit transaction gracefully
            }
            
            // 3. Calculate New Project Cost Delta
            const newCostDelta = currentProject.runningCostDelta + option.costImpact;

            // 4. Prepare the updates

            // Update the Decision Card
            const decisionUpdate = {
                status: 'Approved' as DecisionStatus,
                approvedOption: option,
                approvalMetadata: {
                    approvedBy: userId,
                    // Note: Date.now() is used here instead of serverTimestamp() 
                    // because serverTimestamp needs to be an 'update' object and 
                    // the value is not available in the client. Using Date.now() for approximation.
                    approvedAt: Date.now(), 
                    finalCostImpact: option.costImpact,
                },
            };
            
            // Update the Project Document
            const projectUpdate = {
                runningCostDelta: newCostDelta,
            };

            // 5. Commit the updates within the transaction
            transaction.update(decisionRef, decisionUpdate);
            transaction.update(projectRef, projectUpdate);
            
            console.log(`Transaction Success: Approved decision ${cardId}. New Project Delta: $${newCostDelta}.`);
        });
    } catch (e) {
        console.error("Firestore Transaction Failed:", e);
        throw new Error(`Approval failed: ${e instanceof Error ? e.message : String(e)}`);
    }
};

/**
 * Rejects an approved decision card, reverting it to Pending status.
 * This is performed inside a Firestore Transaction to guarantee atomicity and data consistency.
 * @param projectId The ID of the project.
 * @param cardId The ID of the decision card.
 * @returns A promise that resolves when the transaction is complete.
 */
export const rejectDecisionCardTransaction = async (
    projectId: string, 
    cardId: string
): Promise<void> => {
    if (!db) {
        throw new Error("Firestore DB not initialized.");
    }

    const projectRef = getProjectDocRef(projectId);
    const decisionRef = getDecisionDocRef(projectId, cardId);

    if (!projectRef || !decisionRef) {
        throw new Error("Invalid project or decision reference.");
    }

    console.log(`[Reject Transaction] Attempting to reject card:`, {
        projectId,
        cardId,
        projectPath: projectRef.path,
        decisionPath: decisionRef.path
    });

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get the current state of the Project and Decision Card
            const projectSnap = await transaction.get(projectRef);
            const decisionSnap = await transaction.get(decisionRef);

            console.log(`[Reject Transaction] Snapshot check:`, {
                projectExists: projectSnap.exists(),
                decisionExists: decisionSnap.exists()
            });

            if (!projectSnap.exists()) {
                throw new Error("Project document does not exist!");
            }
            if (!decisionSnap.exists()) {
                throw new Error("Decision card does not exist!");
            }

            const currentProject = projectSnap.data() as IProject;
            const currentDecision = decisionSnap.data() as IDecisionCard;

            // 2. Validation: Only update if the card is Approved
            if (currentDecision.status !== 'Approved') {
                console.warn(`Decision Card ${cardId} is not approved (status: ${currentDecision.status}). Cannot reject.`);
                return; // Exit transaction gracefully
            }

            if (!currentDecision.approvedOption) {
                throw new Error("Approved decision missing approvedOption data!");
            }

            // 3. Calculate New Project Cost Delta (reverse the cost impact)
            const newCostDelta = currentProject.runningCostDelta - currentDecision.approvedOption.costImpact;

            // 4. Prepare the updates

            // Update the Decision Card - revert to Pending
            const decisionUpdate = {
                status: 'Pending' as DecisionStatus,
                approvedOption: null,
                approvalMetadata: null,
            };
            
            // Update the Project Document
            const projectUpdate = {
                runningCostDelta: newCostDelta,
            };

            // 5. Commit the updates within the transaction
            transaction.update(decisionRef, decisionUpdate);
            transaction.update(projectRef, projectUpdate);
            
            console.log(`Transaction Success: Rejected decision ${cardId}. New Project Delta: $${newCostDelta}.`);
        });
    } catch (e) {
        console.error("Firestore Transaction Failed:", e);
        throw new Error(`Rejection failed: ${e instanceof Error ? e.message : String(e)}`);
    }
};

/**
 * Resets the demo by deleting all user-created projects and resetting to mock data.
 * @returns A promise that resolves when the reset is complete.
 */
export const resetDemoData = async (): Promise<void> => {
    if (!db) {
        throw new Error("Firestore DB not initialized.");
    }

    try {
        // Get all projects
        const projectsRef = getCollectionRef('projects');
        if (!projectsRef) {
            throw new Error("Could not get projects collection reference");
        }

        const projectsSnapshot = await getDocs(projectsRef);
        
        console.log(`[Reset] Found ${projectsSnapshot.docs.length} projects to delete`);

        // Delete all projects (this will cascade delete subcollections if set up in Firestore)
        for (const projectDoc of projectsSnapshot.docs) {
            // Get all decisions for this project
            const decisionsRef = collection(db as Firestore, getPublicCollectionPath('projects'), projectDoc.id, 'decisions');
            const decisionsSnapshot = await getDocs(decisionsRef);

            // Delete all decision cards
            for (const decisionDoc of decisionsSnapshot.docs) {
                await deleteDoc(decisionDoc.ref);
                console.log(`[Reset] Deleted decision: ${projectDoc.id}/${decisionDoc.id}`);
            }

            // Delete the project
            await deleteDoc(projectDoc.ref);
            console.log(`[Reset] Deleted project: ${projectDoc.id}`);
        }

        console.log(`[Reset] Demo reset complete. All user-created projects and decisions deleted.`);
    } catch (e) {
        console.error("[Reset] Error resetting demo data:", e);
        throw new Error(`Reset failed: ${e instanceof Error ? e.message : String(e)}`);
    }
};