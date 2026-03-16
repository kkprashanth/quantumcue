/**
 * Chart data parsing utilities for PR and ROC curve data.
 */

/**
 * Parse Precision-Recall data from .dat file content.
 * 
 * @param fileContent - Space-separated values, 3 columns per line (recall, precision, threshold)
 * @returns Object with recall and precision arrays
 */
export function parsePRData(fileContent: string): { recall: number[]; precision: number[] } {
  const lines = fileContent.trim().split('\n');
  const recall: number[] = [];
  const precision: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const recallVal = parseFloat(parts[0]);
      const precisionVal = parseFloat(parts[1]);

      if (!isNaN(recallVal) && !isNaN(precisionVal)) {
        recall.push(recallVal);
        precision.push(precisionVal);
      }
    }
  }

  return { recall, precision };
}

/**
 * Parse ROC curve data from .dat file content.
 * 
 * @param fileContent - Space-separated values, 3 columns per line (FPR, TPR, threshold)
 * @returns Object with FPR and TPR arrays
 */
export function parseROCData(fileContent: string): { fpr: number[]; tpr: number[] } {
  const lines = fileContent.trim().split('\n');
  const fpr: number[] = [];
  const tpr: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const fprVal = parseFloat(parts[0]);
      const tprVal = parseFloat(parts[1]);

      if (!isNaN(fprVal) && !isNaN(tprVal)) {
        fpr.push(fprVal);
        tpr.push(tprVal);
      }
    }
  }

  return { fpr, tpr };
}

/**
 * Parse F1 vs Threshold data from file content.
 * 
 * @param fileContent - Space-separated values, 2 columns per line (threshold, F1)
 * @returns Object with threshold and F1 arrays
 */
export function parseF1Data(fileContent: string): { threshold: number[]; f1: number[] } {
  const lines = fileContent.trim().split('\n');
  const threshold: number[] = [];
  const f1: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const thresholdVal = parseFloat(parts[0]);
      const f1Val = parseFloat(parts[1]);

      if (!isNaN(thresholdVal) && !isNaN(f1Val)) {
        threshold.push(thresholdVal);
        f1.push(f1Val);
      }
    }
  }

  return { threshold, f1 };
}

/**
 * Parse TPR/FPR vs Threshold data from file content.
 * 
 * @param fileContent - Space-separated values, 3 columns per line (threshold, TPR, FPR)
 * @returns Object with threshold, TPR, and FPR arrays
 */
export function parseTPRFPRData(fileContent: string): { threshold: number[]; tpr: number[]; fpr: number[] } {
  const lines = fileContent.trim().split('\n');
  const threshold: number[] = [];
  const tpr: number[] = [];
  const fpr: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const thresholdVal = parseFloat(parts[0]);
      const tprVal = parseFloat(parts[1]);
      const fprVal = parseFloat(parts[2]);

      if (!isNaN(thresholdVal) && !isNaN(tprVal) && !isNaN(fprVal)) {
        threshold.push(thresholdVal);
        tpr.push(tprVal);
        fpr.push(fprVal);
      }
    }
  }

  return { threshold, tpr, fpr };
}

/**
 * Parse TNR/FNR vs Threshold data from file content.
 * 
 * @param fileContent - Space-separated values, 3 columns per line (threshold, TNR, FNR)
 * @returns Object with threshold, TNR, and FNR arrays
 */
export function parseTNRFNRData(fileContent: string): { threshold: number[]; tnr: number[]; fnr: number[] } {
  const lines = fileContent.trim().split('\n');
  const threshold: number[] = [];
  const tnr: number[] = [];
  const fnr: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const thresholdVal = parseFloat(parts[0]);
      const tnrVal = parseFloat(parts[1]);
      const fnrVal = parseFloat(parts[2]);

      if (!isNaN(thresholdVal) && !isNaN(tnrVal) && !isNaN(fnrVal)) {
        threshold.push(thresholdVal);
        tnr.push(tnrVal);
        fnr.push(fnrVal);
      }
    }
  }

  return { threshold, tnr, fnr };
}
