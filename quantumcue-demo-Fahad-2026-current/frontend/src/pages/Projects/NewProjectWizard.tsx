/**
 * New Project Wizard page for first-time users.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { NewProjectWizard, type NewProjectWizardData } from '../../components/projects/NewProjectWizard';
import { submitNewProject } from '../../api/endpoints/projects';
import { submitJob } from '../../api/endpoints/jobs';
import { uploadDataset, processDataset } from '../../api/endpoints/datasets';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { isNewUser } from '../../utils/user';

export const NewProjectWizardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navigationHandlers, setNavigationHandlers] = useState<{
    handleNext: () => void;
    handleBack: () => void;
    handleSubmit: () => Promise<void>;
    handleRestart: () => void;
    canProceed: () => boolean;
    currentStep: number;
    totalSteps: number;
  } | null>(null);



  const handleComplete = async (wizardData: NewProjectWizardData) => {
    setIsSubmitting(true);
    try {
      const fileName = wizardData.uploadedFile?.name || 'uploaded_file';

      // Submit to new project endpoint
      const job = await submitNewProject({
        name: wizardData.name,
        description: wizardData.description || undefined,
        job_type: wizardData.job_type,
        provider_id: wizardData.provider_id!,
        priority: wizardData.priority,
        shot_count: wizardData.shot_count,
        optimization_level: wizardData.optimization_level,
        qubit_count_requested: wizardData.qubit_count_requested || undefined,
        parameters: wizardData.parameters || undefined,
        file_name: fileName,
        file_format: wizardData.fileFormat || undefined,
        file_size: wizardData.fileSize || undefined,
        dataset_id: wizardData.dataset_id || undefined,
        classes: wizardData.classes,
        num_of_classes: wizardData.num_of_classes,
      });

      // If there's an uploaded file, upload it to the dataset
      if (wizardData.uploadedFile && job.dataset_id) {
        console.log('Uploading file for dataset:', job.dataset_id);
        await uploadDataset(job.dataset_id, wizardData.uploadedFile);
        
        // Trigger processing (even if it's not a zip, the backend will handle status)
        try {
          console.log('Triggering processing for dataset:', job.dataset_id);
          await processDataset(job.dataset_id, {});
        } catch (error) {
          console.warn('Process trigger failed (expected for non-zip files):', error);
        }
      }

      // Explicitly submit the job now that the dataset is uploaded
      try {
        console.log('Submitting job:', job.id);
        await submitJob(job.id);
      } catch (error) {
        console.error('Job submission failed:', error);
        // We continue in the wizard even if submission fails, 
        // the user can manually submit it from the UI later if needed.
      }

      // Return the job ID to the wizard
      return job.id;

    } catch (error) {
      console.error('Failed to create project:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };



  return (
    <PageContainer
      title="Create New Project"
      action={
        navigationHandlers ? (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              variant='ghost'
              className="hover:bg-blue-500"
            >
              Restart
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : null
      }
    >
      <div className="mt-10">
        <NewProjectWizard
          onComplete={handleComplete}
          onCancel={handleCancel}
          onNavigationReady={setNavigationHandlers}
          navigationHandlers={navigationHandlers}
          isSubmitting={isSubmitting}
        />
      </div>
    </PageContainer>
  );
};

export default NewProjectWizardPage;
