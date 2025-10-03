# # 1. IMMEDIATE MONKEY-PATCHING
# import eventlet
# eventlet.monkey_patch() 

# # 2. STANDARD IMPORTS
# import joblib
# import numpy as np
# import time
# import json
# import os
# from flask import Flask, render_template
# from flask_socketio import SocketIO, emit
# from threading import Thread, Event 

# # --- Configuration ---
# MODEL_PATH = 'IDS/IDS/ids_rf_model.joblib'
# SCALER_PATH = 'IDS/IDS/ids_scaler.joblib'
# TEST_DATA_PATH = 'IDS/IDS/X_test_unscaled.npy' 
# SLEEP_TIME = 2 
# MAX_SIMULATION_SAMPLES = 5000 

# # --- Flask & SocketIO Setup ---
# app = Flask(__name__)
# app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-dev-key') 
# socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# thread = None
# thread_stop_event = Event()
# thread_stop_event.set() 
# # Global variable to track the last processed index
# current_index = 0 

# # --- Model and Data Loading ---
# try:
#     rf_model = joblib.load(MODEL_PATH)
#     scaler = joblib.load(SCALER_PATH)
    
#     X_test_unscaled_full = np.load(TEST_DATA_PATH) 
    
#     if len(X_test_unscaled_full) > MAX_SIMULATION_SAMPLES:
#         X_test_unscaled = X_test_unscaled_full[:MAX_SIMULATION_SAMPLES]
#     else:
#         X_test_unscaled = X_test_unscaled_full
    
#     with open('IDS/IDS/feature_list.json', 'r') as f:
#         feature_list = json.load(f)
    
# except FileNotFoundError as e:
#     print(f"🚨 Error loading files: {e}. Ensure all files are present in the 'IDS' directory.")
#     exit()

# # --- Simulation and Inference Logic ---
# def background_simulation_thread():
#     print("Starting IDS simulation loop...")
    
#     # Use global index
#     global current_index
    
#     # Start loop from the last position
#     i = current_index 
#     num_samples = len(X_test_unscaled)
    
#     while not thread_stop_event.is_set():
#         if i >= num_samples:
#             # If loop finishes, reset index to 0
#             i = 0 

#         # 1. Get the current UN-SCALED sample and Scale
#         current_sample_unscaled = X_test_unscaled[i].reshape(1, -1)
#         current_sample_scaled = scaler.transform(current_sample_unscaled)
        
#         # 2. Perform Inference (unchanged)
#         prediction = rf_model.predict(current_sample_scaled)[0]
#         status_label = "ATTACK" if prediction == 1 else "NORMAL" 
        
#         # 3. Format Output
#         data = {
#             # Use i+1 for the display ID
#             "id": i + 1, 
#             "status": status_label,
#             "timestamp": time.time(),
#             "feature_count": len(feature_list)
#         }
        
#         socketio.emit('ids_update', data, namespace='/ids')
        
#         # CRITICAL: Update the global index before incrementing i
#         current_index = i 
#         i += 1
        
#         eventlet.sleep(SLEEP_TIME) 
        
#     # Send final stop signal
#     socketio.emit('status_control', {'state': 'STOPPED', 'message': 'Simulation stopped by user.'}, namespace='/ids')
#     print("IDS simulation loop finished/stopped.")
    
#     global thread
#     thread = None


# # --- Control Handlers ---

# @socketio.on('start_simulation', namespace='/ids')
# def start_simulation(auth=None):
#     global thread
#     if thread_stop_event.is_set():
#         thread_stop_event.clear()
        
#         # This check now reliably restarts the loop
#         if thread is None: 
#             thread = socketio.start_background_task(background_simulation_thread)
            
#         # 💡 FIX 2: Ensure the 'message' key is always included when emitting RUNNING status
#         emit('status_control', {'state': 'RUNNING', 'message': 'Simulation stream active...'}, namespace='/ids')

# @socketio.on('stop_simulation', namespace='/ids')
# def stop_simulation(auth=None):
#     thread_stop_event.set()
#     emit('status_control', {'state': 'STOPPING', 'message': 'Stopping simulation...'}, namespace='/ids')

# # --- Flask Routes and SocketIO Handlers ---

# @app.route('/')
# def index():
#     return 'CyberWatch AI Backend is Running. Access the React Frontend at http://localhost:3000' 

# @socketio.on('connect', namespace='/ids')
# def handle_connect(auth=None):
#     print('Client connected to IDS namespace.')
    
#     status = 'STOPPED' if thread_stop_event.is_set() else 'RUNNING'
    
#     # Ensure message is included here too
#     message = 'Ready. Press Start.' if status == 'STOPPED' else 'Simulation stream active...'
    
#     emit('status_control', {'state': status, 'message': message}, namespace='/ids') 

# @socketio.on('disconnect', namespace='/ids')
# def handle_disconnect(auth=None):
#     print('Client disconnected from IDS namespace')

# if __name__ == '__main__':
#     print("Starting Flask-SocketIO Server (using Eventlet) on http://127.0.0.1:5000")
#     socketio.run(app, host='0.0.0.0', port=5000)


    # 1. IMMEDIATE MONKEY-PATCHING
import eventlet
eventlet.monkey_patch() 

# 2. STANDARD IMPORTS
import joblib
import numpy as np
import time
import json
import os
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from threading import Thread, Event 

# --- Configuration ---
MODEL_PATH = 'IDS/IDS/ids_rf_model.joblib'
SCALER_PATH = 'IDS/IDS/ids_scaler.joblib'
TEST_DATA_PATH = 'IDS/IDS/X_test_unscaled.npy' 
SLEEP_TIME = 2 
MAX_SIMULATION_SAMPLES = 5000 

# --- Flask & SocketIO Setup ---
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-dev-key') 
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

thread = None
thread_stop_event = Event()
thread_stop_event.set() 
# Global variable to track the last processed index
current_index = 0 

# --- Model and Data Loading ---
try:
    rf_model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    
    X_test_unscaled_full = np.load(TEST_DATA_PATH) 
    
    if len(X_test_unscaled_full) > MAX_SIMULATION_SAMPLES:
        X_test_unscaled = X_test_unscaled_full[:MAX_SIMULATION_SAMPLES]
    else:
        X_test_unscaled = X_test_unscaled_full
    
    with open('IDS/IDS/feature_list.json', 'r') as f:
        feature_list = json.load(f)
    
except FileNotFoundError as e:
    print(f"🚨 Error loading files: {e}. Ensure all files are present in the 'IDS' directory.")
    # Exit is commented out so the file can be run in environments where models are simulated
    # exit() 
    
    # Placeholder definitions for running without files (for demonstration)
    print("⚠️ Running in placeholder mode: Model and data files not found. Simulation will fail.")
    rf_model = None
    scaler = None
    X_test_unscaled = np.random.rand(100, 10) # Mock data
    feature_list = [f"Feature {i}" for i in range(10)]
    
    def mock_predict(scaled_data):
        """Mocks prediction, alternating between ATTACK and NORMAL."""
        global current_index
        # Use current_index % 2 to alternate the status label
        return 1 if (current_index + 1) % 5 == 0 else 0 

    def background_simulation_thread():
        print("Starting IDS simulation loop (MOCK MODE)...")
        global current_index
        i = current_index 
        num_samples = len(X_test_unscaled)
        
        while not thread_stop_event.is_set():
            if i >= num_samples:
                i = 0 
            
            # 1. Get the current sample (No Scaling needed in mock)
            # current_sample_unscaled = X_test_unscaled[i].reshape(1, -1)
            
            # 2. Perform Mock Inference
            prediction = mock_predict(None)
            status_label = "ATTACK" if prediction == 1 else "NORMAL" 
            
            # 3. Format Output
            data = {
                "id": i + 1, 
                "status": status_label,
                "timestamp": time.time(),
                "feature_count": len(feature_list)
            }
            
            socketio.emit('ids_update', data, namespace='/ids')
            
            current_index = i 
            i += 1
            
            eventlet.sleep(SLEEP_TIME) 
            
        # Send final stop signal
        socketio.emit('status_control', {'state': 'STOPPED', 'message': 'Simulation stopped by user.'}, namespace='/ids')
        print("IDS simulation loop finished/stopped.")
        
        global thread
        thread = None
        return # Exit the function here to use the mock thread

# --- Simulation and Inference Logic (Original, only runs if files are found) ---
if rf_model and scaler:
    def background_simulation_thread():
        print("Starting IDS simulation loop...")
        
        global current_index
        i = current_index 
        num_samples = len(X_test_unscaled)
        
        while not thread_stop_event.is_set():
            if i >= num_samples:
                i = 0 
    
            # 1. Get the current UN-SCALED sample and Scale
            current_sample_unscaled = X_test_unscaled[i].reshape(1, -1)
            current_sample_scaled = scaler.transform(current_sample_unscaled)
            
            # 2. Perform Inference
            prediction = rf_model.predict(current_sample_scaled)[0]
            status_label = "ATTACK" if prediction == 1 else "NORMAL" 
            
            # 3. Format Output
            data = {
                "id": i + 1, 
                "status": status_label,
                "timestamp": time.time(),
                "feature_count": len(feature_list)
            }
            
            socketio.emit('ids_update', data, namespace='/ids')
            
            # CRITICAL: Update the global index before incrementing i
            current_index = i 
            i += 1
            
            eventlet.sleep(SLEEP_TIME) 
            
        # Send final stop signal
        socketio.emit('status_control', {'state': 'STOPPED', 'message': 'Simulation stopped by user.'}, namespace='/ids')
        print("IDS simulation loop finished/stopped.")
        
        global thread
        thread = None


# --- Control Handlers ---

@socketio.on('start_simulation', namespace='/ids')
def start_simulation(auth=None):
    global thread
    if thread_stop_event.is_set():
        thread_stop_event.clear()
        
        if thread is None: 
            thread = socketio.start_background_task(background_simulation_thread)
            
        emit('status_control', {'state': 'RUNNING', 'message': 'Simulation stream active...'}, namespace='/ids')

@socketio.on('stop_simulation', namespace='/ids')
def stop_simulation(auth=None):
    thread_stop_event.set()
    emit('status_control', {'state': 'STOPPING', 'message': 'Stopping simulation...'}, namespace='/ids')

# --- Flask Routes and SocketIO Handlers ---

@app.route('/')
def index():
    return 'CyberWatch AI Backend is Running. Access the React Frontend at http://localhost:3000' 

@socketio.on('connect', namespace='/ids')
def handle_connect(auth=None):
    print('Client connected to IDS namespace.')
    
    status = 'STOPPED' if thread_stop_event.is_set() else 'RUNNING'
    
    # Ensure message is included here too
    message = 'Ready. Press Start.' if status == 'STOPPED' else 'Simulation stream active...'
    
    emit('status_control', {'state': status, 'message': message}, namespace='/ids') 

@socketio.on('disconnect', namespace='/ids')
def handle_disconnect(auth=None):
    print('Client disconnected from IDS namespace')

if __name__ == '__main__':
    print("Starting Flask-SocketIO Server (using Eventlet) on http://127.0.0.1:5000")
    # Using '0.0.0.0' for host to make it accessible 
    # and setting 'debug=False' since eventlet doesn't support reloader well.
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
