/**
 * Job creation page with multi-step wizard.
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { JobWizard, type JobWizardData } from '../../components/jobs';
import { useCreateJob } from '../../hooks/useJobs';
import { uploadDataset, processDataset } from '../../api/endpoints/datasets';
import { getProviderConfigurationDefaults } from '../../api/endpoints/providerConfigurations';
import { Button } from '../../components/ui/Button';

export const JobCreateWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDatasetId = searchParams.get('dataset_id');
  const createJob = useCreateJob();
  const [navigationHandlers, setNavigationHandlers] = useState<{
    handleNext: () => void;
    handleBack: () => void;
    handleSubmit: () => Promise<void>;
    canProceed: () => boolean;
    currentStep: number;
    totalSteps: number;
  } | null>(null);

  const handleComplete = async (wizardData: JobWizardData) => {
    try {
      // Merge defaults with user-provided parameters before submission
      let finalParameters = wizardData.parameters || {};
      
      if (wizardData.provider_id) {
        try {
          const defaults = await getProviderConfigurationDefaults(
            wizardData.provider_id,
            wizardData.dataset_id || undefined
          );
          
          // Merge defaults with user-provided parameters
          // User-provided values take precedence over defaults
          finalParameters = {
            ...defaults.values,
            ...finalParameters,
          };
        } catch (error) {
          // If defaults can't be fetched, continue with user-provided parameters
          console.warn('Failed to fetch provider defaults, using provided parameters only:', error);
        }
      }

      // Create the job
      const job = await createJob.mutateAsync({
        name: wizardData.name,
        description: wizardData.description || undefined,
        job_type: wizardData.job_type,
        provider_id: wizardData.provider_id || undefined,
        dataset_id: wizardData.dataset_id || undefined,
        priority: wizardData.priority,
        shot_count: wizardData.shot_count,
        optimization_level: wizardData.optimization_level,
        qubit_count_requested: wizardData.qubit_count_requested || undefined,
        parameters: finalParameters,
        input_data_type: wizardData.input_data_type || undefined,
        input_data_ref: wizardData.input_data_ref || undefined,
        cost_min_est: wizardData.cost_min_est || undefined,
        cost_max_est: wizardData.cost_max_est || undefined,
      });

      // If there's an uploaded file and a dataset ID, upload it
      if (wizardData.uploadedFile && job.dataset_id) {
        console.log('Uploading file for job dataset:', job.dataset_id);
        await uploadDataset(job.dataset_id, wizardData.uploadedFile);
        
        // Trigger processing
        try {
          console.log('Triggering processing for job dataset:', job.dataset_id);
          await processDataset(job.dataset_id, {});
        } catch (error) {
          console.warn('Process trigger failed (expected for non-zip files):', error);
        }
      }

      // Cost estimates are included in the initial create request
      // No need for separate update

      // Navigate to job detail page
      navigate(`/jobs/${job.id}`);
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/jobs');
  };

  return (
    <PageContainer
      title="Create New Job"
      description="Follow the steps to configure and submit your quantum computing job"
      action={
        navigationHandlers ? (
          <div className="flex items-center gap-3">
            {navigationHandlers.currentStep > 1 && (
              <Button variant="secondary" onClick={navigationHandlers.handleBack} size="sm">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            {navigationHandlers.currentStep < navigationHandlers.totalSteps ? (
              <Button 
                onClick={navigationHandlers.handleNext} 
                disabled={!navigationHandlers.canProceed()}
                size="sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={navigationHandlers.handleSubmit} 
                disabled={!navigationHandlers.canProceed()}
                size="sm"
              >
                Submit Job
              </Button>
            )}
          </div>
        ) : null
      }
    >
      <JobWizard 
        onComplete={handleComplete} 
        onCancel={handleCancel}
        preselectedDatasetId={preselectedDatasetId || undefined}
        onNavigationReady={setNavigationHandlers}
      />
    </PageContainer>
  );
};

export default JobCreateWizard;
