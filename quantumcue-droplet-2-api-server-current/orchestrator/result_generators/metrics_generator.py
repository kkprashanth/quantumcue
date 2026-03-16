import numpy as np
#import matplotlib.pyplot as plt

def generate_ml_metrics(num_classes=4, seed=None):
    """
    Generate synthetic ML metrics per class.
    Each metric is sampled around a realistic mean, clipped to [0.80, 0.95].

    Args:
        num_classes: Number of classes.
        seed: Random seed for reproducibility.

    Returns:
        dict: keys = metric names, values = np.array[num_classes]
    """
    rng = np.random.default_rng(seed)

    metric_specs = {
        "accuracy": (0.89, 0.030),
        "precision": (0.88, 0.028),
        "auc_roc":   (0.93, 0.022),
        "auc_pr":    (0.90, 0.028),
        "max_f1":    (0.87, 0.030),
    }

    metrics = {}
    for name, (mean, std) in metric_specs.items():
        values = rng.normal(loc=mean, scale=std, size=num_classes)
        metrics[name] = np.clip(values, 0.80, 0.95)

    return metrics


def print_ml_metrics(metrics, num_classes):
    """Print metrics table to console."""
    header = f"{'Class':<8}" + "".join(f"{k.upper():>12}" for k in metrics)
    print(header)
    print("-" * len(header))
    for i in range(num_classes):
        row = f"{i + 1:<8}" + "".join(f"{metrics[k][i]:>12.4f}" for k in metrics)
        print(row)


def plot_ml_metrics(metrics, num_classes):
    """
    Plot each metric as a bar chart (one subplot per metric).
    Y-axis limited to [0.75, 1.0] for visibility.
    """
    metric_names = list(metrics.keys())
    n_metrics = len(metric_names)
    classes = [f"Class {i+1}" for i in range(num_classes)]

    fig, axes = plt.subplots(1, n_metrics, figsize=(4 * n_metrics, 5))
    fig.suptitle("Synthetic ML Metrics per Class", fontsize=14)

    for ax, name in zip(axes, metric_names):
        values = metrics[name]
        bars = ax.bar(classes, values, alpha=0.8, edgecolor="navy", color="skyblue")
        ax.set_title(name.upper().replace("_", "-"), fontsize=11)
        ax.set_ylim(0.75, 1.0)
        ax.set_ylabel("Score")
        ax.grid(True, axis="y", alpha=0.3)
        ax.tick_params(axis="x", rotation=30)

        for bar, val in zip(bars, values):
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.003,
                f"{val:.3f}",
                ha="center", va="bottom", fontsize=9
            )

    plt.tight_layout()
    plt.show()


def demo_ml_metrics(num_classes=4, seed=42):
    """
    Generate, print, and plot synthetic ML metrics.

    Args:
        num_classes: Number of classes.
        seed: Random seed.

    Returns:
        metrics: dict of np.arrays
    """
    metrics = generate_ml_metrics(num_classes=num_classes, seed=seed)
    print_ml_metrics(metrics, num_classes=num_classes)

    # Make graps. Uncomment if needed.
    #plot_ml_metrics(metrics, num_classes=num_classes)
    
    return metrics

