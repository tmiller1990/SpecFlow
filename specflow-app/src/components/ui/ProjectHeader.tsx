import React from 'react';
import { DollarSign, Users } from 'lucide-react';
import type { IProject } from '../../data/interfaces';
import { useAuthContext } from '../context';
import { formatCost } from './utils';

interface ProjectHeaderProps {
    project: IProject;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
    const { user } = useAuthContext();
    const userRole = user?.role === 'gc' ? 'GC' : (user?.role || 'Client').charAt(0).toUpperCase() + (user?.role || 'client').slice(1);

    const costColor = project.runningCostDelta >= 0 ? 'text-green-600' : 'text-red-600';

    return (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-xl border border-white/20 mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{project.name}</h1>
                    <p className="text-xs md:text-sm font-medium text-indigo-600 uppercase tracking-wider mt-1">
                        Role: {userRole}
                    </p>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-sm md:text-lg font-medium text-gray-500">Approved Budget Change:</p>
                    <p className={`text-2xl md:text-4xl font-extrabold ${costColor} leading-none mt-1`}>
                        {formatCost(project.runningCostDelta)}
                    </p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:space-x-6 gap-3 md:gap-0 text-xs md:text-sm text-gray-500">
                <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {Object.keys(project.members).length} Members</span>
                <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" /> Initial Budget: <span className="text-gray-500 font-mono font-semibold ml-1">${project.initialBudget.toLocaleString()}</span></span>
            </div>
        </div>
    );
};
