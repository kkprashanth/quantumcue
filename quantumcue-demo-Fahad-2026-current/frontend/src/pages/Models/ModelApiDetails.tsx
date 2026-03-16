/**
 * Model API Details Page
 * Shows API documentation for hosted models
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Terminal,
  Shield,
  Code,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Laptop,
  Cpu,
  Globe,
  Activity,
  Zap,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useModel } from '@/hooks/useModels';

// Hosting Credential Field Component (adapted from ModelDetail.tsx)
interface HostingCredentialFieldProps {
  label: string;
  value: string;
  isSecret?: boolean;
}

const HostingCredentialField = ({ label, value, isSecret = false }: HostingCredentialFieldProps) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = isSecret && !isRevealed ? '•'.repeat(32) : value;

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-navy-900/50 border border-gray-200 dark:border-navy-700 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
          {displayValue}
        </code>
        <div className="flex gap-1">
          {isSecret && (
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors text-gray-500"
              aria-label={isRevealed ? 'Hide' : 'Reveal'}
            >
              {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors text-gray-500"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ModelApiDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: model, isLoading, error } = useModel(id || null);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-100 dark:bg-navy-800 rounded" />
          <div className="h-64 bg-gray-100 dark:bg-navy-800 rounded-xl" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-48 bg-gray-100 dark:bg-navy-800 rounded-xl" />
            <div className="h-48 bg-gray-100 dark:bg-navy-800 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !model) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
            <Activity size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Model Not Found</h2>
          <Button variant="secondary" onClick={() => navigate('/models')}>
            Return to Models
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!model.hosting_endpoint || model.hosting_status !== 'active') {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 text-amber-500">
            <Zap size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Model Not Hosted</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            This model is not currently hosted. Please deploy the model to access API details.
          </p>
          <Button variant="secondary" onClick={() => navigate(`/models/${model.id}`)}>
            Back to Model
          </Button>
        </div>
      </PageContainer>
    );
  }

  const exampleRequest = {
    input: {
      data: "example_input_data",
      format: "json",
    },
  };

  const exampleResponse = {
    prediction: "Critical",
    confidence: 0.95,
    reasoning: "The model analyzed the input data and determined this classification with high confidence.",
    metadata: {
      model_id: model.id,
      model_version: model.version,
      inference_time_ms: 125,
    },
  };

  return (
    <PageContainer>
      {/* Back button */}
      <button
        onClick={() => navigate(`/models/${model.id}`)}
        className="group flex items-center gap-2 text-gray-600 hover:text-navy-900 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Model</span>
      </button>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-navy-900/50 border border-gray-200 dark:border-navy-800 p-8 mb-8 shadow-sm">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-gray-900 dark:text-white">
          <Terminal size={300} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 flex items-center justify-center shadow-sm">
              <Terminal className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                  API Details
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  ACTIVE HOSTING
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {model.name} • v{model.version}
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-gray-600 dark:text-gray-400 mt-6 max-w-3xl text-lg leading-relaxed border-l-2 border-violet-500 pl-4">
          Documentation and credentials for integrating the {model.name} model into your applications via REST API.
        </p>

        {/* Quick Info Grid */}
        <div className="relative z-10 flex flex-col md:flex-row gap-4 mt-8">
          <div className="bg-gray-50 dark:bg-navy-800/50 border border-gray-200 dark:border-navy-700 rounded-xl p-4 flex-1">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <LinkIcon size={14} className="text-violet-500" />
              <span className="text-xs font-medium uppercase tracking-wider">Base URL</span>
            </div>
            <p className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 break-all">
              {model.hosting_endpoint}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-navy-800/50 border border-gray-200 dark:border-navy-700 rounded-xl p-4 w-full md:w-32">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Code size={14} className="text-violet-500" />
              <span className="text-xs font-medium uppercase tracking-wider">Method</span>
            </div>
            <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">POST</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Authentication Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-navy-900/50 border border-gray-200 dark:border-navy-800 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900 dark:text-white">
              <Shield size={200} />
            </div>
            <h3 className="relative z-10 text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-navy-800 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 shadow-sm text-violet-600 dark:text-violet-400">
                <Shield size={20} />
              </div>
              Authentication
            </h3>
            <div className="relative z-10 space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                All requests require authentication via headers. Keep your credentials secure.
              </p>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-navy-800/80 rounded-lg border border-gray-200 dark:border-navy-700">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-2">Required Headers</span>
                  <code className="text-xs text-gray-700 dark:text-gray-300 space-y-1 block font-mono">
                    X-Client-ID: <span className="text-violet-600 dark:text-violet-400">{"{client_id}"}</span><br />
                    X-Client-Secret: <span className="text-violet-600 dark:text-violet-400">{"{client_secret}"}</span>
                  </code>
                </div>
                {model.client_id && (
                  <HostingCredentialField label="Client ID" value={model.client_id} />
                )}
                {model.client_secret && (
                  <HostingCredentialField label="Client Secret" value={model.client_secret} isSecret />
                )}
              </div>
            </div>
          </div>

          {/* Request Example */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-navy-900/50 border border-gray-200 dark:border-navy-800 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900 dark:text-white">
              <Code size={200} />
            </div>
            <h3 className="relative z-10 text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-navy-800 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 shadow-sm text-violet-600 dark:text-violet-400">
                <Code size={20} />
              </div>
              Request Body
            </h3>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">JSON Format</span>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(exampleRequest, null, 2))}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
              <pre className="bg-gray-50 dark:bg-navy-900/80 border border-gray-200 dark:border-navy-700 rounded-xl p-4 overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200">
                {JSON.stringify(exampleRequest, null, 2)}
              </pre>
            </div>
          </div>

          {/* Response Example */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-navy-900/50 border border-gray-200 dark:border-navy-800 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900 dark:text-white">
              <FileText size={200} />
            </div>
            <h3 className="relative z-10 text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-navy-800 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 shadow-sm text-violet-600 dark:text-violet-400">
                <FileText size={20} />
              </div>
              Response Structure
            </h3>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Sample Response</span>
              </div>
              <pre className="bg-gray-50 dark:bg-navy-900/80 border border-gray-200 dark:border-navy-700 rounded-xl p-4 overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200">
                {JSON.stringify(exampleResponse, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Implementation Snippets */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-navy-900/50 border border-gray-200 dark:border-navy-800 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900 dark:text-white">
              <Laptop size={200} />
            </div>
            <h3 className="relative z-10 text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-navy-800 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 shadow-sm text-violet-600 dark:text-violet-400">
                <Laptop size={20} />
              </div>
              Implementation Examples
            </h3>

            <div className="relative z-10 space-y-8">
              {/* cURL */}
              <CodeSnippet
                title="cURL"
                code={`curl -X POST ${model.hosting_endpoint} \\
  -H "Content-Type: application/json" \\
  -H "X-Client-ID: ${model.client_id || '{client_id}'}" \\
  -H "X-Client-Secret: ${model.client_secret || '{client_secret}'}" \\
  -d '${JSON.stringify(exampleRequest)}'`}
              />

              {/* Python */}
              <CodeSnippet
                title="Python"
                code={`import requests

url = "${model.hosting_endpoint}"
headers = {
    "Content-Type": "application/json",
    "X-Client-ID": "${model.client_id || '{client_id}'}",
    "X-Client-Secret": "${model.client_secret || '{client_secret}'}"
}
data = ${JSON.stringify(exampleRequest, null, 2).replace(/\n/g, '\n    ')}

response = requests.post(url, json=data, headers=headers)
result = response.json()
print(result)`}
              />

              {/* JS */}
              <CodeSnippet
                title="JavaScript"
                code={`const url = "${model.hosting_endpoint}";
const headers = {
  "Content-Type": "application/json",
  "X-Client-ID": "${model.client_id || '{client_id}'}",
  "X-Client-Secret": "${model.client_secret || '{client_secret}'}"
};
const data = ${JSON.stringify(exampleRequest, null, 2).replace(/\n/g, '\n  ')};

fetch(url, {
  method: "POST",
  headers: headers,
  body: JSON.stringify(data)
})
  .then(response => response.json())
  .then(result => console.log(result))
  .catch(error => console.error("Error:", error));`}
              />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

// Helper component for code snippets
const CodeSnippet = ({ title, code }: { title: string; code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy Code'}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-xs font-mono leading-relaxed border border-gray-800">
        {code}
      </pre>
    </div>
  );
};

export default ModelApiDetails;
