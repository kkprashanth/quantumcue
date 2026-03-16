import numpy as np
#import matplotlib.pyplot as plt

def generate_single_confusion_rates(center, width, num_points, seed=None):
    """
    Synthetic TPR, FPR, TNR, FNR vs threshold.
    - TPR: decreasing
    - FPR: decreasing and always below TPR
    """
    if seed is not None:
        np.random.seed(seed)

    thresholds = np.linspace(0.0, 1.0, num_points)

    tpr_center = np.clip(center - 0.15, 0.05, 0.35)
    tpr_width = width * 1.8
    tpr = 1.0 / (1.0 + np.exp(8.0 * ((thresholds - tpr_center) / tpr_width)))

    fpr_center = np.clip(center - 0.20, 0.02, 0.25)
    fpr_width = width * 2.0
    fpr = 0.28 / (1.0 + np.exp(7.0 * ((thresholds - fpr_center) / fpr_width))) + 0.015

    fpr = np.minimum(fpr, 0.95 * tpr)
    fpr = np.clip(fpr, 0.01, 0.3)

    noise_scale = 0.008
    noise = noise_scale * np.sin(10.0 * np.pi * thresholds) * np.exp(-((thresholds - 0.15) / 0.25) ** 2)
    fpr = fpr + noise
    fpr = np.minimum(fpr, 0.95 * tpr)
    fpr = np.clip(fpr, 0.01, 0.3)

    tnr = 1.0 - fpr
    fnr = 1.0 - tpr

    return thresholds, tpr, fpr, tnr, fnr


def generate_multi_confusion_rates(num_classes, num_points=20, seed=None):
    if seed is not None:
        np.random.seed(seed)

    mean_center = 0.45
    mean_width = 0.18

    thresholds = None
    tpr_matrix = np.zeros((num_classes, num_points))
    fpr_matrix = np.zeros((num_classes, num_points))
    tnr_matrix = np.zeros((num_classes, num_points))
    fnr_matrix = np.zeros((num_classes, num_points))

    for i in range(num_classes):
        center = np.random.normal(mean_center, 0.05)
        width = np.random.normal(mean_width, 0.02)
        center = np.clip(center, 0.3, 0.6)
        width = np.clip(width, 0.1, 0.25)

        rates = generate_single_confusion_rates(center, width, num_points, seed=i)
        if thresholds is None:
            thresholds = rates[0]
        tpr_matrix[i], fpr_matrix[i], tnr_matrix[i], fnr_matrix[i] = rates[1:]

    return thresholds, tpr_matrix, fpr_matrix, tnr_matrix, fnr_matrix


def plot_confusion_rates(thresholds, tpr, fpr, tnr, fnr, num_classes):
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    fig.suptitle("Synthetic Confusion Rates vs Threshold")

    metrics = [(tpr, "TPR"), (fpr, "FPR"), (tnr, "TNR"), (fnr, "FNR")]
    for idx, (data, name) in enumerate(metrics):
        ax = axes[idx // 2, idx % 2]
        for i in range(num_classes):
            ax.plot(thresholds, data[i], marker="o", label=f"Class {i+1}")
        ax.set_title(name)
        ax.set_xlabel("Threshold")
        ax.set_ylabel(name)
        ax.grid(True, alpha=0.3)
        ax.legend()

    plt.tight_layout()
    plt.show()


def demo_confusion_rates(num_classes=4, num_points=20, seed=42):
    thresholds, tpr, fpr, tnr, fnr = generate_multi_confusion_rates(
        num_classes=num_classes, num_points=num_points, seed=seed
    )
    
    # Make graps. Uncomment if needed.
    #plot_confusion_rates(thresholds, tpr, fpr, tnr, fnr, num_classes=num_classes)
    
    return thresholds, tpr, fpr, tnr, fnr


