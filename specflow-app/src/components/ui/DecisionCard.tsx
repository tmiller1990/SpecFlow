import React from 'react';
import { Loader2, X } from 'lucide-react';
import type { IDecisionCard, IOption } from '../../data/interfaces';
import { Button } from './Button';
import { getStatusStyles, formatCost } from './utils';

interface DecisionCardProps {
    card: IDecisionCard;
    isClient: boolean;
    isDesigner: boolean;
    isApproving: boolean;
    isRejecting: boolean;
    onApprove: (cardId: string, option: IOption) => void;
    onReject: (cardId: string) => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({ 
    card, 
    isClient, 
    isDesigner,
    isApproving, 
    isRejecting,
    onApprove,
    onReject 
}) => {
    const { icon, color, text } = getStatusStyles(card.status);
    const approvedOptionName = card.approvedOption?.name;
    
    const handleApprove = (option: IOption) => {
        onApprove(card.id, option);
    };

    const handleReject = () => {
        if (window.confirm('Are you sure you want to undo this approval? The decision will return to Pending status.')) {
            onReject(card.id);
        }
    };

    return (
        <div className="bg-white p-4 md:p-6 border border-gray-200 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 gap-2">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 line-clamp-1">{card.title} ({card.roomId})</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${color}`}>
                    {icon}
                    {text}
                </span>
            </div>
            
            <p className="text-sm md:text-base text-gray-600 mb-4">{card.description}</p>
            
            <div className="space-y-3">
                <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase">Options:</h3>
                {card.options.map((option, index) => (
                    <div 
                        key={index} 
                        className={`p-3 md:p-4 rounded-lg border flex flex-col md:flex-row md:justify-between md:items-center gap-2 ${option.name === approvedOptionName ? 'border-green-400 bg-green-50 shadow-inner' : 'border-gray-100 bg-gray-50'}`}
                    >
                        <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm md:text-base">{option.name}</p>
                            <a href={option.vendorLink} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 underline">
                                View Vendor Link
                            </a>
                        </div>
                        <div className="text-right flex items-center flex-wrap md:flex-nowrap gap-2">
                            <span className="text-sm text-gray-700">{formatCost(option.costImpact)}</span>
                            {isClient && card.status === 'Pending' && (
                                <Button 
                                    onClick={() => handleApprove(option)} 
                                    disabled={isApproving}
                                    className="ml-0 md:ml-4 py-1 px-2 md:px-3 text-xs bg-indigo-500 hover:bg-indigo-600 whitespace-nowrap"
                                >
                                    {isApproving ? (
                                        <Loader2 className="w-3 h-3 animate-spin inline-block" />
                                    ) : (
                                        'Approve'
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {card.status === 'Approved' && card.approvedOption && (
                 <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <p className="text-sm text-green-700 font-semibold">
                        Final Selection: {card.approvedOption.name} (Cost: {formatCost(card.approvedOption.costImpact)})
                    </p>
                    {isDesigner && (
                        <Button 
                            onClick={handleReject} 
                            disabled={isRejecting}
                            className="py-1 px-3 text-xs bg-red-500 hover:bg-red-600"
                        >
                            {isRejecting ? (
                                <Loader2 className="w-3 h-3 animate-spin inline-block" />
                            ) : (
                                <>
                                    <X className="w-3 h-3 inline-block mr-1" />
                                    Undo
                                </>
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
