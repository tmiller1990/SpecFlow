import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { IDecisionCard, IOption } from '../../data/interfaces';
import { getDecisionCollectionRef, approveDecisionCardTransaction, rejectDecisionCardTransaction } from '../../firestore';
import { useAuthContext } from '../context';
import { DecisionCard } from '../ui';
import { onSnapshot } from 'firebase/firestore';

interface AllDecisionsViewProps {
    projectId: string;
    onDecisionApproved: () => void;
}

export const AllDecisionsView: React.FC<AllDecisionsViewProps> = ({ projectId, onDecisionApproved }) => {
    const { user } = useAuthContext();
    const [allDecisions, setAllDecisions] = useState<IDecisionCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingCardId, setApprovingCardId] = useState<string | null>(null);
    const [rejectingCardId, setRejectingCardId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved'>('all');

    const isClient = user?.role === 'client';
    const isDesigner = user?.role === 'designer';

    useEffect(() => {
        const decisionRef = getDecisionCollectionRef(projectId);
        if (!decisionRef) {
            return;
        }

        const unsubscribe = onSnapshot(decisionRef, (snapshot) => {
            const cardData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Omit<IDecisionCard, 'id'>
            })) as IDecisionCard[];
            
            setAllDecisions(cardData);
            setLoading(false);
            
            // Reset approving state if the approved card status changed
            if (approvingCardId) {
                const approvedCard = cardData.find(c => c.id === approvingCardId);
                if (approvedCard && approvedCard.status !== 'Pending') {
                    setApprovingCardId(null);
                }
            }
        }, (error) => {
            console.error("Error fetching decision cards:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId, approvingCardId]);

    const handleApproveCard = async (cardId: string, option: IOption) => {
        setApprovingCardId(cardId);
        try {
            if (!user?.uid) {
                throw new Error('User not authenticated');
            }
            await approveDecisionCardTransaction(projectId, cardId, option, user.uid);
            onDecisionApproved();
        } catch (error) {
            console.error('Failed to approve decision:', error);
            alert(`Approval failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setApprovingCardId(null);
        }
    };

    const handleRejectCard = async (cardId: string) => {
        setRejectingCardId(cardId);
        try {
            if (!user?.uid) {
                throw new Error('User not authenticated');
            }
            await rejectDecisionCardTransaction(projectId, cardId);
            onDecisionApproved();
        } catch (error) {
            console.error('Failed to reject decision:', error);
            alert(`Rejection failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setRejectingCardId(null);
        }
    };

    const filteredCards = allDecisions.filter(card => {
        if (activeFilter === 'pending') return card.status === 'Pending';
        if (activeFilter === 'approved') return card.status === 'Approved';
        return true; // 'all'
    });

    const pendingCount = allDecisions.filter(c => c.status === 'Pending').length;
    const approvedCount = allDecisions.filter(c => c.status === 'Approved').length;

    if (loading) {
        return <div className="text-center p-8"><Loader2 className="animate-spin inline-block mr-2" /> Loading decisions...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-4 border-b border-gray-200 pb-3">
                <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                        activeFilter === 'all'
                            ? 'bg-gray-100 text-indigo-600'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    All ({allDecisions.length})
                </button>
                <button
                    onClick={() => setActiveFilter('pending')}
                    className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                        activeFilter === 'pending'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Pending ({pendingCount})
                </button>
                <button
                    onClick={() => setActiveFilter('approved')}
                    className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                        activeFilter === 'approved'
                            ? 'bg-green-50 text-green-700'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Approved ({approvedCount})
                </button>
            </div>

            {/* Cards */}
            {filteredCards.length > 0 ? (
                <div className="space-y-4">
                    {filteredCards.map(card => (
                        <DecisionCard
                            key={card.id}
                            card={card}
                            isClient={isClient}
                            isDesigner={isDesigner}
                            isApproving={approvingCardId === card.id}
                            isRejecting={rejectingCardId === card.id}
                            onApprove={handleApproveCard}
                            onReject={handleRejectCard}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">
                        {activeFilter === 'pending' && 'No pending decisions'}
                        {activeFilter === 'approved' && 'No approved decisions'}
                        {activeFilter === 'all' && 'No decisions yet'}
                    </p>
                </div>
            )}
        </div>
    );
};
