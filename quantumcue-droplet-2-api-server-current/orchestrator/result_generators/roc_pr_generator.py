import numpy as np
#import matplotlib.pyplot as plt

def generate_single_roc_curve(roc_level=0.94, num_points=50, seed=None):
    """
    Smooth ROC curve (TPR vs FPR), no inflection, well above diagonal.
    Tuned to look like the attached example: very steep near FPR=0, then saturating. [file:26]

    Uses a normalized rational form:
        tpr = (1+a) * fpr / (fpr + a)
    where 'a' is chosen so the curve approximately passes near (fpr=0.1, tpr=roc_level).

    Args:
        roc_level: Target TPR around FPR=0.1 (roughly 0.90-0.99).
        num_points: Number of points along the curve.
        seed: Optional seed for slight deterministic variation.

    Returns:
        fpr, tpr: np.arrays
    """
    rng = np.random.default_rng(seed)

    # Use a standard ROC domain
    fpr = np.linspace(0.0, 1.0, num_points)

    # Choose 'a' so that tpr(0.1) ~= roc_level (requires roc_level > 0.1)
    x0 = 0.10
    t0 = float(np.clip(roc_level, x0 + 1e-3, 0.999))

    # From t = (1+a)*x/(x+a)  =>  a = x*(1-t)/(t-x)
    a = x0 * (1.0 - t0) / (t0 - x0)

    # Small per-call variation (keeps same overall shape)
    a *= float(rng.normal(1.0, 0.04))
    a = float(np.clip(a, 1e-4, 0.2))

    # Smooth, concave-down saturation curve (no inflection)
    tpr = (1.0 + a) * fpr / (fpr + a + 1e-12)

    # Make endpoints exact and enforce monotone increasing (ROC-valid)
    tpr[0] = 0.0
    tpr[-1] = 1.0
    tpr = np.maximum.accumulate(tpr)
    tpr = np.clip(tpr, 0.0, 1.0)

    return fpr, tpr


def generate_multi_roc_curves(num_classes, num_points=50, seed=None):
    """Generate multiple slightly different smooth ROC curves."""
    rng = np.random.default_rng(seed)

    roc_curves = []
    for i in range(num_classes):
        roc_level = float(np.clip(rng.normal(0.94, 0.015), 0.90, 0.99))
        # Use a deterministic per-class seed if you want repeatability even without global seed
        fpr, tpr = generate_single_roc_curve(roc_level=roc_level, num_points=num_points, seed=None)
        roc_curves.append((fpr, tpr))

    return roc_curves

def generate_multi_roc_curves_experinmental(num_classes, num_points=50, seed=None):
    """ returns lists instead of np objects. """
    rng = np.random.default_rng(seed)
    roc_curves = []
    for i in range(num_classes):
        roc_level = float(np.clip(rng.normal(0.94, 0.015), 0.90, 0.99))
        fpr, tpr = generate_single_roc_curve(roc_level=roc_level, num_points=num_points, seed=None)
        roc_curves.append({"fpr": fpr.tolist(), "tpr": tpr.tolist()})
    return roc_curves



def plot_multi_roc_curves(roc_curves, num_classes):
    """Plot multiple ROC curves."""
    plt.figure(figsize=(8, 6))
    for i, (fpr, tpr) in enumerate(roc_curves):
        plt.plot(fpr, tpr, marker="o", linewidth=2.0, label=f"Class {i+1}")
    plt.plot([0, 1], [0, 1], "k--", linewidth=1.0, label="Random (diagonal)")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("Synthetic Multi-Class ROC Curves")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.axis([0, 1, 0, 1])
    plt.show()


def generate_single_pr_curve(pr_level=0.14, num_points=50, seed=None):
    """
    Smooth decreasing PR curve (Precision vs Recall):
    starts at (0,1), stays high for most recall, then drops sharply near recall=1,
    similar to the attached example. [file:42]

    Args:
        pr_level: Shape control (roughly 0.08-0.25). Higher => later/sharper end-drop.
        num_points: Number of points.
        seed: Optional seed.

    Returns:
        recall, precision: np.arrays
    """
    rng = np.random.default_rng(seed)

    recall = np.linspace(0.0, 1.0, num_points)

    # Map pr_level to a "late drop" steepness (p). Larger p => flatter early, steeper near 1.
    pr_level = float(np.clip(pr_level, 0.05, 0.6))
    p = float(np.clip(2.0 + 35.0 * pr_level, 4.5, 10.5))

    # Target point to roughly match the figure: around (0.8, 0.8), with slight variation per run.
    r0 = 0.80
    target = float(np.clip(rng.normal(0.80, 0.02), 0.75, 0.86))

    # Use precision = (1 - recall^p)^q with q chosen so precision(r0) ~= target.
    base0 = 1.0 - (r0 ** p)
    base0 = max(base0, 1e-6)
    q = float(np.log(target) / np.log(base0))

    precision = (1.0 - recall ** p) ** q

    # Exact endpoints
    precision[0] = 1.0
    precision[-1] = 0.0

    # Enforce monotone decreasing (safe-guard)
    precision = np.minimum.accumulate(precision)
    precision = np.clip(precision, 0.0, 1.0)

    return recall, precision



def generate_multi_pr_curves(num_classes, num_points=50, seed=None):
    """Generate multiple slightly different smooth PR curves."""
    rng = np.random.default_rng(seed)

    pr_curves = []
    for i in range(num_classes):
        pr_level = float(np.clip(rng.normal(0.14, 0.02), 0.08, 0.25))
        recall, precision = generate_single_pr_curve(pr_level=pr_level, num_points=num_points, seed=None)
        pr_curves.append((recall, precision))

    return pr_curves


def generate_multi_pr_curves_experimental(num_classes, num_points=50, seed=None):
    """ returns lists instead of np objects. """
    rng = np.random.default_rng(seed)
    pr_curves = []
    for i in range(num_classes):
        pr_level = float(np.clip(rng.normal(0.14, 0.02), 0.08, 0.25))
        recall, precision = generate_single_pr_curve(pr_level=pr_level, num_points=num_points, seed=None)
        pr_curves.append({"recall": recall.tolist(), "precision": precision.tolist()})
    return pr_curves


def plot_multi_pr_curves(pr_curves, num_classes):
    """Plot multiple PR curves."""
    plt.figure(figsize=(8, 6))
    for i, (recall, precision) in enumerate(pr_curves):
        plt.plot(recall, precision, marker="o", linewidth=2.0, label=f"Class {i+1}")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title("Synthetic Multi-Class PR Curves")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.axis([0, 1, 0, 1])
    plt.show()


def demo_roc_curves(num_classes=4, num_points=50, seed=42):
    roc_curves = generate_multi_roc_curves(num_classes=num_classes, num_points=num_points, seed=seed)
    #plot_multi_roc_curves(roc_curves, num_classes=num_classes)
    return roc_curves


def demo_pr_curves(num_classes=4, num_points=50, seed=42):
    pr_curves = generate_multi_pr_curves(num_classes=num_classes, num_points=num_points, seed=seed)
    
    # Make graps. Uncomment if needed.
    #plot_multi_pr_curves(pr_curves, num_classes=num_classes)
    
    return pr_curves

