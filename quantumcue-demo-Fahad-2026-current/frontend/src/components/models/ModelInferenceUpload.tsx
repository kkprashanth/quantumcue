import { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, File, FileText, Image, Archive, Brain } from 'lucide-react';
import { usePredictModel, useUpdateInteractionFeedback, useModelRecommendations } from '@/hooks/useModels';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ModelRecommendations } from './ModelRecommendations';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import type { ModelInteraction, FeedbackType } from '@/types';

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#3b82f6'];

interface ModelInferenceUploadProps {
  modelId: string;
  modelClassifications?: string[] | null;
  onPredictionComplete?: (interaction: ModelInteraction) => void;
}

export function ModelInferenceUpload({
  modelId,
  modelClassifications,
  onPredictionComplete,
}: ModelInferenceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<ModelInteraction | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [correctedClassification, setCorrectedClassification] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [recommendationsShown, setRecommendationsShown] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const predictMutation = usePredictModel();
  const updateFeedbackMutation = useUpdateInteractionFeedback();

  // Get recommendations when prediction is made
  const outputData = predictionResult?.output_data as {
    prediction?: string;
    confidence?: number;
    class_probabilities?: Record<string, number>;
    latency_ms?: number;
    backend?: string;
    reasoning?: string;
  } | null;

  const predictionClassification = outputData?.prediction;
  const { data: recommendationsData } = useModelRecommendations(
    modelId,
    predictionClassification || ''
  );

  // Store recommendations when they're fetched
  useEffect(() => {
    if (recommendationsData?.recommendations) {
      setRecommendationsShown(recommendationsData.recommendations);
    }
  }, [recommendationsData]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPredictionResult(null);

      // Create preview URL for images only
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setPredictionResult(null);

      // Create preview URL for images only
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPredictionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-grey-500 dark:text-text-tertiary" />;
    } else if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
      return <Archive className="w-8 h-8 text-grey-500 dark:text-text-tertiary" />;
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      return <FileText className="w-8 h-8 text-grey-500 dark:text-text-tertiary" />;
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return <FileText className="w-8 h-8 text-grey-500 dark:text-text-tertiary" />;
    } else {
      return <File className="w-8 h-8 text-grey-500 dark:text-text-tertiary" />;
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) return;

    try {
      // Send the actual file for real inference
      const result = await predictMutation.mutateAsync({
        modelId,
        file: selectedFile,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      });
      setPredictionResult(result);

      // Extract classification from prediction for recommendations
      const prediction = (result.output_data as any)?.prediction;
      if (prediction) {
        // Store recommendations that will be shown
        // This will be updated when recommendations are fetched
      }

      onPredictionComplete?.(result);
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  const handleAccept = () => {
    setShowAcceptConfirm(true);
  };

  const handleAcceptConfirm = async () => {
    if (!predictionResult) return;

    try {
      await updateFeedbackMutation.mutateAsync({
        interactionId: predictionResult.id,
        data: {
          feedback_type: 'accepted',
          recommendations_shown: recommendationsShown,
        },
      });

      // Reset form and refresh
      resetForm();
      onPredictionComplete?.(predictionResult);
      setShowAcceptConfirm(false);
    } catch (error) {
      console.error('Failed to save feedback:', error);
      setShowAcceptConfirm(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPredictionResult(null);
    setShowFeedbackForm(false);
    setCorrectedClassification('');
    setFeedbackText('');
    setRecommendationsShown([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCorrect = () => {
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = async () => {
    if (!predictionResult || !correctedClassification.trim()) return;

    // Validate corrected classification against model classifications
    const validClassifications = modelClassifications || [];
    if (validClassifications.length > 0 && !validClassifications.includes(correctedClassification)) {
      alert(`Invalid classification. Please select one of: ${validClassifications.join(', ')}`);
      return;
    }

    try {
      const userFeedback = {
        corrected_classification: correctedClassification,
        feedback_text: feedbackText,
        original_prediction: (predictionResult.output_data as any)?.prediction,
      };

      await updateFeedbackMutation.mutateAsync({
        interactionId: predictionResult.id,
        data: {
          feedback_type: 'corrected',
          user_feedback: userFeedback,
          recommendations_shown: recommendationsShown,
        },
      });

      resetForm();
      onPredictionComplete?.(predictionResult);
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-gray-900">
          <Upload size={250} />
        </div>
        <div className="relative z-10 flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
            <Upload size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Upload Input File</h3>
        </div>

        {!selectedFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-grey-300 dark:border-border rounded-lg p-12 text-center hover:border-grey-400 dark:hover:border-border-subtle transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-grey-500 dark:text-text-tertiary" />
            <p className="text-grey-900 dark:text-text-primary mb-2">
              Drag and drop a file here, or click to select
            </p>
            <p className="text-sm text-grey-500 dark:text-text-tertiary">
              Supports ZIP, CSV, PDF, and images (PNG, JPEG, etc.)
            </p>
            <p className="text-xs text-grey-500 dark:text-text-tertiary mt-1">
              Multi-modal data with subdirectories supported via ZIP files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".zip,.csv,.pdf,image/*"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-grey-50 dark:bg-surface-elevated border border-grey-200 dark:border-border rounded-lg">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded shadow-sm"
                />
              )}
              {!previewUrl && selectedFile && (
                <div className="w-16 h-16 bg-white dark:bg-surface rounded shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(selectedFile)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-gray-900 dark:text-text-primary font-semibold truncate">{selectedFile.name}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>
                    {selectedFile.size < 1024
                      ? `${selectedFile.size} B`
                      : selectedFile.size < 1024 * 1024
                        ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                        : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="truncate">{selectedFile.type || 'Unknown file type'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleRemoveFile}
                className="p-2.5 hover:bg-gray-200 dark:hover:bg-surface rounded-lg transition-colors text-gray-400 hover:text-gray-700"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
              <Button
                onClick={handlePredict}
                isLoading={predictMutation.isPending}
                disabled={predictMutation.isPending}
                className="w-full md:w-auto px-6"
              >
                Run Prediction
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Prediction Results */}
      {predictionResult && outputData && (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
          <div className="relative z-10 flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success-50 border border-success-100 shadow-sm text-success-600">
                <CheckCircle2 size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Prediction Results</h3>
                <p className="text-sm text-gray-500 mt-0.5">Analysis complete. See detailed breakdown below.</p>
              </div>
            </div>
            {/* Metadata (now in header area) */}
            <div className="flex gap-4 text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
              {outputData.latency_ms && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-50"></span>
                  Latency: {outputData.latency_ms}ms
                </span>
              )}
              {outputData.backend && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  Backend: {outputData.backend}
                </span>
              )}
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Col (Primary Result) */}
            <div className="lg:col-span-5 flex flex-col justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100 h-full">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Primary Outcome</span>
              </div>
              <p className="text-4xl font-black text-gray-900 mb-2 truncate" title={outputData.prediction || 'Unknown'}>
                {outputData.prediction || 'Unknown'}
              </p>
              {outputData.confidence !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${outputData.confidence >= 0.8 ? 'bg-success-500' : outputData.confidence >= 0.5 ? 'bg-warning-500' : 'bg-error-500'}`}
                      style={{ width: `${Math.max(0, Math.min(100, outputData.confidence * 100))}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-gray-700">
                    {(outputData.confidence * 100).toFixed(1)}% Match
                  </p>
                </div>
              )}
            </div>

            {/* Middle Col (Confidence Radial) */}
            {outputData.confidence !== undefined && (
              <div className="lg:col-span-3 flex flex-col justify-center items-center py-6 h-full">
                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Confidence Score</span>
                <div className="relative h-36 w-36 flex flex-col items-center justify-center">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="75%"
                        outerRadius="100%"
                        barSize={10}
                        data={[{ name: 'Confidence', value: outputData.confidence * 100 }]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis
                          type="number"
                          domain={[0, 100]}
                          angleAxisId={0}
                          tick={false}
                        />
                        <RadialBar
                          background={{ fill: '#f3f4f6' }}
                          dataKey="value"
                          cornerRadius={10}
                          fill={outputData.confidence >= 0.8 ? '#10b981' : outputData.confidence >= 0.5 ? '#f59e0b' : '#ef4444'}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-text-primary tracking-tight">
                      {(outputData.confidence * 100).toFixed(0)}<span className="text-base text-gray-400 font-medium">%</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Right Col (Classifications Pie) */}
            {outputData.class_probabilities && (
              <div className="lg:col-span-4 flex flex-col h-full">
                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4 px-2">Probability Distribution</span>
                <div className="flex items-center h-full">
                  <div className="h-32 w-32 flex-shrink-0 relative">
                    <div className="absolute inset-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(outputData.class_probabilities)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([name, value]) => ({
                                name: name.replace(/_/g, ' '),
                                value: (value as number) * 100
                              }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={56}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {Object.entries(outputData.class_probabilities).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: number) => `${Math.round(value)}%`}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '12px',
                              border: '1px solid #f3f4f6',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              padding: '8px 12px'
                            }}
                            itemStyle={{ color: '#111827', fontWeight: 600, fontSize: '13px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Legend next to pie chart */}
                  <div className="flex-1 min-w-0 pr-2 pl-4 max-h-36 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col gap-2.5">
                      {Object.entries(outputData.class_probabilities)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([name, value], index) => (
                          <div key={name} className="flex items-center justify-between text-xs group">
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm transition-transform group-hover:scale-125 duration-200"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span className="text-gray-600 font-medium truncate" title={name.replace(/_/g, ' ')}>
                                {name.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className="font-bold text-gray-900 flex-shrink-0 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                              {((value as number) * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {predictionResult && outputData?.reasoning && (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
          <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none text-gray-900">
            <Brain size={200} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-cyan-500">
                <Brain size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reasoning</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-[15px]">{outputData.reasoning}</p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {/* {predictionResult && outputData?.prediction && (
        <ModelRecommendations
          modelId={modelId}
          classification={outputData.prediction}
        />
      )} */}

      {/* Feedback Actions */}
      {predictionResult && outputData && !showFeedbackForm && (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
          <div className="relative z-10 flex gap-4">
            <Button
              onClick={handleAccept}
              variant="secondary"
              className="flex-1 py-3 text-base font-medium"
            >
              Accept Prediction
            </Button>
            <Button
              onClick={handleCorrect}
              variant="secondary"
              className="flex-1 py-3 text-base font-medium border-brand-50 text-brand-50 hover:bg-brand-50 hover:text-white"
            >
              Correct Prediction
            </Button>
          </div>
        </div>
      )}

      {/* Feedback Form */}
      {showFeedbackForm && (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm border-brand-50/20">
          <div className="relative z-10 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Provide Feedback</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-grey-600 dark:text-text-secondary mb-2">
                Corrected Classification
              </label>
              <select
                value={correctedClassification}
                onChange={(e) => setCorrectedClassification(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-lg text-grey-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent"
              >
                <option value="">Select classification...</option>
                {(modelClassifications || ['Critical', 'Urgent', 'Emergent', 'Normal']).map((classification) => (
                  <option key={classification} value={classification}>
                    {classification}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-grey-600 dark:text-text-secondary mb-2">
                Feedback / Notes
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Provide specific feedback about the prediction..."
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-lg text-grey-900 dark:text-text-primary placeholder:text-grey-400 dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 mt-6">
              <Button
                onClick={() => {
                  setShowFeedbackForm(false);
                  setCorrectedClassification('');
                  setFeedbackText('');
                }}
                variant="secondary"
                className="flex-1 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={!correctedClassification.trim()}
                className="flex-1 py-2 bg-brand-50 hover:bg-brand-50/90 text-white"
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {predictMutation.isError && (
        <div className="relative overflow-hidden rounded-2xl bg-red-50/50 border border-red-200 p-6 shadow-sm">
          <div className="relative z-10 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-red-700 font-medium">
              Failed to run prediction. Please try again.
            </p>
          </div>
        </div>
      )}

      {/* Accept Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAcceptConfirm}
        onClose={() => setShowAcceptConfirm(false)}
        onConfirm={handleAcceptConfirm}
        title="Accept Prediction"
        message="Are you sure you want to accept this prediction? This will save your feedback and allow you to upload another test file."
        confirmLabel="Accept"
        cancelLabel="Cancel"
        variant="default"
        isLoading={updateFeedbackMutation.isPending}
      />
    </div>
  );
}
