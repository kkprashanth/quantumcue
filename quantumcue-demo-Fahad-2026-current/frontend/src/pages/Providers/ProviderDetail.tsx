/**
 * Provider detail page.
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Cpu,
  Clock,
  Users,
  DollarSign,
  Building2,
  Check,
  AlertTriangle,
  Award,
  Code,
  Globe,
  Zap,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { ProviderStatusIndicator } from '../../components/providers/ProviderStatusIndicator';
import { ProviderSpecsTable } from '../../components/providers/ProviderSpecsTable';
import { ProviderLogo } from '../../components/providers/ProviderLogo';
import { useProvider } from '../../hooks/useProviders';
import { getProviderTypeLabel, getProviderTypeColor } from '../../api/endpoints/providers';

export const ProviderDetail: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { data: provider, isLoading, error } = useProvider(providerId);

  const formatWaitTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-navy-800 rounded" />
          <div className="h-64 bg-navy-800 rounded-xl" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-48 bg-navy-800 rounded-xl" />
            <div className="h-48 bg-navy-800 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !provider) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertTriangle className="text-red-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Provider Not Found</h2>
          <p className="text-white mb-8 max-w-md">
            The quantum provider you are looking for could not be found or has been removed.
          </p>
          <Button variant="secondary" onClick={() => navigate('/providers')}>
            Return to Providers
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Back button */}
      <button
        onClick={() => navigate('/providers')}
        className="group flex items-center gap-2 text-gray-600 hover:text-navy-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Providers</span>
      </button>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 mb-8 shadow-sm">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-navy-900">
          <Cpu size={300} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm p-4">
              <ProviderLogo
                code={provider.code}
                variant="icon"
                size={120}
                className="w-full h-full"
              />
            </div> */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  {provider.name}
                </h1>
                <ProviderStatusIndicator status={provider.status} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-xs font-mono px-2.5 py-1 rounded border ${provider.provider_type === 'gate_based'
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                  {getProviderTypeLabel(provider.provider_type).toUpperCase()}
                </span>

                {provider.integration.cloud_regions && provider.integration.cloud_regions.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-gray-600 px-2.5 py-1 rounded bg-gray-50 border border-gray-200">
                    <Globe size={12} />
                    {provider.integration.cloud_regions[0]}
                    {provider.integration.cloud_regions.length > 1 && ` +${provider.integration.cloud_regions.length - 1}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* {provider.documentation_url && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<BookOpen size={16} />}
                onClick={() => window.open(provider.documentation_url!, '_blank')}
                className="flex-1 md:flex-none justify-center"
              >
                Documentation
              </Button>
            )} */}
            {provider.website_url && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ExternalLink size={16} />}
                onClick={() => window.open(provider.website_url!, '_blank')}
                className="flex-1 md:flex-none justify-center"
              >
                Website
              </Button>
            )}
          </div>
        </div>

        <p className="relative z-10 text-gray-600 mt-6 max-w-3xl text-lg leading-relaxed border-l-2 border-quantum-500 pl-4">
          {provider.description}
        </p>

        {/* Quick Stats Grid - Moving inside header for better cohesiveness */}
        <div className="relative z-10 flex flex-col w-full justify-between md:flex-row gap-4 mt-8">
          <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Cpu size={16} className="text-quantum-600 group-hover:text-quantum-500 transition-colors" />
              <span className="text-xs font-medium uppercase tracking-wider">Levels</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {provider.hardware.qubit_count?.toLocaleString() || 'N/A'}
            </p>
          </div>

          {/* {provider.status !== 'offline' && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-quantum-500/50 transition-colors group">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <Users size={16} className="text-quantum-600 group-hover:text-quantum-500 transition-colors" />
                <span className="text-xs font-medium uppercase tracking-wider">Queue</span>
              </div>
              <p className="text-2xl font-mono font-bold text-gray-900">{provider.queue_depth}</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-quantum-500/50 transition-colors group">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Clock size={16} className="text-quantum-600 group-hover:text-quantum-500 transition-colors" />
              <span className="text-xs font-medium uppercase tracking-wider">Avg Wait</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {formatWaitTime(provider.avg_queue_time_seconds)}
            </p>
          </div> */}

          <div className="bg-gray-50 border border-gray-200 w-full rounded-xl p-4 transition-colors group  items-center justify-center flex flex-col">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Zap size={16} className="text-quantum-600 group-hover:text-quantum-500 transition-colors" />
              <span className="text-xs font-medium uppercase tracking-wider">Processor</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900 truncate" title={provider.hardware.processor_name || ''}>
              {provider.hardware.processor_name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column */}
        <div className="space-y-8">

          {/* Technology Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-quantum-500/30 transition-all duration-300 group">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-navy-900">
              <Cpu size={200} />
            </div>

            <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-quantum-600">
                <Cpu size={20} />
              </div>
              Technology Stack
            </h3>

            <div className="relative z-10 space-y-6">
              {provider.technology_name && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Architecture</span>
                  <p className="text-lg text-gray-900 font-medium">{provider.technology_name}</p>
                </div>
              )}

              {provider.technology_description && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Description</span>
                  <p className="text-gray-600 text-sm leading-relaxed">{provider.technology_description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Hardware Specs Table */}
          <ProviderSpecsTable specs={provider.hardware} />

          {/* Integration Card */}
          <div className="min-h-[29.5%] relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-quantum-500/30 transition-all duration-300 group">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-navy-900">
              <Code size={200} />
            </div>

            <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-quantum-600">
                <Code size={20} />
              </div>
              Integration & SDKs
            </h3>

            <div className="relative z-10 space-y-6">
              {provider.integration.api_version && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">API Version</span>
                  <code className="text-gray-700 text-sm font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{provider.integration.api_version}</code>
                </div>
              )}

              {provider.integration.sdk_languages && provider.integration.sdk_languages.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-3">SDK Languages</span>
                  <div className="flex flex-wrap gap-2">
                    {provider.integration.sdk_languages.map((lang, i) => (
                      <span key={i} className="text-xs px-3 py-1 bg-gray-50 text-gray-700 rounded-full flex items-center gap-2 border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-quantum-500"></span>
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-8">

          {/* Capabilities Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-quantum-500/30 transition-all duration-300 group">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-navy-900">
              <Zap size={200} />
            </div>

            <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-quantum-600">
                <Zap size={20} />
              </div>
              Capabilities
            </h3>

            <div className="relative z-10 space-y-6">
              {provider.capabilities.supported_algorithms &&
                provider.capabilities.supported_algorithms.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-3">Supported Algorithms</span>
                    <div className="flex flex-wrap gap-2">
                      {provider.capabilities.supported_algorithms.map((algo, i) => (
                        <span
                          key={i}
                          className="text-xs font-mono px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded transition-colors"
                        >
                          {algo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {provider.capabilities.supported_problem_types &&
                provider.capabilities.supported_problem_types.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-3">Problem Types</span>
                    <div className="flex flex-wrap gap-2">
                      {provider.capabilities.supported_problem_types.map((type, i) => (
                        <span
                          key={i}
                          className="text-xs font-mono px-2.5 py-1 bg-quantum-50 border border-quantum-100 text-quantum-700 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {provider.capabilities.native_gates && provider.capabilities.native_gates.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-3">Native Gates</span>
                  <div className="flex flex-wrap gap-2">
                    {provider.capabilities.native_gates.map((gate, i) => (
                      <code
                        key={i}
                        className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded font-mono border border-gray-200"
                      >
                        {gate}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features & Limitations Grid */}
          <div className="grid grid-cols-1 gap-6">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-quantum-500/30 transition-all duration-300">
              {/* Background Decoration */}
              <div className="absolute -right-6 -bottom-6 p-4 opacity-5 pointer-events-none text-navy-900">
                <Check size={120} />
              </div>

              <h3 className="relative z-10 text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Check size={18} className="text-green-600" />
                Key Features
              </h3>
              {provider.features && provider.features.length > 0 ? (
                <ul className="relative z-10 space-y-3">
                  {provider.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="relative z-10 text-gray-500 text-sm italic">No specific features listed</p>
              )}
            </div>
          </div>

          {/* Company Info */}
          {provider.company_info && (
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-quantum-500/30 transition-all duration-300 group">
              {/* Background Decoration */}
              <div className="absolute right-0 bottom-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-navy-900">
                <Building2 size={200} />
              </div>

              <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-quantum-600">
                  <Building2 size={20} />
                </div>
                Company Details
              </h3>
              <div className="relative z-10 grid grid-cols-2 gap-y-6 gap-x-4">
                {provider.company_info.founded && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Founded</span>
                    <p className="text-gray-900 font-medium">{provider.company_info.founded}</p>
                  </div>
                )}
                {provider.company_info.headquarters && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">HQ</span>
                    <p className="text-gray-900 font-medium">{provider.company_info.headquarters}</p>
                  </div>
                )}
                {provider.company_info.employees && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Team Size</span>
                    <p className="text-gray-900 font-medium">{provider.company_info.employees}</p>
                  </div>
                )}
                {provider.company_info.public_ticker && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Ticker</span>
                    <code className="text-gray-700 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{provider.company_info.public_ticker}</code>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </PageContainer>
  );
};

export default ProviderDetail;
