"""
EduPulse AI — Synthetic Dataset Generator
Generates realistic student academic data for ML training.
Run: python data/generate_dataset.py
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)
N = 1000  # number of students

def generate_dataset():
    attendance     = np.random.uniform(40, 100, N).round(1)
    internal1      = np.random.uniform(10, 30, N).round(1)   # out of 30
    internal2      = np.random.uniform(10, 30, N).round(1)
    assignment_avg = np.random.uniform(5, 10, N).round(1)    # out of 10
    cgpa           = np.random.uniform(4.0, 10.0, N).round(2)
    study_hours    = np.random.uniform(1, 8, N).round(1)
    backlogs       = np.random.randint(0, 5, N)

    # ── Performance Score (0-100) ──────────────────────────
    # Weighted formula: attendance(25%) + internals(35%) + cgpa(30%) + study(10%)
    perf_score = (
        (attendance / 100) * 25 +
        ((internal1 + internal2) / 60) * 35 +
        (cgpa / 10) * 30 +
        (study_hours / 8) * 10 -
        backlogs * 2
    ).clip(0, 100).round(1)

    # ── Performance Label ──────────────────────────────────
    perf_label = pd.cut(
        perf_score,
        bins=[0, 40, 60, 80, 100],
        labels=['poor', 'average', 'good', 'excellent']
    )

    # ── Attendance Risk (binary: 1 = at risk) ─────────────
    att_risk = (attendance < 75).astype(int)

    # ── Placement Readiness Score (0-100) ─────────────────
    placement_score = (
        (cgpa / 10) * 40 +
        (attendance / 100) * 20 +
        ((internal1 + internal2) / 60) * 20 +
        (study_hours / 8) * 15 +
        (1 - backlogs / 5) * 5
    ).clip(0, 100).round(1)

    df = pd.DataFrame({
        'attendance_pct':  attendance,
        'internal1_marks': internal1,
        'internal2_marks': internal2,
        'assignment_avg':  assignment_avg,
        'cgpa':            cgpa,
        'study_hours':     study_hours,
        'backlogs':        backlogs,
        'performance_score': perf_score,
        'performance_label': perf_label,
        'attendance_risk':   att_risk,
        'placement_score':   placement_score,
    })

    os.makedirs(os.path.dirname(__file__) or '.', exist_ok=True)
    df.to_csv(os.path.join(os.path.dirname(__file__), 'students.csv'), index=False)
    print(f"[OK] Dataset generated: {N} students -> data/students.csv")
    print(df.head())
    return df

if __name__ == '__main__':
    generate_dataset()
