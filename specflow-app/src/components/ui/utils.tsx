import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import type { DecisionStatus } from '../../data/interfaces';

export interface StatusStyle {
    icon: React.ReactElement;
    color: string;
    text: string;
}

export const getStatusStyles = (status: DecisionStatus): StatusStyle => {
    switch (status) {
        case 'Approved':
            return { 
                icon: <CheckCircle className="w-4 h-4 mr-1" />, 
                color: 'text-green-600 bg-green-100', 
                text: 'Approved' 
            };
        case 'Rejected':
            return { 
                icon: <XCircle className="w-4 h-4 mr-1" />, 
                color: 'text-red-600 bg-red-100', 
                text: 'Rejected' 
            };
        case 'Pending':
        default:
            return { 
                icon: <Clock className="w-4 h-4 mr-1" />, 
                color: 'text-yellow-600 bg-yellow-100', 
                text: 'Pending' 
            };
    }
};

export const formatCost = (cost: number): React.ReactElement => {
    const isNegative = cost < 0;
    const absCost = Math.abs(cost);
    const sign = isNegative ? '−' : '+';
    const color = cost === 0 ? 'text-gray-500' : isNegative ? 'text-red-500' : 'text-green-500';

    return (
        <span className={`${color} font-mono font-semibold`}>
            {cost === 0 ? '±$0' : `${sign}$${absCost.toLocaleString()}`}
        </span>
    );
};
