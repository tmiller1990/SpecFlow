import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { IProject } from '../../data/interfaces';
import { useAuthContext } from '../context';
import { formatCost } from './utils';

interface ProjectCardProps {
    project: IProject;
    onSelect: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
    const { user } = useAuthContext();
    const userRole = user?.role || 'client';

    return (
        <div 
            onClick={() => {
                console.log(`[ProjectCard] Navigating to project:`, { id: project.id, name: project.name });
                onSelect(project.id);
            }}
            className="bg-white p-4 md:p-6 border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between active:scale-95 md:active:scale-100"
        >
            <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 line-clamp-2">{project.name}</h2>
                <p className="text-xs md:text-sm text-indigo-600 font-medium uppercase tracking-wider">
                    Role: {userRole}
                </p>
            </div>
            <div className="mt-4 flex justify-between items-center">
                <span className="text-base md:text-xl font-extrabold text-gray-800">
                    Cost Delta: {formatCost(project.runningCostDelta)}
                </span>
                <ArrowRight className="text-gray-400 w-4 md:w-5 h-4 md:h-5" size={20} />
            </div>
        </div>
    );
};
