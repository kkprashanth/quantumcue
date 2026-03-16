import { heartFailureStaticData } from '@/data/heartFailureData';

export const generateMockMetricsSchema = (seedId: string, baseData?: any, numClasses = 4, numPoints = 20) => {
    let hash = 0;
    for (let i = 0; i < seedId.length; i++) {
        hash = ((hash << 5) - hash) + seedId.charCodeAt(i);
        hash |= 0;
    }
    const random = () => {
        const x = Math.sin(hash++) * 10000;
        return x - Math.floor(x);
    };

    const applyPenalty = (val: number) => {
        const penaltyMultiplier = 1 - (0.01 + random() * 0.09);
        return Math.max(0, val * penaltyMultiplier);
    };

    if (baseData) {
        return {
            numClasses: baseData.numClasses,
            metrics: {
                accuracy: baseData.metrics.accuracy.map(applyPenalty),
                precision: baseData.metrics.precision.map(applyPenalty),
                auc_roc: baseData.metrics.auc_roc.map(applyPenalty),
                auc_pr: baseData.metrics.auc_pr.map(applyPenalty),
                max_f1: baseData.metrics.max_f1.map(applyPenalty),
            },
            curves: {
                f1: {
                    thresholds: baseData.curves.f1.thresholds,
                    scores: baseData.curves.f1.scores.map((classScores: number[]) => classScores.map(applyPenalty))
                },
                roc: baseData.curves.roc.map((curve: any) => ({
                    fpr: curve.fpr, // x-axis usually doesn't need penalty, but y-axis (tpr) does
                    tpr: curve.tpr.map(applyPenalty)
                })),
                pr: baseData.curves.pr.map((curve: any) => ({
                    recall: curve.recall, // x-axis
                    precision: curve.precision.map(applyPenalty) // y-axis
                })),
                confusion_rates: {
                    thresholds: baseData.curves.confusion_rates.thresholds,
                    tpr: baseData.curves.confusion_rates.tpr.map((arr: number[]) => arr.map(applyPenalty)),
                    fpr: baseData.curves.confusion_rates.fpr.map((arr: number[]) => arr.map(applyPenalty)),
                    tnr: baseData.curves.confusion_rates.tnr.map((arr: number[]) => arr.map(applyPenalty)),
                    fnr: baseData.curves.confusion_rates.fnr.map((arr: number[]) => arr.map(applyPenalty)),
                }
            }
        };
    }

    const thresholds = Array.from({ length: numPoints }, (_, i) => i / (numPoints - 1));

    const perfMod = 0.8 + (random() * 0.2);

    const metrics = {
        accuracy: Array.from({ length: numClasses }, () => 0.8 + (random() * 0.15)),
        precision: Array.from({ length: numClasses }, () => 0.75 + (random() * 0.2)),
        auc_roc: Array.from({ length: numClasses }, () => 0.85 + (random() * 0.1)),
        auc_pr: Array.from({ length: numClasses }, () => 0.7 + (random() * 0.2)),
        max_f1: Array.from({ length: numClasses }, () => 0.78 + (random() * 0.15)),
        confusion_matrix: [
            [100, 10, 5, 2],
            [15, 120, 8, 4],
            [3, 5, 90, 12],
            [1, 2, 10, 80]
        ]
    };

    const curves = {
        f1: {
            thresholds: thresholds,
            scores: Array.from({ length: numClasses }, () => {
                // F1 typically peaks in the middle
                return thresholds.map(t => {
                    const peak = 0.5 + (random() * 0.2);
                    const val = perfMod * Math.exp(-Math.pow(t - peak, 2) / 0.1);
                    return Math.max(0.1, val); // clamp bottom
                });
            })
        },
        roc: Array.from({ length: numClasses }, () => {
            // fpr and tpr
            const fpr = thresholds.map(t => Math.pow(t, 2 + random())); // leans to left
            const tpr = thresholds.map(t => Math.pow(t, 0.2 + random() * 0.3)); // leans to top
            return { fpr, tpr };
        }),
        pr: Array.from({ length: numClasses }, () => {
            // recall and precision
            const recall = thresholds.map(t => t);
            const precision = thresholds.map(t => {
                const dropStart = 0.6 + random() * 0.3;
                if (t < dropStart) return perfMod * (0.95 + random() * 0.05);
                return perfMod * Math.max(0, 1 - Math.pow((t - dropStart) / (1 - dropStart), 2));
            });
            return { recall, precision };
        }),
        confusion_rates: {
            thresholds: thresholds,
            tpr: Array.from({ length: numClasses }, () => thresholds.map(t => Math.min(1, (0.9 + random() * 0.1) * (1 - Math.pow(t, 1.5 + random() * 0.5))))),
            fpr: Array.from({ length: numClasses }, () => thresholds.map(t => Math.min(1, Math.pow(1 - t, 3 + random() * 1.5)))),
            tnr: Array.from({ length: numClasses }, () => thresholds.map(t => Math.min(1, (0.9 + random() * 0.1) * (1 - Math.pow(1 - t, 3 - random() * 0.5))))),
            fnr: Array.from({ length: numClasses }, () => thresholds.map(t => Math.min(1, Math.pow(t, 1.5 + random() * 0.5)))),
        }
    };

    return { metrics, curves, numClasses };
};

export const getMetricsData = (id: string, name?: string, provider?: string) => {
    if (provider?.toLowerCase() === 'qci') {
        return heartFailureStaticData;
    }
    return generateMockMetricsSchema(id, heartFailureStaticData);
};
