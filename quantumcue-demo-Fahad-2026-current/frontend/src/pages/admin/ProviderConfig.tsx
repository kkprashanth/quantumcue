import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Database, Cpu, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProvider } from '../../api/endpoints/providers';
import { useProviderConfiguration, useUpdateProviderConfigurationDefault } from '../../hooks/useProviderConfiguration';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

// Mock Software Parameters (since they are not in backend yet)
const DATA_TYPES = ['Video', 'JSON', 'Plain Text', 'PDF'];
const SOLVER_OPTIONS = ['Quantum Standard', 'Quantum Extended', 'Classical', 'Simulator'];

export const ProviderConfig = () => {
    const { providerId } = useParams<{ providerId: string }>();
    const navigate = useNavigate();

    const { data: provider, isLoading: isLoadingProvider } = useQuery({
        queryKey: ['provider', providerId],
        queryFn: () => getProvider(providerId!),
        enabled: !!providerId,
    });

    const { data: config, isLoading: isLoadingConfig } = useProviderConfiguration(providerId);
    const updateMutation = useUpdateProviderConfigurationDefault();

    // Hardware parameters state
    const [hardwareValues, setHardwareValues] = useState<Record<string, any>>({});

    // Software parameters state (Local only for now)
    const [softwareParams, setSoftwareParams] = useState({
        dataTypes: {
            Video: false,
            JSON: false,
            'Plain Text': false,
            PDF: false,
        } as Record<string, boolean>,
        scaleData: false,
        solver: 'Quantum Standard',
    });

    const hardwareFields = config?.fields.filter(field => field.parameter_type === 'hardware') || [];

    // Initialize hardware values
    useEffect(() => {
        if (config) {
            const initialValues: Record<string, any> = {};
            hardwareFields.forEach(field => {
                initialValues[field.field_key] = field.default_value;
            });
            setHardwareValues(prev => ({ ...initialValues, ...prev }));

            // Try to initialize software params if they exist in standard fields (best effort)
            const standardFields = config.fields.filter(field => field.parameter_type === 'standard');
            if (standardFields.length > 0) {
                const newSoftwareParams = { ...softwareParams };
                standardFields.forEach(field => {
                    if (field.field_key === 'supported_data_types') {
                        try {
                            let types: string[] = [];
                            if (typeof field.default_value === 'string') {
                                types = JSON.parse(field.default_value);
                            } else if (Array.isArray(field.default_value)) {
                                types = field.default_value;
                            }

                            if (Array.isArray(types)) {
                                DATA_TYPES.forEach(dt => {
                                    newSoftwareParams.dataTypes[dt] = types.includes(dt);
                                });
                            }
                        } catch (e) {
                            console.error("Failed to parse supported_data_types", e);
                        }
                    }
                    if (field.field_key === 'scale_data') newSoftwareParams.scaleData = !!field.default_value;
                    if (field.field_key === 'default_solver') newSoftwareParams.solver = field.default_value as string;
                });
                setSoftwareParams(newSoftwareParams);
            }
        }
    }, [config]);

    const handleHardwareSave = async (fieldKey: string) => {
        try {
            await updateMutation.mutateAsync({
                providerId: providerId!,
                fieldKey,
                defaultValue: hardwareValues[fieldKey]
            });
            toast.success(`Updated ${fieldKey}`);
        } catch (err) {
            console.error(err);
            toast.error(`Failed to update ${fieldKey}`);
        }
    };

    const handleSoftwareSave = async () => {
        try {
            // Transform data types to array
            const selectedDataTypes = Object.entries(softwareParams.dataTypes)
                .filter(([_, checked]) => checked)
                .map(([type]) => type);

            // Note: We use best-effort keys here. If the backend schema doesn't support them, 
            // these requests might fail or be ignored depending on backend validation strictness.
            await updateMutation.mutateAsync({
                providerId: providerId!,
                fieldKey: 'supported_data_types',
                defaultValue: JSON.stringify(selectedDataTypes)
            });

            await updateMutation.mutateAsync({
                providerId: providerId!,
                fieldKey: 'scale_data',
                defaultValue: softwareParams.scaleData
            });

            await updateMutation.mutateAsync({
                providerId: providerId!,
                fieldKey: 'default_solver',
                defaultValue: softwareParams.solver
            });

            toast.success("Software parameters updated");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update software parameters. Configuration keys may not suggest support.");
        }
    };

    const handleHardwareChange = (fieldKey: string, value: any) => {
        setHardwareValues(prev => ({ ...prev, [fieldKey]: value }));
    };

    // D-Wave specific logic
    const isDWave = provider?.name.toLowerCase().includes('d-wave') || provider?.provider_type === 'quantum_annealer';

    const getFieldLabel = (field: any) => {
        if (isDWave && field.label === 'Variables Type') return 'Problem Type';
        return field.label;
    };

    const shouldShowField = (field: any) => {
        if (field.field_key === 'device_type') return false;
        if (isDWave) {
            if (field.label === 'Number of Levels' || field.label === 'Relaxation Schedule') return false;
        }
        return true;
    };

    const getFieldOptions = (field: any) => {
        if (isDWave && (field.label === 'Variables Type' || field.field_key === 'variables_type')) { // Robust check
            return (
                <>
                    <option value="QUBO">QUBO</option>
                    <option value="DQM">DQM</option>
                </>
            );
        }
        if (field.field_type === 'boolean') {
            return (
                <>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </>
            );
        }

        return null;
    };


    if (isLoadingProvider || isLoadingConfig) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!provider) return <div>Provider not found</div>;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600"
                    onClick={() => navigate('/admin/providers')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Providers
                </Button>

                <div className="flex items-center gap-4">
                    {provider.logo_url ? (
                        <img src={provider.logo_url} alt={provider.name} className="w-16 h-16 object-contain" />
                    ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-2xl ring-1 ring-gray-200">
                            {provider.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                        <p className="text-gray-500 mt-1">{provider.provider_type.replace('_', ' ')} • Configuration</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* Software Parameters Column */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-blue-50 text-brand-50 rounded-lg">
                            <Database className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Software Parameters</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Data Type */}
                        <div className="group border border-gray-100 bg-gray-50/50 p-5 rounded-xl transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                            <label className="block text-sm font-semibold text-gray-800 mb-4">Data Type</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {DATA_TYPES.map(type => (
                                    <label key={type} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={softwareParams.dataTypes[type]}
                                            onChange={(e) => setSoftwareParams(prev => ({
                                                ...prev,
                                                dataTypes: { ...prev.dataTypes, [type]: e.target.checked }
                                            }))}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Data Processing & Solver Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Solver */}
                            <div className="group border border-gray-100 bg-gray-50/50 p-5 rounded-xl transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                                <label className="block text-sm font-semibold text-gray-800 mb-3">Solver Strategy</label>
                                <select
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-700 shadow-sm hover:border-gray-300"
                                    value={softwareParams.solver}
                                    onChange={(e) => setSoftwareParams(prev => ({ ...prev, solver: e.target.value }))}
                                >
                                    {SOLVER_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Data Processing */}
                            <div className="group border border-gray-100 bg-gray-50/50 p-5 rounded-xl transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                                <label className="block text-sm font-semibold text-gray-800 mb-3">Data Processing</label>
                                <div className="h-[52px] flex items-center">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all w-full">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={softwareParams.scaleData}
                                            onChange={(e) => setSoftwareParams(prev => ({ ...prev, scaleData: e.target.checked }))}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Scale Data Automatically</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <Button
                            variant='luxury'
                            className="w-full sm:w-auto px-8"
                            onClick={handleSoftwareSave}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Software Config"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Hardware Parameters Column */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-indigo-50 text-brand-50 rounded-lg">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Hardware Parameters</h2>
                    </div>

                    {hardwareFields.length === 0 ? (
                        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-gray-500">
                            No hardware parameters configured for this provider.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {hardwareFields
                                .filter(shouldShowField)
                                .map((field) => (
                                    <div key={field.field_key} className="group border border-gray-100 bg-gray-50/50 p-5 rounded-xl transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm flex flex-col justify-between">
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-semibold text-gray-800">
                                                    {getFieldLabel(field)} <span className="text-red-500">*</span>
                                                </label>
                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-mono">{field.field_key}</span>
                                            </div>
                                            {field.description && <p className="text-xs text-gray-500 leading-relaxed">{field.description}</p>}
                                        </div>

                                        <div>
                                            {field.field_type === 'boolean' || (isDWave && (field.label === 'Variables Type' || field.field_key === 'variables_type')) ? (
                                                <select
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-700 shadow-sm hover:border-gray-300"
                                                    value={String(hardwareValues[field.field_key])}
                                                    onChange={(e) => {
                                                        const val = e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value;
                                                        handleHardwareChange(field.field_key, val);
                                                    }}
                                                >
                                                    {getFieldOptions(field)}
                                                </select>
                                            ) : (
                                                <Input
                                                    type={field.field_type === 'integer' || field.field_type === 'float' ? 'number' : 'text'}
                                                    value={hardwareValues[field.field_key] || ''}
                                                    onChange={(e) => {
                                                        let val: any;
                                                        if (field.field_type === 'integer') val = parseInt(e.target.value) || 0;
                                                        else if (field.field_type === 'float') val = parseFloat(e.target.value) || 0;
                                                        else val = e.target.value;
                                                        handleHardwareChange(field.field_key, val);
                                                    }}
                                                    className="w-full"
                                                    placeholder={field.description || ''}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    {isDWave && (
                        <div className="mt-8 p-4 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-start gap-3">
                            <Settings className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-indigo-900 font-semibold">Provider specific options enabled</p>
                                <p className="text-xs text-indigo-700 mt-1">Specialized settings for D-Wave systems identified.</p>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <Button
                            className="w-full sm:w-auto px-8"
                            variant='luxury'
                            onClick={async () => {
                                const promises = hardwareFields
                                    .filter(shouldShowField)
                                    .map(field =>
                                        updateMutation.mutateAsync({
                                            providerId: providerId!,
                                            fieldKey: field.field_key,
                                            defaultValue: hardwareValues[field.field_key]
                                        })
                                    );

                                try {
                                    await Promise.all(promises);
                                    toast.success("Hardware parameters saved");
                                } catch (err) {
                                    console.error(err);
                                    toast.error("Failed to save some hardware parameters");
                                }
                            }}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Hardware Config"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
