/**
 * Mock chart data loading utilities for PR and ROC curves.
 * 
 * Loads data from examples/graph_data/ directory based on the number of classifications.
 */

import { parsePRData, parseROCData, parseF1Data, parseTPRFPRData, parseTNRFNRData } from './chartData';

export interface PRCurveData {
  recall: number[];
  precision: number[];
  label: string;
  auc: number;
  stdDev: number;
}

export interface ROCCurveData {
  fpr: number[];
  tpr: number[];
  label: string;
  auc: number;
  stdDev: number;
}

// Default AUC values with standard deviations (used as fallback if not in database)
const DEFAULT_AUC_ROC = 0.9864890533720444;
const DEFAULT_AUC_ROC_STD_DEV = 0.7998634737409006;
const DEFAULT_AUC_PR = 0.9653764441947619;
const DEFAULT_AUC_PR_STD_DEV = 0.0016673973130033664;

/**
 * Load PR curve data for the given classifications.
 * Only loads data files corresponding to the number of classifications.
 * 
 * @param classifications - Array of classification names from the model
 * @param prAuc - Optional PR-AUC value from database
 * @param prAucStdDev - Optional PR-AUC standard deviation from database
 * @returns Array of PR curve data, one per classification
 */
export async function loadPRData(
  classifications: string[],
  prAuc?: number | null,
  prAucStdDev?: number | null
): Promise<PRCurveData[]> {
  if (!classifications || classifications.length === 0) {
    return [];
  }

  const results: PRCurveData[] = [];

  // Load data files for each classification (pr_1, pr_2, etc.)
  for (let i = 0; i < classifications.length && i < 4; i++) {
    const fileIndex = i + 1;
    const fileName = `pr_${fileIndex}.dat`;

    try {
      // Fetch from examples/graph_data directory
      // In production, these files should be in public/ or served by backend
      const response = await fetch(`/examples/graph_data/${fileName}`);

      if (!response.ok) {
        console.warn(`Failed to load ${fileName}, using fallback data`);
        // Fallback: generate simple mock data
        results.push({
          recall: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
          precision: [1.0, 0.95, 0.9, 0.85, 0.8, 0.7],
          label: classifications[i],
          auc: prAuc ?? DEFAULT_AUC_PR,
          stdDev: prAucStdDev ?? DEFAULT_AUC_PR_STD_DEV,
        });
        continue;
      }

      const fileContent = await response.text();
      const { recall, precision } = parsePRData(fileContent);

      results.push({
        recall,
        precision,
        label: classifications[i],
        auc: prAuc ?? DEFAULT_AUC_PR,
        stdDev: prAucStdDev ?? DEFAULT_AUC_PR_STD_DEV,
      });
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
      // Fallback data
      results.push({
        recall: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
        precision: [1.0, 0.95, 0.9, 0.85, 0.8, 0.7],
        label: classifications[i],
        auc: prAuc ?? DEFAULT_AUC_PR,
        stdDev: prAucStdDev ?? DEFAULT_AUC_PR_STD_DEV,
      });
    }
  }

  return results;
}

/**
 * Load ROC curve data for the given classifications.
 * Only loads data files corresponding to the number of classifications.
 * 
 * @param classifications - Array of classification names from the model
 * @param rocAuc - Optional ROC-AUC value from database
 * @param rocAucStdDev - Optional ROC-AUC standard deviation from database
 * @returns Array of ROC curve data, one per classification
 */
export async function loadROCData(
  classifications: string[],
  rocAuc?: number | null,
  rocAucStdDev?: number | null
): Promise<ROCCurveData[]> {
  if (!classifications || classifications.length === 0) {
    return [];
  }

  const results: ROCCurveData[] = [];

  // Load data files for each classification (roc_1, roc_2, etc.)
  for (let i = 0; i < classifications.length && i < 4; i++) {
    const fileIndex = i + 1;
    const fileName = `roc_${fileIndex}.dat`;

    try {
      // Fetch from examples/graph_data directory
      const response = await fetch(`/examples/graph_data/${fileName}`);

      if (!response.ok) {
        console.warn(`Failed to load ${fileName}, using fallback data`);
        // Fallback: generate simple mock data
        results.push({
          fpr: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          tpr: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.98, 1.0],
          label: classifications[i],
          auc: rocAuc ?? DEFAULT_AUC_ROC,
          stdDev: rocAucStdDev ?? DEFAULT_AUC_ROC_STD_DEV,
        });
        continue;
      }

      const fileContent = await response.text();
      const { fpr, tpr } = parseROCData(fileContent);

      results.push({
        fpr,
        tpr,
        label: classifications[i],
        auc: rocAuc ?? DEFAULT_AUC_ROC,
        stdDev: rocAucStdDev ?? DEFAULT_AUC_ROC_STD_DEV,
      });
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
      // Fallback data
      results.push({
        fpr: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        tpr: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.98, 1.0],
        label: classifications[i],
        auc: rocAuc ?? DEFAULT_AUC_ROC,
        stdDev: rocAucStdDev ?? DEFAULT_AUC_ROC_STD_DEV,
      });
    }
  }

  return results;
}

/**
 * Load F1 vs Threshold data from file.
 * 
 * @returns Object with threshold and F1 arrays
 */
export async function loadF1Data(): Promise<{ threshold: number[]; f1: number[] }> {
  try {
    const response = await fetch('/examples/graph_data/graph_F1_quantum_data.txt');

    if (!response.ok) {
      console.warn('Failed to load F1 data, using fallback data');
      // Fallback: generate simple mock data
      return {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        f1: [0.3, 0.4, 0.5, 0.6, 0.7, 0.72, 0.7, 0.65, 0.55, 0.4, 0.2],
      };
    }

    const fileContent = await response.text();
    return parseF1Data(fileContent);
  } catch (error) {
    console.error('Error loading F1 data:', error);
    // Fallback data
    return {
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      f1: [0.3, 0.4, 0.5, 0.6, 0.7, 0.72, 0.7, 0.65, 0.55, 0.4, 0.2],
    };
  }
}

/**
 * Load TPR/FPR vs Threshold data from file.
 * 
 * @returns Object with threshold, TPR, and FPR arrays
 */
export async function loadTPRFPRData(): Promise<{ threshold: number[]; tpr: number[]; fpr: number[] }> {
  try {
    const response = await fetch('/examples/graph_data/graph_TPR_FPR.txt');

    if (!response.ok) {
      console.warn('Failed to load TPR/FPR data, using fallback data');
      // Fallback: generate simple mock data
      return {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        tpr: [1.0, 0.99, 0.98, 0.96, 0.85, 0.75, 0.65, 0.5, 0.35, 0.2, 0.0],
        fpr: [0.47, 0.34, 0.24, 0.17, 0.11, 0.07, 0.04, 0.025, 0.01, 0.002, 0.0],
      };
    }

    const fileContent = await response.text();
    return parseTPRFPRData(fileContent);
  } catch (error) {
    console.error('Error loading TPR/FPR data:', error);
    // Fallback data
    return {
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      tpr: [1.0, 0.99, 0.98, 0.96, 0.85, 0.75, 0.65, 0.5, 0.35, 0.2, 0.0],
      fpr: [0.47, 0.34, 0.24, 0.17, 0.11, 0.07, 0.04, 0.025, 0.01, 0.002, 0.0],
    };
  }
}

/**
 * Load TNR/FNR vs Threshold data.
 * Derives data from TPR/FPR if file not found.
 * 
 * @returns Object with threshold, TNR, and FNR arrays
 */
export async function loadTNRFNRData(): Promise<{ threshold: number[]; tnr: number[]; fnr: number[] }> {
  try {
    // Attempt to load TPR/FPR data and derive TNR/FNR
    // TNR = 1 - FPR, FNR = 1 - TPR
    const tprfpr = await loadTPRFPRData();
    return {
      threshold: tprfpr.threshold,
      tnr: tprfpr.fpr.map(f => 1 - f),
      fnr: tprfpr.tpr.map(t => 1 - t),
    };
  } catch (error) {
    console.error('Error loading TNR/FNR data:', error);
    // Fallback data
    return {
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      tnr: [0.53, 0.66, 0.76, 0.83, 0.89, 0.93, 0.96, 0.975, 0.99, 0.998, 1.0],
      fnr: [0.0, 0.01, 0.02, 0.04, 0.15, 0.25, 0.35, 0.5, 0.65, 0.8, 1.0],
    };
  }
}
