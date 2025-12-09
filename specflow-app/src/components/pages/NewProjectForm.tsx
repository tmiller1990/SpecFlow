import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { IProject } from '../../data/interfaces';
import { setDoc } from 'firebase/firestore';
import { getProjectDocRef } from '../../firestore';
import { useAuthContext } from '../context';

interface NewProjectFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const NewProjectForm: React.FC<NewProjectFormProps> = ({ onSuccess, onCancel }) => {
    const { userId } = useAuthContext();
    const [projectName, setProjectName] = useState('');
    const [initialBudget, setInitialBudget] = useState('100000');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const validateForm = (): boolean => {
        if (!projectName.trim()) {
            setError('Project name is required');
            return false;
        }
        if (!initialBudget || parseFloat(initialBudget) <= 0) {
            setError('Initial budget must be greater than 0');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm() || !userId) {
            setError('Missing required information');
            return;
        }

        setIsSubmitting(true);

        try {
            // Generate a unique project ID from the project name (slugified)
            const projectId = projectName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 50) + `-${Date.now()}`;

            const projectRef = getProjectDocRef(projectId);
            if (!projectRef) {
                setError('Failed to create project reference');
                setIsSubmitting(false);
                return;
            }

            const newProject: IProject = {
                id: projectId,
                name: projectName,
                ownerId: userId,
                initialBudget: parseFloat(initialBudget),
                runningCostDelta: 0,
                members: {
                    [userId]: 'designer', // Current user is designer
                    'client-mock-uid': 'client', // Add mock client
                    'gc-mock-uid': 'gc', // Add mock GC
                },
            };

            await setDoc(projectRef, newProject);
            console.log('[NewProjectForm] Successfully created project:', projectId);
            setIsSubmitting(false);
            onSuccess();
        } catch (err) {
            console.error('[NewProjectForm] Error creating project:', err);
            setError(err instanceof Error ? err.message : 'Failed to create project');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Create New Project</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 md:w-6 h-5 md:h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g., Lake House Addition"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional: Describe the project scope..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Initial Budget */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Initial Budget ($) *
                        </label>
                        <input
                            type="number"
                            value={initialBudget}
                            onChange={(e) => setInitialBudget(e.target.value)}
                            placeholder="100000"
                            min="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            The initial budget serves as the baseline for tracking cost deltas
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                            <strong>Note:</strong> Mock team members (client, GC) will be automatically added to this project.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
