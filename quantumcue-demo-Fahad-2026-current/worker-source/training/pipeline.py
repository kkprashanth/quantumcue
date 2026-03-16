import os
import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score
import logging

logger = logging.getLogger(__name__)

# Simple in-memory model cache for Project 1 verification
_models = {}

def load_images(data_dir, target_size=(64, 64)):
    """Load and preprocess images from directory"""
    images = []
    labels = []
    
    # Support common image extensions
    valid_extensions = ('.png', '.jpg', '.jpeg', '.bmp', '.webp')
    
    for root, dirs, files in os.walk(data_dir):
        for file in files:
            if file.lower().endswith(valid_extensions):
                try:
                    path = os.path.join(root, file)
                    img = Image.open(path).convert('L') # Grayscale
                    img = img.resize(target_size)
                    img_array = np.array(img).flatten()
                    images.append(img_array)
                    
                    # Use parent directory name as label
                    # If the image is in the root data_dir, use "default"
                    rel_path = os.path.relpath(root, data_dir)
                    if rel_path == '.':
                        label = "default"
                    else:
                        # Use the most immediate parent directory name
                        label = os.path.basename(root)
                    
                    labels.append(label)
                except Exception as e:
                    logger.error(f"Error loading image {file}: {e}")
    
    return np.array(images), np.array(labels)

def train_placeholder_model(data_dir):
    """Run simple training and return metrics"""
    logger.info(f"Starting training on data in {data_dir}")
    
    X, y = load_images(data_dir)
    
    if len(X) < 1:
        logger.error("No images found for training")
        raise ValueError("Cannot train model: No .png images found in dataset workspace")
    
    if len(X) < 10:
        logger.warning(f"Very small dataset (found {len(X)} images). Training may be unstable.")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=10)
    model.fit(X_train, y_train)
    
    # Cache model for inference
    _models[data_dir] = model
    
    y_pred = model.predict(X_test)
    
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
    }
    
    logger.info(f"Training complete. Metrics: {metrics}")
    return metrics

def predict_sample(data_dir, image_path, target_size=(64, 64)):
    """Predict class for a sample image"""
    model = _models.get(data_dir)
    if not model:
        logger.error(f"No model loaded for workspace {data_dir}")
        return {"error": f"No model found for the specified workspace. Please ensure training completed for this job."}
    
    try:
        img = Image.open(image_path).convert('L')
        img = img.resize(target_size)
        img_array = np.array(img).flatten().reshape(1, -1)
        
        prediction = model.predict(img_array)[0]
        # RandomForest doesn't directly give confidence easily without more setup,
        # but we can use predict_proba
        proba = model.predict_proba(img_array)[0]
        confidence = float(np.max(proba))
        
        return {"class": str(prediction), "confidence": confidence}
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        return {"error": str(e)}
