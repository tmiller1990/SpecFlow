import React, { useState, useEffect } from 'react';
import { Loader2, FileDown } from 'lucide-react';
import type { IDecisionCard } from '../../data/interfaces';
import { getDecisionCollectionRef } from '../../firestore';
import { onSnapshot } from 'firebase/firestore';
import { formatCost } from '../ui/utils';

interface SpecBookViewProps {
    projectId: string;
}

export const SpecBookView: React.FC<SpecBookViewProps> = ({ projectId }) => {
    const [approvedCards, setApprovedCards] = useState<IDecisionCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const decisionRef = getDecisionCollectionRef(projectId);
        if (!decisionRef) {
            return;
        }

        const unsubscribe = onSnapshot(decisionRef, (snapshot) => {
            const cards = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data() as Omit<IDecisionCard, 'id'>
                }))
                .filter(card => card.status === 'Approved' && card.approvedOption)
                .sort((a, b) => a.roomId.localeCompare(b.roomId));

            console.log('[SpecBookView] Loaded approved materials:', cards.length);
            setApprovedCards(cards as IDecisionCard[]);
            setLoading(false);
        }, (error) => {
            console.error('[SpecBookView] Error fetching cards:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    const handleExportAuditLog = () => {
        const auditLog = {
            exportDate: new Date().toISOString(),
            projectId,
            totalApprovedMaterials: approvedCards.length,
            materials: approvedCards.map(card => ({
                room: card.roomId,
                decision: card.title,
                description: card.description,
                selectedMaterial: card.approvedOption?.name,
                vendorLink: card.approvedOption?.vendorLink,
                costImpact: card.approvedOption?.costImpact,
                approvalMetadata: {
                    approvedBy: card.approvalMetadata?.approvedBy,
                    approvedAt: new Date(card.approvalMetadata?.approvedAt || 0).toISOString(),
                    finalCostImpact: card.approvalMetadata?.finalCostImpact,
                }
            })),
            totalCostImpact: approvedCards.reduce((sum, card) => 
                sum + (card.approvedOption?.costImpact || 0), 0
            ),
        };

        console.log('[SpecBookView] Audit Log:', auditLog);
        
        // Also download as JSON file
        const jsonString = JSON.stringify(auditLog, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-log-${projectId}-${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="text-center p-8">
                <Loader2 className="animate-spin inline-block mr-2" />
                Loading specifications...
            </div>
        );
    }

    if (approvedCards.length === 0) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <p className="text-gray-600">No approved materials yet. Approve some decision cards to see them here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Specification Book</h2>
                <button
                    onClick={handleExportAuditLog}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                    <FileDown className="w-5 h-5" />
                    Export Audit Log
                </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                    <strong>Total Approved Materials:</strong> {approvedCards.length} |
                    <strong className="ml-4">Total Cost Impact:</strong> {formatCost(
                        approvedCards.reduce((sum, card) => sum + (card.approvedOption?.costImpact || 0), 0)
                    )}
                </p>
            </div>

            <div className="grid gap-6">
                {approvedCards.map((card) => (
                    <div key={card.id} className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{card.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    <strong>Room:</strong> {card.roomId}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-indigo-600">
                                    {formatCost(card.approvedOption?.costImpact || 0)}
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-4">{card.description}</p>

                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                            <p className="text-sm font-semibold text-indigo-900 mb-2">Selected Material:</p>
                            <p className="text-lg font-bold text-indigo-700 mb-2">
                                {card.approvedOption?.name}
                            </p>
                            {card.approvedOption?.vendorLink && (
                                <a
                                    href={card.approvedOption.vendorLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                                >
                                    View Vendor Link
                                </a>
                            )}
                        </div>

                        {card.approvalMetadata && (
                            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 space-y-1">
                                <p>
                                    <strong>Approved by:</strong> {card.approvalMetadata.approvedBy}
                                </p>
                                <p>
                                    <strong>Approved on:</strong> {new Date(card.approvalMetadata.approvedAt).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
