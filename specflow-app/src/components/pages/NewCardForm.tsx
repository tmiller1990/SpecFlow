import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { IOption } from '../../data/interfaces';
import { setDoc } from 'firebase/firestore';
import { getDecisionDocRef } from '../../firestore';

interface NewCardFormProps {
    projectId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

interface FormOption {
    name: string;
    vendorLink: string;
    costImpact: number;
}

export const NewCardForm: React.FC<NewCardFormProps> = ({ projectId, onSuccess, onCancel }) => {
    const [roomId, setRoomId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState<FormOption[]>([
        { name: '', vendorLink: '', costImpact: 0 }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleAddOption = useCallback(() => {
        setOptions([...options, { name: '', vendorLink: '', costImpact: 0 }]);
    }, [options]);

    const handleRemoveOption = useCallback((index: number) => {
        if (options.length > 1) {
            setOptions(options.filter((_, i) => i !== index));
        }
    }, [options]);

    const handleOptionChange = useCallback((index: number, field: keyof FormOption, value: string | number) => {
        const updated = [...options];
        if (field === 'costImpact') {
            updated[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
        } else {
            updated[index][field] = value as string;
        }
        setOptions(updated);
    }, [options]);

    const validateForm = (): boolean => {
        if (!roomId.trim()) {
            setError('Room ID is required');
            return false;
        }
        if (!title.trim()) {
            setError('Title is required');
            return false;
        }
        if (!description.trim()) {
            setError('Description is required');
            return false;
        }
        if (options.length === 0) {
            setError('At least one option is required');
            return false;
        }
        for (const option of options) {
            if (!option.name.trim()) {
                setError('All option names are required');
                return false;
            }
            if (!option.vendorLink.trim()) {
                setError('All vendor links are required');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Generate a unique ID for the decision card (using timestamp)
            const cardId = `decision-${Date.now()}`;
            
            const decisionRef = getDecisionDocRef(projectId, cardId);
            if (!decisionRef) {
                setError('Failed to get decision reference');
                setIsSubmitting(false);
                return;
            }

            const cardData = {
                projectId,
                roomId,
                title,
                description,
                status: 'Pending' as const,
                options: options as IOption[],
                approvedOption: null,
                approvalMetadata: null,
            };

            await setDoc(decisionRef, cardData);
            console.log('[NewCardForm] Successfully created decision card:', cardId);
            setIsSubmitting(false);
            onSuccess();
        } catch (err) {
            console.error('[NewCardForm] Error creating decision card:', err);
            setError(err instanceof Error ? err.message : 'Failed to create decision card');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Decision Card</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Room ID */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Room ID *
                        </label>
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="e.g., Living Room, Master Bedroom"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Decision Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Flooring Material Selection"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the decision and its impact on the project..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Options *
                        </label>
                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Option name"
                                                value={option.name}
                                                onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                disabled={isSubmitting}
                                            />
                                            <input
                                                type="url"
                                                placeholder="Vendor link (URL)"
                                                value={option.vendorLink}
                                                onChange={(e) => handleOptionChange(index, 'vendorLink', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                disabled={isSubmitting}
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Cost Impact: $</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={option.costImpact}
                                                    onChange={(e) => handleOptionChange(index, 'costImpact', e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                        {options.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOption(index)}
                                                className="text-red-500 hover:text-red-700 transition-colors mt-2"
                                                disabled={isSubmitting}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleAddOption}
                            className="mt-3 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
                            disabled={isSubmitting}
                        >
                            <Plus className="w-5 h-5" />
                            Add Option
                        </button>
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
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Card'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
