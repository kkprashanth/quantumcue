/**
 * New Project Wizard Step 6: Completed
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, LayoutDashboard, EyeIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useModelByTrainingJob } from '../../hooks/useModels';

interface NewProjectWizardStep6CompletedProps {
    jobId?: string;
}

export const NewProjectWizardStep6Completed: React.FC<NewProjectWizardStep6CompletedProps> = ({ jobId }) => {
    const navigate = useNavigate();
    const { data: model } = useModelByTrainingJob(jobId || null);

    return (
        <div className="py-6 animate-fade-in text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="relative bg-white dark:bg-surface rounded-2xl p-8 border border-gray-400 shadow-sm overflow-hidden h-full flex flex-col justify-center items-center text-center">

                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.2] dark:opacity-[0.15] pointer-events-none z-0">
                        <div className="relative">
                            <div className="absolute inset-0 bg-success-500/20 rounded-full blur-xl animate-pulse-slow"></div>
                            <CheckCircle2 className="w-72 h-72 text-success-500" strokeWidth={1} />
                        </div>
                    </div>

                    <div className="relative z-10 max-w-md space-y-6 flex flex-col items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-6 leading-tight">
                                Project Created Successfully!
                            </h2>
                            <p className="text-text-secondary text-lg leading-relaxed">
                                Your quantum computing job has been submitted and is being processed.
                                You can check the status by navigating to project details page.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 max-w-sm pt-4 text-left">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-navy-600 mt-0.5">1</div>
                                <p className="text-sm text-text-secondary">Job enters the quantum provider's queue</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-navy-600 mt-0.5">2</div>
                                <p className="text-sm text-text-secondary">Execution on quantum hardware or simulator</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-navy-600 mt-0.5">3</div>
                                <p className="text-sm text-text-secondary">Result analysis and visualization generation</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-elevated rounded-2xl p-8 border border-gray-400 shadow-sm h-full flex flex-col justify-between items-center text-center">
                    <div className="flex flex-col items-center w-full max-w-sm mt-[27px]">
                        <h3 className="text-3xl font-bold text-text-primary mb-6 flex items-center justify-center gap-2">
                            Summary & Actions
                        </h3>

                        {/* {jobId && (
                            <div className="mb-8 p-4 bg-white dark:bg-surface rounded-xl border border-border-primary w-full">
                                <p className="text-[10px] text-text-tertiary mb-1 uppercase font-bold tracking-wider text-center">Project Reference ID</p>
                                <p className="text-sm font-code text-navy-600 dark:text-navy-400 font-medium break-all text-center">{jobId}</p>
                            </div>
                        )} */}

                        <div className="space-y-4 w-full">
                            <p className="text-sm text-text-secondary font-medium px-1 text-center">What would you like to do next?</p>
                            <div className="flex flex-col gap-3 w-full">
                                {jobId && (
                                    <Button
                                        onClick={() => {
                                            if (model?.id) {
                                                navigate(`/models/${model.id}?tour=true`);
                                            } else {
                                                navigate(`/jobs/${jobId}`);
                                            }
                                        }}
                                        disabled={!model?.id}
                                        title={!model?.id ? "Waiting for model creation..." : ""}
                                        className="w-full justify-center h-12 text-base"
                                        variant="luxury"
                                    >
                                        <span className="flex items-center">
                                            <EyeIcon className="mr-2 w-5 h-5" />
                                            {model?.id ? "View Model Details" : "Creating Model..."}
                                        </span>
                                    </Button>
                                )}
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full justify-center h-12 text-base border-gray-700"
                                >
                                    <span className="flex items-center flex-row">
                                        <LayoutDashboard className="mr-2 w-5 h-5" />
                                        Go to Dashboard
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NewProjectWizardStep6Completed;
