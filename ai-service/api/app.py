"""
EduPulse AI - Flask Prediction API
Endpoints:
  POST /predict/performance   -> poor / average / good / excellent
  POST /predict/attendance    -> safe / at_risk + risk percentage
  POST /predict/placement     -> placement readiness score (0-100)
  POST /predict/full          -> all 3 predictions in one call
  GET  /health                -> health check

Run: python api/app.py
"""

import os
import sys
import joblib
import random
import numpy as np
import spacy
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Load Models
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

models = {}

def load_models():
    required = [
        'performance_model.pkl',
        'performance_encoder.pkl',
        'attendance_model.pkl',
        'placement_model.pkl',
    ]
    missing = [f for f in required if not os.path.exists(os.path.join(MODELS_DIR, f))]
    if missing:
        print(f"[ERROR] Missing model files: {missing}")
        print("   Run: python training/train_model.py")
        sys.exit(1)

    models['performance']         = joblib.load(os.path.join(MODELS_DIR, 'performance_model.pkl'))
    models['performance_encoder'] = joblib.load(os.path.join(MODELS_DIR, 'performance_encoder.pkl'))
    models['attendance']          = joblib.load(os.path.join(MODELS_DIR, 'attendance_model.pkl'))
    models['placement']           = joblib.load(os.path.join(MODELS_DIR, 'placement_model.pkl'))
    print("[OK] All models loaded successfully")

FEATURES = [
    'attendance_pct',
    'internal1_marks',
    'internal2_marks',
    'assignment_avg',
    'cgpa',
    'study_hours',
    'backlogs',
]

def extract_features(data):
    try:
        features = [
            float(data.get('attendance_pct',  75)),
            float(data.get('internal1_marks', 20)),
            float(data.get('internal2_marks', 20)),
            float(data.get('assignment_avg',   7)),
            float(data.get('cgpa',            7.0)),
            float(data.get('study_hours',      4)),
            float(data.get('backlogs',         0)),
        ]
        return np.array(features).reshape(1, -1)
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid input data: {e}")

def get_recommendations(label, data):
    recs = []
    att  = float(data.get('attendance_pct', 75))
    cgpa = float(data.get('cgpa', 7.0))
    bl   = float(data.get('backlogs', 0))
    sh   = float(data.get('study_hours', 4))

    if att < 75:
        recs.append("WARNING: Attendance below 75% - risk of being detained. Attend all classes immediately.")
    if cgpa < 6.0:
        recs.append("CGPA is low - focus on weak subjects and seek faculty guidance.")
    if bl > 0:
        recs.append(f"Clear {int(bl)} backlog(s) as soon as possible to improve academic standing.")
    if sh < 3:
        recs.append("Increase daily study hours to at least 3-4 hours for better performance.")

    if label == 'excellent':
        recs.append("Excellent performance! Consider applying for scholarships and competitive exams.")
    elif label == 'good':
        recs.append("Good performance! Push a little harder to reach excellent grade.")
    elif label == 'average':
        recs.append("Average performance - consistent effort can move you to good category.")
    elif label == 'poor':
        recs.append("Poor performance - seek immediate help from faculty and counselor.")

    return recs if recs else ["Keep up the good work and maintain consistency!"]


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'EduPulse AI Service Running',
        'models': list(models.keys()),
        'version': '1.0.0'
    })


@app.route('/predict/performance', methods=['POST'])
def predict_performance():
    try:
        data    = request.get_json()
        X       = extract_features(data)
        model   = models['performance']
        encoder = models['performance_encoder']

        pred_idx   = model.predict(X)[0]
        pred_label = encoder.inverse_transform([pred_idx])[0]
        proba      = model.predict_proba(X)[0]
        confidence = round(float(max(proba)) * 100, 1)

        class_proba = {
            encoder.inverse_transform([i])[0]: round(float(p) * 100, 1)
            for i, p in enumerate(proba)
        }

        att  = float(data.get('attendance_pct', 75))
        i1   = float(data.get('internal1_marks', 20))
        i2   = float(data.get('internal2_marks', 20))
        cgpa = float(data.get('cgpa', 7.0))
        sh   = float(data.get('study_hours', 4))
        bl   = float(data.get('backlogs', 0))
        score = min(100, max(0, round(
            (att / 100) * 25 + ((i1 + i2) / 60) * 35 + (cgpa / 10) * 30 + (sh / 8) * 10 - bl * 2, 1
        )))

        return jsonify({
            'success':             True,
            'prediction':          pred_label,
            'confidence':          confidence,
            'performance_score':   score,
            'class_probabilities': class_proba,
            'recommendations':     get_recommendations(pred_label, data),
        })
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/predict/attendance', methods=['POST'])
def predict_attendance():
    try:
        data  = request.get_json()
        X     = extract_features(data)
        model = models['attendance']

        pred       = model.predict(X)[0]
        proba      = model.predict_proba(X)[0]
        risk_pct   = round(float(proba[1]) * 100, 1)
        risk_level = 'at_risk' if pred == 1 else 'safe'
        att        = float(data.get('attendance_pct', 75))

        if att < 65:
            alert = "CRITICAL: Attendance below 65%. Immediate action required - risk of detention!"
        elif att < 75:
            alert = "WARNING: Attendance below 75%. You may be barred from exams."
        elif att < 85:
            alert = "CAUTION: Attendance is borderline. Avoid missing any more classes."
        else:
            alert = "Attendance is healthy. Keep it up!"

        return jsonify({
            'success':        True,
            'risk_level':     risk_level,
            'risk_percentage': risk_pct,
            'attendance_pct': att,
            'alert_message':  alert,
            'is_defaulter':   att < 75,
        })
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/predict/placement', methods=['POST'])
def predict_placement():
    try:
        data  = request.get_json()
        X     = extract_features(data)
        model = models['placement']

        score = round(float(model.predict(X)[0]), 1)
        score = min(100, max(0, score))

        if score >= 80:   readiness, badge = 'highly_ready',    'Highly Ready'
        elif score >= 60: readiness, badge = 'ready',           'Ready'
        elif score >= 40: readiness, badge = 'partially_ready', 'Partially Ready'
        else:             readiness, badge = 'not_ready',       'Not Ready'

        cgpa = float(data.get('cgpa', 7.0))
        att  = float(data.get('attendance_pct', 75))
        bl   = float(data.get('backlogs', 0))
        sh   = float(data.get('study_hours', 4))

        strengths, improvements = [], []

        if cgpa >= 7.5:  strengths.append(f"Strong CGPA ({cgpa})")
        else:            improvements.append(f"Improve CGPA (current: {cgpa}, target: 7.5+)")
        if att >= 85:    strengths.append(f"Excellent attendance ({att}%)")
        elif att >= 75:  strengths.append(f"Adequate attendance ({att}%)")
        else:            improvements.append(f"Improve attendance (current: {att}%, minimum: 75%)")
        if bl == 0:      strengths.append("No backlogs - clean academic record")
        else:            improvements.append(f"Clear {int(bl)} backlog(s) before placement season")
        if sh >= 5:      strengths.append(f"Good study habit ({sh} hrs/day)")
        else:            improvements.append(f"Increase study hours (current: {sh}, target: 5+)")

        improvements.append("Practice DSA on LeetCode/HackerRank daily")
        improvements.append("Build 2-3 projects and push to GitHub")

        return jsonify({
            'success':         True,
            'placement_score': score,
            'readiness_level': readiness,
            'badge':           badge,
            'strengths':       strengths,
            'improvements':    improvements,
        })
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/predict/full', methods=['POST'])
def predict_full():
    try:
        data = request.get_json()
        X    = extract_features(data)

        # Performance
        perf_model   = models['performance']
        perf_encoder = models['performance_encoder']
        perf_idx     = perf_model.predict(X)[0]
        perf_label   = perf_encoder.inverse_transform([perf_idx])[0]
        perf_proba   = perf_model.predict_proba(X)[0]
        perf_conf    = round(float(max(perf_proba)) * 100, 1)

        att_val = float(data.get('attendance_pct', 75))
        i1      = float(data.get('internal1_marks', 20))
        i2      = float(data.get('internal2_marks', 20))
        cgpa    = float(data.get('cgpa', 7.0))
        sh      = float(data.get('study_hours', 4))
        bl      = float(data.get('backlogs', 0))

        perf_score = min(100, max(0, round(
            (att_val / 100) * 25 + ((i1 + i2) / 60) * 35 + (cgpa / 10) * 30 + (sh / 8) * 10 - bl * 2, 1
        )))

        # Attendance Risk
        att_model = models['attendance']
        att_pred  = att_model.predict(X)[0]
        att_proba = att_model.predict_proba(X)[0]
        risk_pct  = round(float(att_proba[1]) * 100, 1)

        # Placement
        place_model = models['placement']
        place_score = round(float(place_model.predict(X)[0]), 1)
        place_score = min(100, max(0, place_score))

        if place_score >= 80:   place_badge = 'Highly Ready'
        elif place_score >= 60: place_badge = 'Ready'
        elif place_score >= 40: place_badge = 'Partially Ready'
        else:                   place_badge = 'Not Ready'

        return jsonify({
            'success': True,
            'performance': {
                'label':           perf_label,
                'confidence':      perf_conf,
                'score':           perf_score,
                'recommendations': get_recommendations(perf_label, data),
            },
            'attendance': {
                'risk_level':      'at_risk' if att_pred == 1 else 'safe',
                'risk_percentage': risk_pct,
                'is_defaulter':    att_val < 75,
            },
            'placement': {
                'score': place_score,
                'badge': place_badge,
            },
        })
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'Prediction failed: {str(e)}'}), 500


# ── NLP Quiz Templates ────────────────────────────────────

# Subject-specific question bank
QUESTION_BANK = {
    'data structures': [
        {'q': 'What is the time complexity of binary search?', 'opts': ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], 'ans': 1},
        {'q': 'Which data structure uses LIFO order?', 'opts': ['Queue', 'Stack', 'Tree', 'Graph'], 'ans': 1},
        {'q': 'What is the time complexity of inserting into a hash table (average)?', 'opts': ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], 'ans': 2},
        {'q': 'Which traversal visits root first?', 'opts': ['Inorder', 'Postorder', 'Preorder', 'Level order'], 'ans': 2},
        {'q': 'What is the maximum number of nodes in a binary tree of height h?', 'opts': ['2h', '2h-1', '2^(h+1)-1', 'h²'], 'ans': 2},
        {'q': 'Which data structure is used for BFS?', 'opts': ['Stack', 'Queue', 'Heap', 'Array'], 'ans': 1},
        {'q': 'What is a linked list node composed of?', 'opts': ['Only data', 'Data and pointer', 'Only pointer', 'Key and value'], 'ans': 1},
        {'q': 'Which sorting algorithm has best average case O(n log n)?', 'opts': ['Bubble sort', 'Insertion sort', 'Merge sort', 'Selection sort'], 'ans': 2},
        {'q': 'What is a full binary tree?', 'opts': ['Every node has 2 children', 'All leaves at same level', 'Every node has 0 or 2 children', 'Root has no children'], 'ans': 2},
        {'q': 'Which data structure is used in recursion?', 'opts': ['Queue', 'Stack', 'Array', 'Linked list'], 'ans': 1},
    ],
    'database': [
        {'q': 'What does SQL stand for?', 'opts': ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'Sequential Query Language'], 'ans': 0},
        {'q': 'Which SQL command retrieves data?', 'opts': ['INSERT', 'UPDATE', 'SELECT', 'DELETE'], 'ans': 2},
        {'q': 'What is a primary key?', 'opts': ['Duplicate allowed', 'Uniquely identifies a row', 'Can be NULL', 'Foreign reference'], 'ans': 1},
        {'q': 'Which normal form removes partial dependencies?', 'opts': ['1NF', '2NF', '3NF', 'BCNF'], 'ans': 1},
        {'q': 'What is a foreign key?', 'opts': ['Primary key of same table', 'References primary key of another table', 'Unique key', 'Composite key'], 'ans': 1},
        {'q': 'Which JOIN returns all rows from both tables?', 'opts': ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], 'ans': 3},
        {'q': 'What does ACID stand for in databases?', 'opts': ['Atomicity Consistency Isolation Durability', 'Access Control Integrity Data', 'Atomic Concurrent Isolated Durable', 'None of these'], 'ans': 0},
        {'q': 'Which command removes a table permanently?', 'opts': ['DELETE', 'TRUNCATE', 'DROP', 'REMOVE'], 'ans': 2},
        {'q': 'What is an index in a database?', 'opts': ['A backup', 'Speeds up data retrieval', 'A constraint', 'A view'], 'ans': 1},
        {'q': 'Which aggregate function returns the number of rows?', 'opts': ['SUM', 'AVG', 'COUNT', 'MAX'], 'ans': 2},
    ],
    'operating system': [
        {'q': 'What is a process?', 'opts': ['A program on disk', 'A program in execution', 'A file', 'A thread'], 'ans': 1},
        {'q': 'Which scheduling algorithm gives CPU to shortest job first?', 'opts': ['FCFS', 'Round Robin', 'SJF', 'Priority'], 'ans': 2},
        {'q': 'What is deadlock?', 'opts': ['Process waiting forever', 'CPU idle', 'Memory overflow', 'Disk failure'], 'ans': 0},
        {'q': 'What is virtual memory?', 'opts': ['RAM extension using disk', 'Cache memory', 'ROM', 'GPU memory'], 'ans': 0},
        {'q': 'Which is NOT a condition for deadlock?', 'opts': ['Mutual exclusion', 'Preemption', 'Hold and wait', 'Circular wait'], 'ans': 1},
        {'q': 'What does CPU scheduling decide?', 'opts': ['Memory allocation', 'Which process runs next', 'Disk access', 'Network packets'], 'ans': 1},
        {'q': 'What is a semaphore used for?', 'opts': ['Memory management', 'Process synchronization', 'File handling', 'CPU scheduling'], 'ans': 1},
        {'q': 'What is thrashing?', 'opts': ['High CPU usage', 'Excessive paging causing low CPU utilization', 'Disk crash', 'Memory leak'], 'ans': 1},
        {'q': 'Which memory allocation avoids external fragmentation?', 'opts': ['Fixed partitioning', 'Paging', 'Segmentation', 'Contiguous allocation'], 'ans': 1},
        {'q': 'What is a context switch?', 'opts': ['Saving and loading process state', 'Switching users', 'Changing file system', 'Network switch'], 'ans': 0},
    ],
    'computer network': [
        {'q': 'What does IP stand for?', 'opts': ['Internet Protocol', 'Internal Process', 'Input Port', 'Interface Protocol'], 'ans': 0},
        {'q': 'Which layer handles routing in OSI model?', 'opts': ['Physical', 'Data Link', 'Network', 'Transport'], 'ans': 2},
        {'q': 'What is the full form of HTTP?', 'opts': ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Hyper Transfer Text Process', 'None'], 'ans': 0},
        {'q': 'Which protocol is used for email sending?', 'opts': ['FTP', 'SMTP', 'HTTP', 'DNS'], 'ans': 1},
        {'q': 'What is the default port for HTTPS?', 'opts': ['80', '21', '443', '22'], 'ans': 2},
        {'q': 'What does DNS do?', 'opts': ['Assigns IP addresses', 'Translates domain names to IP', 'Encrypts data', 'Routes packets'], 'ans': 1},
        {'q': 'Which topology connects all nodes to a central hub?', 'opts': ['Bus', 'Ring', 'Star', 'Mesh'], 'ans': 2},
        {'q': 'What is the purpose of a subnet mask?', 'opts': ['Encrypt data', 'Divide network into subnets', 'Assign MAC address', 'Route packets'], 'ans': 1},
        {'q': 'Which protocol provides reliable transmission?', 'opts': ['UDP', 'IP', 'TCP', 'ARP'], 'ans': 2},
        {'q': 'What is bandwidth?', 'opts': ['Signal strength', 'Maximum data transfer rate', 'Latency', 'Packet size'], 'ans': 1},
    ],
    'python': [
        {'q': 'Which keyword defines a function in Python?', 'opts': ['func', 'define', 'def', 'function'], 'ans': 2},
        {'q': 'What is the output of type([]) in Python?', 'opts': ["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", "<class 'set'>"], 'ans': 1},
        {'q': 'Which is immutable in Python?', 'opts': ['List', 'Dictionary', 'Set', 'Tuple'], 'ans': 3},
        {'q': 'What does len() return?', 'opts': ['Last element', 'Number of elements', 'First element', 'Sum'], 'ans': 1},
        {'q': 'Which operator is used for floor division?', 'opts': ['/', '%', '//', '**'], 'ans': 2},
        {'q': 'What is a lambda function?', 'opts': ['Named function', 'Anonymous function', 'Recursive function', 'Class method'], 'ans': 1},
        {'q': 'Which method adds an element to a list?', 'opts': ['add()', 'insert()', 'append()', 'push()'], 'ans': 2},
        {'q': 'What does __init__ do in a class?', 'opts': ['Destroys object', 'Initializes object', 'Copies object', 'Prints object'], 'ans': 1},
        {'q': 'Which module is used for regular expressions?', 'opts': ['os', 'sys', 're', 'math'], 'ans': 2},
        {'q': 'What is list comprehension?', 'opts': ['Sorting a list', 'Concise way to create lists', 'Merging lists', 'Copying lists'], 'ans': 1},
    ],
    'machine learning': [
        {'q': 'What is supervised learning?', 'opts': ['Learning without labels', 'Learning with labeled data', 'Reinforcement learning', 'Clustering'], 'ans': 1},
        {'q': 'Which algorithm is used for classification?', 'opts': ['Linear regression', 'K-means', 'Decision tree', 'PCA'], 'ans': 2},
        {'q': 'What is overfitting?', 'opts': ['Model too simple', 'Model performs well on training but poor on test', 'Model with no parameters', 'Underfitting'], 'ans': 1},
        {'q': 'What does gradient descent minimize?', 'opts': ['Accuracy', 'Loss function', 'Features', 'Epochs'], 'ans': 1},
        {'q': 'What is a confusion matrix used for?', 'opts': ['Feature selection', 'Evaluating classification model', 'Data preprocessing', 'Clustering'], 'ans': 1},
        {'q': 'What is the purpose of train-test split?', 'opts': ['Speed up training', 'Evaluate model on unseen data', 'Reduce features', 'Normalize data'], 'ans': 1},
        {'q': 'Which is an unsupervised learning algorithm?', 'opts': ['SVM', 'Random Forest', 'K-means', 'Logistic Regression'], 'ans': 2},
        {'q': 'What is regularization?', 'opts': ['Increase model complexity', 'Prevent overfitting by penalizing complexity', 'Data augmentation', 'Feature scaling'], 'ans': 1},
        {'q': 'What does CNN stand for?', 'opts': ['Convolutional Neural Network', 'Connected Node Network', 'Cyclic Neural Net', 'None'], 'ans': 0},
        {'q': 'What is the activation function in neural networks?', 'opts': ['Loss function', 'Introduces non-linearity', 'Optimizer', 'Regularizer'], 'ans': 1},
    ],
    'mathematics': [
        {'q': 'What is the derivative of sin(x)?', 'opts': ['-cos(x)', 'cos(x)', 'tan(x)', '-sin(x)'], 'ans': 1},
        {'q': 'What is the value of log(1)?', 'opts': ['1', '0', 'undefined', 'infinity'], 'ans': 1},
        {'q': 'What is the determinant of identity matrix?', 'opts': ['0', '-1', '1', 'undefined'], 'ans': 2},
        {'q': 'What is the integral of 1/x?', 'opts': ['x', 'ln|x|', '1/x²', 'e^x'], 'ans': 1},
        {'q': 'What is the rank of a zero matrix?', 'opts': ['1', 'undefined', '0', 'n'], 'ans': 2},
        {'q': 'What is the sum of angles in a triangle?', 'opts': ['90°', '360°', '180°', '270°'], 'ans': 2},
        {'q': 'What is the Pythagorean theorem?', 'opts': ['a+b=c', 'a²+b²=c²', 'a²-b²=c', 'ab=c²'], 'ans': 1},
        {'q': 'What is the value of e (Euler number) approximately?', 'opts': ['3.14', '1.41', '2.71', '1.73'], 'ans': 2},
        {'q': 'What is a prime number?', 'opts': ['Divisible by 2', 'Divisible only by 1 and itself', 'Even number', 'Multiple of 3'], 'ans': 1},
        {'q': 'What is the derivative of e^x?', 'opts': ['xe^(x-1)', 'e^x', 'e^(x+1)', '1/e^x'], 'ans': 1},
    ],
    'physics': [
        {'q': "What is Newton's second law?", 'opts': ['F=mv', 'F=ma', 'F=m/a', 'F=a/m'], 'ans': 1},
        {'q': 'What is the unit of force?', 'opts': ['Joule', 'Watt', 'Newton', 'Pascal'], 'ans': 2},
        {'q': 'What is the speed of light?', 'opts': ['3×10⁶ m/s', '3×10⁸ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'], 'ans': 1},
        {'q': 'What is Ohm\'s law?', 'opts': ['V=IR', 'V=I/R', 'V=I+R', 'V=I²R'], 'ans': 0},
        {'q': 'What is the unit of electric current?', 'opts': ['Volt', 'Watt', 'Ampere', 'Ohm'], 'ans': 2},
        {'q': 'What is kinetic energy formula?', 'opts': ['mgh', '½mv²', 'mv', 'Fd'], 'ans': 1},
        {'q': 'What is the SI unit of pressure?', 'opts': ['Newton', 'Joule', 'Pascal', 'Bar'], 'ans': 2},
        {'q': 'What is the law of conservation of energy?', 'opts': ['Energy can be created', 'Energy can be destroyed', 'Energy cannot be created or destroyed', 'Energy is always kinetic'], 'ans': 2},
        {'q': 'What is frequency measured in?', 'opts': ['Meter', 'Second', 'Hertz', 'Watt'], 'ans': 2},
        {'q': 'What is the gravitational acceleration on Earth?', 'opts': ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '7.8 m/s²'], 'ans': 1},
    ],
    'chemistry': [
        {'q': 'What is the atomic number of Carbon?', 'opts': ['4', '6', '8', '12'], 'ans': 1},
        {'q': 'What is the chemical formula of water?', 'opts': ['HO', 'H₂O₂', 'H₂O', 'OH'], 'ans': 2},
        {'q': 'What is pH of pure water?', 'opts': ['0', '14', '7', '5'], 'ans': 2},
        {'q': 'What is the valency of oxygen?', 'opts': ['1', '3', '4', '2'], 'ans': 3},
        {'q': 'Which gas is produced during photosynthesis?', 'opts': ['CO₂', 'N₂', 'O₂', 'H₂'], 'ans': 2},
        {'q': 'What is the chemical symbol for Gold?', 'opts': ['Go', 'Gd', 'Au', 'Ag'], 'ans': 2},
        {'q': 'What is an acid?', 'opts': ['Donates OH⁻', 'Donates H⁺', 'Neutral substance', 'Base'], 'ans': 1},
        {'q': 'What is the molar mass of CO₂?', 'opts': ['28 g/mol', '32 g/mol', '44 g/mol', '40 g/mol'], 'ans': 2},
        {'q': 'What is Avogadro\'s number?', 'opts': ['6.022×10²³', '3.14×10²³', '1.6×10⁻¹⁹', '9.8×10²³'], 'ans': 0},
        {'q': 'Which is the most electronegative element?', 'opts': ['Oxygen', 'Chlorine', 'Nitrogen', 'Fluorine'], 'ans': 3},
    ],
    'general': [
        {'q': 'What does CPU stand for?', 'opts': ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Core Processing Unit'], 'ans': 0},
        {'q': 'What is RAM?', 'opts': ['Read Access Memory', 'Random Access Memory', 'Rapid Access Module', 'Read And Modify'], 'ans': 1},
        {'q': 'What is the binary representation of decimal 10?', 'opts': ['1010', '1100', '1001', '0110'], 'ans': 0},
        {'q': 'What is an algorithm?', 'opts': ['A programming language', 'Step-by-step problem solving procedure', 'A data structure', 'A software'], 'ans': 1},
        {'q': 'What is the full form of URL?', 'opts': ['Uniform Resource Locator', 'Universal Resource Link', 'Uniform Reference Locator', 'United Resource Locator'], 'ans': 0},
        {'q': 'What is open source software?', 'opts': ['Paid software', 'Software with publicly available source code', 'Closed software', 'Government software'], 'ans': 1},
        {'q': 'What is cloud computing?', 'opts': ['Weather forecasting', 'Delivering computing services over internet', 'Local server', 'Hardware device'], 'ans': 1},
        {'q': 'What is a compiler?', 'opts': ['Runs code line by line', 'Translates entire source code to machine code', 'Debugs code', 'Formats code'], 'ans': 1},
        {'q': 'What is recursion?', 'opts': ['Loop', 'Function calling itself', 'Array traversal', 'Sorting'], 'ans': 1},
        {'q': 'What is an API?', 'opts': ['A database', 'Application Programming Interface', 'A server', 'A framework'], 'ans': 1},
    ],
}

DIFFICULTY_MARKS = {'easy': 1, 'medium': 2, 'hard': 3}

def match_topic_to_bank(topic, subject):
    """Match topic/subject to question bank key using keyword matching."""
    combined = (topic + ' ' + subject).lower()
    keyword_map = {
        'data structures': ['data structure', 'array', 'linked list', 'tree', 'graph', 'stack', 'queue', 'heap', 'sorting', 'searching', 'binary'],
        'database':        ['database', 'sql', 'dbms', 'query', 'table', 'normalization', 'join', 'relation'],
        'operating system':['operating system', 'os', 'process', 'thread', 'scheduling', 'memory', 'deadlock', 'paging'],
        'computer network':['network', 'networking', 'tcp', 'ip', 'http', 'dns', 'protocol', 'osi', 'router'],
        'python':          ['python', 'django', 'flask', 'pandas', 'numpy'],
        'machine learning':['machine learning', 'ml', 'deep learning', 'neural', 'ai', 'artificial intelligence', 'classification', 'regression'],
        'mathematics':     ['math', 'mathematics', 'calculus', 'algebra', 'matrix', 'statistics', 'probability'],
        'physics':         ['physics', 'mechanics', 'thermodynamics', 'optics', 'electricity', 'magnetism'],
        'chemistry':       ['chemistry', 'organic', 'inorganic', 'chemical', 'element', 'compound', 'reaction'],
    }
    for bank_key, keywords in keyword_map.items():
        if any(kw in combined for kw in keywords):
            return bank_key
    return 'general'


@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        data        = request.get_json()
        topic       = data.get('topic', '').strip()
        subject     = data.get('subject', '').strip()
        num         = min(int(data.get('numQuestions', 5)), 10)
        difficulty  = data.get('difficulty', 'medium').lower()
        marks       = DIFFICULTY_MARKS.get(difficulty, 1)

        if not topic:
            return jsonify({'success': False, 'message': 'Topic is required'}), 400

        bank_key  = match_topic_to_bank(topic, subject)
        pool      = QUESTION_BANK.get(bank_key, QUESTION_BANK['general'])
        selected  = random.sample(pool, min(num, len(pool)))

        questions = [
            {
                'question':      q['q'],
                'options':       q['opts'],
                'correctAnswer': q['ans'],
                'marks':         marks,
            }
            for q in selected
        ]

        return jsonify({'success': True, 'questions': questions, 'topic': topic, 'bank': bank_key})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ── NLP Chatbot ───────────────────────────────────────────────────────────────

nlp = spacy.load('en_core_web_sm')

CHAT_KB = {
    'greeting': {
        'keywords': ['hi', 'hello', 'hey', 'hii', 'helo', 'good morning', 'good evening', 'namaste', 'hola'],
        'reply': "👋 Hello! I'm **EduPulse AI Assistant**.\n\nI can help you with:\n• 📚 Academic subjects & doubts\n• 💡 Study tips & exam preparation\n• 💼 Placement & interview guidance\n• 📊 CGPA improvement tips\n• 💻 Programming concepts\n\nWhat would you like to know today?"
    },
    'cgpa': {
        'keywords': ['cgpa', 'marks', 'grade', 'score', 'gpa', 'percentage', 'result', 'improve marks'],
        'reply': "📈 **CGPA Improve Karne ke Tips**\n\n• **Regular attendance** — Internal marks directly affect CGPA\n• **Consistent study** — Daily 2-3 hours better than last-minute cramming\n• **Weak subjects focus** — Identify and give extra time to difficult subjects\n• **Previous year papers** — Solve last 5 years papers\n• **Assignment submission** — Never miss assignments, they carry marks\n\n💡 *Improving just 2-3 subjects by 10 marks can significantly boost your CGPA!*"
    },
    'placement': {
        'keywords': ['placement', 'interview', 'job', 'company', 'hire', 'recruit', 'tcs', 'infosys', 'wipro', 'campus', 'offer', 'package', 'salary', 'career'],
        'reply': "💼 **Placement Preparation Guide**\n\n**Technical Round:**\n• Practice DSA daily on LeetCode/HackerRank\n• Revise DBMS, OS, CN core concepts\n• Know one language deeply (Java/Python/C++)\n\n**HR Round:**\n• Prepare 2-min self introduction\n• Know your projects thoroughly\n• Common questions: strengths, weaknesses, goals\n\n**Resume Tips:**\n• Keep it 1 page, add GitHub links\n• Mention certifications (AWS, Google, etc.)\n\n💡 *Start preparing 3-6 months before placement season!*"
    },
    'dsa': {
        'keywords': ['data structure', 'dsa', 'algorithm', 'linked list', 'tree', 'graph', 'stack', 'queue', 'heap', 'sorting', 'searching', 'binary search', 'dynamic programming', 'dp', 'recursion'],
        'reply': "🔧 **Data Structures & Algorithms**\n\n**Study Order:**\n1. Arrays & Strings\n2. Linked List, Stack, Queue\n3. Trees & Binary Search Tree\n4. Graphs (BFS, DFS)\n5. Dynamic Programming\n6. Hashing & Heaps\n\n**Practice Resources:**\n• LeetCode — Easy → Medium → Hard\n• GeeksforGeeks — Theory + Problems\n• HackerRank — Beginner friendly\n\n💡 *Solve minimum 1 problem daily — consistency is key!*"
    },
    'exam': {
        'keywords': ['exam', 'study', 'prepare', 'revision', 'test', 'semester', 'internal', 'final exam', 'tips', 'strategy', 'timetable', 'schedule'],
        'reply': "📚 **Exam Preparation Strategy**\n\n• **Timetable banao** — Subject-wise time allocation\n• **Active recall** — Test yourself, don't just read\n• **Pomodoro Technique** — 25 min study + 5 min break\n• **Previous papers solve karo** — Last 5 years minimum\n• **Short notes** — Make summary notes for quick revision\n• **Sleep properly** — 7-8 hours sleep improves memory\n\n💡 *Start revision 2 weeks before exams for best results!*"
    },
    'attendance': {
        'keywords': ['attendance', 'absent', 'defaulter', 'bunk', 'miss class', 'proxy', 'leave', 'detained'],
        'reply': "📋 **Attendance Information**\n\n• Minimum **75% attendance** required for exam eligibility\n• Below 75% = Risk of detention from exams\n• Medical leaves can be condoned with proper documentation\n\n**How to improve:**\n• Set daily alarm for all classes\n• Inform faculty if you must miss a class\n• Check attendance regularly on EduPulse AI dashboard\n\n💡 *Talk to your faculty immediately if you are below 75%!*"
    },
    'python': {
        'keywords': ['python', 'django', 'flask', 'pandas', 'numpy', 'matplotlib', 'pip', 'virtualenv'],
        'reply': "🐍 **Python Tips**\n\n• Practice daily — even 30 mins helps\n• Build real projects — apply what you learn\n• Read error messages carefully before googling\n\n**Free Resources:**\n• python.org official docs\n• freeCodeCamp Python course\n• CS50P (Harvard free course)\n• Real Python — realpython.com\n\n💡 *Build 2-3 projects to showcase in your resume!*"
    },
    'programming': {
        'keywords': ['java', 'javascript', 'c++', 'programming', 'code', 'coding', 'debug', 'error', 'syntax', 'compiler', 'ide', 'vscode', 'git', 'github'],
        'reply': "💻 **Programming Tips**\n\n• Practice daily — even 30 mins helps\n• Build real projects — apply what you learn\n• Read error messages carefully before googling\n\n**Free Resources:**\n• Java: Oracle docs, Codecademy\n• JavaScript: MDN Web Docs, javascript.info\n• C++: cppreference.com\n• Git: learngitbranching.js.org\n\n💡 *Push all your projects to GitHub — it's your portfolio!*"
    },
    'dbms': {
        'keywords': ['dbms', 'database', 'sql', 'mysql', 'mongodb', 'normalization', 'join', 'query', 'table', 'schema', 'acid', 'transaction', 'index'],
        'reply': "🗄️ **DBMS Key Concepts**\n\n**Important Topics:**\n• ER Diagrams & Normalization (1NF, 2NF, 3NF, BCNF)\n• SQL Queries (JOIN, GROUP BY, HAVING, Subqueries)\n• Transactions & ACID Properties\n• Indexing & Query Optimization\n\n**SQL Practice:**\n• SELECT, INSERT, UPDATE, DELETE\n• INNER JOIN, LEFT JOIN, RIGHT JOIN\n• Aggregate: COUNT, SUM, AVG, MAX, MIN\n\n💡 *DBMS is asked in almost every placement interview!*"
    },
    'os': {
        'keywords': ['os', 'operating system', 'process', 'thread', 'scheduling', 'deadlock', 'memory management', 'paging', 'virtual memory', 'semaphore', 'mutex', 'fcfs', 'round robin'],
        'reply': "🖥️ **Operating Systems Key Topics**\n\n**Must Know:**\n• Process Management & Scheduling (FCFS, SJF, Round Robin)\n• Memory Management (Paging, Segmentation, Virtual Memory)\n• Deadlock (Prevention, Avoidance, Detection)\n• Synchronization (Mutex, Semaphore)\n\n**For Interviews:**\n• Difference between Process & Thread\n• What is Deadlock? 4 conditions?\n• Explain Virtual Memory & Thrashing\n\n💡 *Draw diagrams for scheduling algorithms — helps in exams!*"
    },
    'networking': {
        'keywords': ['cn', 'computer network', 'tcp', 'ip', 'http', 'dns', 'osi', 'router', 'protocol', 'subnet', 'bandwidth', 'latency', 'firewall', 'vpn'],
        'reply': "🌐 **Computer Networks Key Topics**\n\n**Important Concepts:**\n• OSI Model (7 layers) & TCP/IP Model\n• TCP vs UDP differences\n• IP Addressing & Subnetting\n• DNS, DHCP, HTTP, HTTPS, FTP\n• Routing Algorithms (Dijkstra, Bellman-Ford)\n\n**For Interviews:**\n• What happens when you type google.com?\n• Difference between TCP and UDP?\n• Explain 3-way handshake\n\n💡 *CN + OS + DBMS = Core CS subjects for placements!*"
    },
    'ml': {
        'keywords': ['machine learning', 'ml', 'deep learning', 'neural network', 'ai', 'artificial intelligence', 'model', 'training', 'dataset', 'classification', 'regression', 'clustering', 'cnn', 'rnn', 'nlp'],
        'reply': "🤖 **Machine Learning Tips**\n\n**Learning Path:**\n1. Python + NumPy + Pandas\n2. Statistics & Probability basics\n3. Scikit-learn (ML algorithms)\n4. Deep Learning (TensorFlow/PyTorch)\n\n**Key Algorithms to Know:**\n• Linear/Logistic Regression\n• Decision Trees, Random Forest\n• K-Means Clustering\n• Neural Networks\n\n**Free Resources:**\n• Coursera ML by Andrew Ng (free audit)\n• fast.ai — practical deep learning\n\n💡 *Build an ML project and put it on GitHub!*"
    },
    'project': {
        'keywords': ['project', 'final year', 'mini project', 'capstone', 'idea', 'topic', 'mern', 'react', 'node', 'full stack'],
        'reply': "🎓 **Project Tips**\n\n**Project Selection:**\n• Choose a real-world problem to solve\n• Use trending tech (AI/ML, Web Dev, Cloud)\n• Keep scope manageable but impressive\n\n**Tech Stack Ideas:**\n• MERN Stack (MongoDB, Express, React, Node)\n• Python + Flask/Django for AI projects\n• React Native for mobile apps\n\n**Documentation:**\n• Maintain proper README\n• Add screenshots and demo video\n• Push code to GitHub regularly\n\n💡 *Your EduPulse AI project is already industry-level — great choice!*"
    },
    'thanks': {
        'keywords': ['thank', 'thanks', 'thankyou', 'shukriya', 'dhanyawad', 'great', 'helpful', 'awesome', 'good bot'],
        'reply': "You're welcome! 😊\n\nFeel free to ask anytime — I'm always here to help!\n\n**All the best for your studies!** 🎓"
    },
    'math': {
        'keywords': ['math', 'mathematics', 'calculus', 'algebra', 'matrix', 'statistics', 'probability', 'integration', 'differentiation', 'linear algebra'],
        'reply': "📐 **Mathematics Tips**\n\n**Key Topics:**\n• Calculus (Differentiation, Integration)\n• Linear Algebra (Matrix, Determinant, Eigenvalues)\n• Statistics & Probability\n• Discrete Mathematics (for CS)\n\n**Study Tips:**\n• Practice problems daily — maths needs practice\n• Understand concepts, don't just memorize formulas\n• Use Khan Academy for free video explanations\n\n💡 *Statistics is essential for Machine Learning — learn it well!*"
    },
}

def detect_intent(text):
    """Use spaCy + keyword matching to detect intent."""
    doc   = nlp(text.lower())
    tokens = set([token.lemma_ for token in doc if not token.is_stop and not token.is_punct])
    text_lower = text.lower()

    best_intent = None
    best_score  = 0

    for intent, data in CHAT_KB.items():
        score = 0
        for kw in data['keywords']:
            if kw in text_lower:
                score += 2  # exact phrase match
            elif any(token in kw or kw in token for token in tokens):
                score += 1  # partial lemma match
        if score > best_score:
            best_score  = score
            best_intent = intent

    return best_intent if best_score > 0 else None


@app.route('/chatbot', methods=['POST'])
def chatbot():
    try:
        data    = request.get_json()
        message = data.get('message', '').strip()
        if not message:
            return jsonify({'success': False, 'message': 'Message is required'}), 400

        intent = detect_intent(message)
        if intent and intent in CHAT_KB:
            reply = CHAT_KB[intent]['reply']
        else:
            reply = (
                f"🤖 **EduPulse AI Assistant**\n\n"
                f"You asked: *\"{message}\"*\n\n"
                f"I can help you with:\n"
                f"• 📚 DBMS, OS, CN, DSA, Programming, ML\n"
                f"• 📈 CGPA improvement strategies\n"
                f"• 💼 Placement & interview preparation\n"
                f"• 📋 Attendance & academic queries\n"
                f"• 🎓 Project guidance\n\n"
                f"Could you be more specific? For example:\n"
                f"• *\"How to prepare for DSA interviews?\"*\n"
                f"• *\"Tips to improve my CGPA\"*"
            )

        return jsonify({'success': True, 'reply': reply, 'intent': intent, 'source': 'nlp'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    load_models()
    port = int(os.getenv('PORT', 8000))
    print(f"[RUNNING] EduPulse AI Service on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
