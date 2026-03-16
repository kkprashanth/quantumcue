import numpy as np
#import matplotlib.pyplot as plt

def generate_single_f1_curve(peak, baseline_start, baseline_end, center, width, num_points):
    thresholds = np.linspace(0.0, 1.0, num_points)

    bump = np.exp(-0.5 * ((thresholds - center) / width) ** 2)
    bump = (bump - bump.min()) / (bump.max() - bump.min())

    f1_scores = baseline_start + (peak - baseline_start) * bump
    blend = np.linspace(0.0, 1.0, num_points)
    f1_scores = f1_scores * (1.0 - blend) + baseline_end * blend

    return thresholds, f1_scores


def generate_random_params(mean_peak, mean_baseline_start, mean_baseline_end,
                           mean_center, mean_width, std=0.05):
    peak = np.random.normal(mean_peak, std)
    baseline_start = np.random.normal(mean_baseline_start, std)
    baseline_end = np.random.normal(mean_baseline_end, std)
    center = np.random.normal(mean_center, std)
    width = np.random.normal(mean_width, 0.02)

    peak = np.clip(peak, 0.5, 0.9)
    baseline_start = np.clip(baseline_start, 0.05, 0.2)
    baseline_end = np.clip(baseline_end, 0.1, 0.3)
    center = np.clip(center, 0.3, 0.6)
    width = np.clip(width, 0.1, 0.25)

    return peak, baseline_start, baseline_end, center, width


def generate_multi_f1_curves(num_classes, num_points=20, seed=None):
    if seed is not None:
        np.random.seed(seed)

    mean_peak = 0.75
    mean_baseline_start = 0.10
    mean_baseline_end = 0.20
    mean_center = 0.45
    mean_width = 0.18

    thresholds = None
    f1_matrix = np.zeros((num_classes, num_points))

    for i in range(num_classes):
        params = generate_random_params(
            mean_peak, mean_baseline_start, mean_baseline_end, mean_center, mean_width
        )
        _, f1_curve = generate_single_f1_curve(*params, num_points)
        f1_matrix[i] = f1_curve

        if thresholds is None:
            thresholds, _ = generate_single_f1_curve(*params, num_points)

    return thresholds, f1_matrix


def plot_multi_f1_curves(thresholds, f1_scores, num_classes):
    plt.figure(figsize=(8, 6))
    for i in range(num_classes):
        plt.plot(thresholds, f1_scores[i], marker="o", label=f"Class {i+1}")
    plt.xlabel("Threshold")
    plt.ylabel("F1 score")
    plt.title("Synthetic Multi-Class F1 vs Threshold")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.show()


def demo_f1_curves(num_classes=4, num_points=20, seed=42):
    thresholds, f1_scores = generate_multi_f1_curves(
        num_classes=num_classes, num_points=num_points, seed=seed
    )

    # Make graps. Uncomment if needed.
    #plot_multi_f1_curves(thresholds, f1_scores, num_classes=num_classes)
    
    return thresholds, f1_scores

