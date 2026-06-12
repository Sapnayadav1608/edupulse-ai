"""
EduPulse AI - ML Model Training Script
Trains 3 models:
  1. Performance Predictor     (RandomForest Classifier -> poor/average/good/excellent)
  2. Attendance Risk Predictor (RandomForest Classifier -> 0=safe, 1=at_risk)
  3. Placement Score Predictor (RandomForest Regressor  -> 0-100 score)

Run: python training/train_model.py
"""

import os
import sys
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, mean_absolute_error, classification_report

# Paths
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH  = os.path.join(BASE_DIR, 'data', 'students.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURES = [
    'attendance_pct',
    'internal1_marks',
    'internal2_marks',
    'assignment_avg',
    'cgpa',
    'study_hours',
    'backlogs',
]

def load_data():
    if not os.path.exists(DATA_PATH):
        print("[ERROR] Dataset not found. Run: python data/generate_dataset.py first")
        sys.exit(1)
    df = pd.read_csv(DATA_PATH)
    print(f"[OK] Loaded dataset: {len(df)} rows")
    return df

def train_performance_model(df):
    print("\n[1/3] Training Performance Predictor...")
    le = LabelEncoder()
    y  = le.fit_transform(df['performance_label'])
    X  = df[FEATURES]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    y_pred   = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"    Accuracy: {accuracy:.2%}")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    joblib.dump(model, os.path.join(MODELS_DIR, 'performance_model.pkl'))
    joblib.dump(le,    os.path.join(MODELS_DIR, 'performance_encoder.pkl'))
    print("    [SAVED] models/performance_model.pkl")
    return accuracy

def train_attendance_model(df):
    print("\n[2/3] Training Attendance Risk Predictor...")
    y = df['attendance_risk']
    X = df[FEATURES]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    y_pred   = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"    Accuracy: {accuracy:.2%}")
    print(classification_report(y_test, y_pred, target_names=['Safe', 'At Risk']))
    joblib.dump(model, os.path.join(MODELS_DIR, 'attendance_model.pkl'))
    print("    [SAVED] models/attendance_model.pkl")
    return accuracy

def train_placement_model(df):
    print("\n[3/3] Training Placement Score Predictor...")
    y = df['placement_score']
    X = df[FEATURES]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    print(f"    Mean Absolute Error: {mae:.2f} points")
    joblib.dump(model, os.path.join(MODELS_DIR, 'placement_model.pkl'))
    print("    [SAVED] models/placement_model.pkl")
    return mae

def save_metadata():
    meta = {'features': FEATURES, 'version': '1.0.0'}
    joblib.dump(meta, os.path.join(MODELS_DIR, 'metadata.pkl'))
    print("\n[SAVED] models/metadata.pkl")

if __name__ == '__main__':
    df = load_data()
    perf_acc  = train_performance_model(df)
    att_acc   = train_attendance_model(df)
    place_mae = train_placement_model(df)
    save_metadata()
    print("\n" + "="*50)
    print("[DONE] All models trained successfully!")
    print(f"   Performance Accuracy : {perf_acc:.2%}")
    print(f"   Attendance Accuracy  : {att_acc:.2%}")
    print(f"   Placement MAE        : {place_mae:.2f} pts")
    print("="*50)
    print("\nNext: Run the Flask API -> python api/app.py")
