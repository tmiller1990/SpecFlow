import React, { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { IProject } from '../../data/interfaces';
import { getCollectionRef } from '../../firestore';
import { useAuthContext } from '../context';
import { ProjectCard } from '../ui';
import { NewProjectForm } from './NewProjectForm';
import { onSnapshot } from 'firebase/firestore';

interface ProjectListProps {
    onSelectProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject }) => {
    const { user, dbInstance, appId } = useAuthContext();
    const [projects, setProjects] = useState<IProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewProjectForm, setShowNewProjectForm] = useState(false);

    // Fetch projects based on user membership
    useEffect(() => {
        if (!dbInstance || !user) {
            return;
        }

        const projectsRef = getCollectionRef('projects');
        if (!projectsRef) {
            return;
        }

        // Fetch all projects and filter by membership
        const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
            const projectData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() as Omit<IProject, 'id'> }))
                .filter(p => p.members?.[user.uid]);
            setProjects(projectData as IProject[]);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching projects:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [dbInstance, user]);

    if (loading) {
        return (
            <div className="text-center p-8">
                <Loader2 className="animate-spin inline-block mr-2" /> Loading Projects...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto">
                <div className="p-4 md:p-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 gap-4">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Projects ({user?.role === 'gc' ? 'GC' : user?.role?.toUpperCase()})</h1>
                        {user?.role === 'designer' && (
                            <button
                                onClick={() => setShowNewProjectForm(true)}
                                className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" />
                                New Project
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {projects.length > 0 ? (
                            projects.map(project => (
                                <ProjectCard key={project.id} project={project} onSelect={onSelectProject} />
                            ))
                        ) : (
                            <p className="text-gray-500 col-span-full text-sm md:text-base">No projects found. Click "New Project" to create one, or mock data creation may have failed.</p>
                        )}
                    </div>
                    <p className="mt-8 md:mt-10 text-xs md:text-sm text-gray-500">
                        App ID: <code className="bg-gray-100 p-1 rounded text-xs">{appId?.substring(0, 12)}</code>
                    </p>

                    {/* New Project Form Modal */}
                    {showNewProjectForm && (
                        <NewProjectForm
                            onSuccess={() => setShowNewProjectForm(false)}
                            onCancel={() => setShowNewProjectForm(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
