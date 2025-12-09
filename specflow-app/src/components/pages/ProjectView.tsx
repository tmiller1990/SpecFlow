import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import type { IProject } from '../../data/interfaces';
import { getProjectDocRef } from '../../firestore';
import { useAuthContext } from '../context';
import { ProjectHeader, Button } from '../ui';
import { AllDecisionsView } from './AllDecisionsView';
import { NewCardForm } from './NewCardForm';
import { SpecBookView } from './SpecBookView';
import { onSnapshot } from 'firebase/firestore';

interface ProjectViewProps {
    projectId: string;
    onBack: () => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ projectId, onBack }) => {
    const { user } = useAuthContext();
    const [project, setProject] = useState<IProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [showNewCardForm, setShowNewCardForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'decisions' | 'specs'>('decisions');

    const canCreateCard = user?.role === 'designer' || user?.role === 'gc';

    useEffect(() => {
        if (!projectId) {
            console.log('[ProjectView] Missing projectId');
            return;
        }

        console.log('[ProjectView] Fetching project:', projectId);
        const projectRef = getProjectDocRef(projectId);
        
        if (!projectRef) {
            console.error('[ProjectView] Could not get project ref');
            return;
        }

        const unsubscribe = onSnapshot(projectRef, (snapshot) => {
            console.log('[ProjectView] Snapshot received for', projectId, '- exists:', snapshot.exists(), 'data:', snapshot.data());
            if (snapshot.exists()) {
                const data = snapshot.data();
                setProject({
                    id: snapshot.id,
                    ...data as Omit<IProject, 'id'>
                } as IProject);
            } else {
                console.warn('[ProjectView] Document does not exist:', projectId);
                setProject(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching project:", error);
            setProject(null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    const handleDecisionApproved = () => {
        // Refresh project on decision approval
        if (!projectId) return;
        const projectRef = getProjectDocRef(projectId);
        if (!projectRef) return;
        
        onSnapshot(projectRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setProject({
                    id: snapshot.id,
                    ...data as Omit<IProject, 'id'>
                } as IProject);
            }
        });
    };

    if (loading) {
        return (
            <div className="text-center p-8">
                <Loader2 className="animate-spin inline-block mr-2" /> Loading project details...
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900">Project not found</h1>
                <Button onClick={onBack} className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <Button onClick={onBack} className="m-6 mb-0">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
                </Button>
                <div className="p-6">
                    <ProjectHeader project={project} />
                    
                    {/* Tabs and Action Button */}
                    <div className="mt-8 flex justify-between items-center">
                        <div className="flex gap-4 border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('decisions')}
                                className={`pb-3 px-2 font-semibold transition-colors ${
                                    activeTab === 'decisions'
                                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                All Decisions
                            </button>
                            <button
                                onClick={() => setActiveTab('specs')}
                                className={`pb-3 px-2 font-semibold transition-colors ${
                                    activeTab === 'specs'
                                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Specification Book
                            </button>
                        </div>
                        
                        {canCreateCard && (
                            <button
                                onClick={() => setShowNewCardForm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                            >
                                <Plus className="w-5 h-5" />
                                New Decision Card
                            </button>
                        )}
                    </div>

                    {/* Tab Content */}
                    <div className="mt-6">
                        {activeTab === 'decisions' && (
                            <AllDecisionsView projectId={projectId} onDecisionApproved={handleDecisionApproved} />
                        )}
                        {activeTab === 'specs' && (
                            <SpecBookView projectId={projectId} />
                        )}
                    </div>
                </div>
            </div>

            {/* New Card Form Modal */}
            {showNewCardForm && (
                <NewCardForm
                    projectId={projectId}
                    onSuccess={() => {
                        setShowNewCardForm(false);
                        setActiveTab('decisions'); // Switch to decisions tab after creating
                    }}
                    onCancel={() => setShowNewCardForm(false)}
                />
            )}
        </div>
    );
};
