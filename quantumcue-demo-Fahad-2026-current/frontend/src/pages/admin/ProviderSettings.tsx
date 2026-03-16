import { useNavigate } from 'react-router-dom';
import { Settings, Loader2, Info, Sliders } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProviders } from '../../api/endpoints/providers';
import { Button } from '../../components/ui/Button';
import { ProviderCard } from '../../components/providers/ProviderCard';

export const ProviderSettings = () => {
    const navigate = useNavigate();
    // Fetch all providers
    const { data: providersData, isLoading: isLoadingProviders } = useQuery({
        queryKey: ['providers'],
        queryFn: () => getProviders({ include_inactive: true }),
    });

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-brand-50 rounded-xl">
                        <Settings className="w-6 h-6" />
                    </div>
                    Provider Configuration
                </h1>
                <p className="text-gray-500 text-lg">
                    Manage hardware and software parameters for each quantum provider in the system.
                </p>
            </div>

            {isLoadingProviders ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-50" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {providersData?.providers.map((provider) => (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            footer={
                                <div className="mt-4 pt-4 border-t border-grey-100 dark:border-border flex gap-3">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1 text-xs font-bold"
                                        leftIcon={<Info size={14} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/providers/${provider.id}`);
                                        }}
                                    >
                                        Details
                                    </Button>
                                    <Button
                                        variant="luxury"
                                        size="sm"
                                        className="flex-1 text-xs font-bold"
                                        leftIcon={<Sliders size={14} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/admin/providers/${provider.id}`);
                                        }}
                                    >
                                        Configure
                                    </Button>
                                </div>
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

