CyberWatch AI: Real-Time IoT Intrusion Detection System 🛡️
This project implements a real-time Intrusion Detection System (IDS) using a Random Forest Classifier trained on network traffic data (UNSW-NB15 dataset). The system processes data samples in a live stream simulation, predicts the security status (NORMAL or ATTACK), and pushes the results to a responsive React dashboard using Flask-SocketIO.

The application is structured with a Python/Flask backend for data processing and a React frontend for the dashboard interface, linked via Socket.IO for live updates.

⚙️ Project Workflow and Data Flow
The system's operation is split between offline preparation and live execution:

1. Offline Preparation (IDS.ipynb)
The Jupyter Notebook (IDS.ipynb) trains a Random Forest Classifier (training score ~ 99.7%, accuracy ~ 95%) on a large UNSW_NB15 dataset (~257673 rows and 45 columns - csv files) and saves the key assets required for live prediction:

ids_rf_model.joblib (The trained model)
ids_scaler.joblib (The scaler object)
X_test_unscaled.npy (The test data for simulation)
feature_list.json (selected features after preprocessing)

2. Live Simulation (app.py & App.js)
The system's real-time functionality relies on Socket.IO for seamless, two-way communication. The Backend (app.py) loads the trained ML model, then starts a background thread to simulate streaming network data. This thread performs rapid model inference (NORMAL or ATTACK) on each sample and uses Flask-SocketIO to instantly push the results to connected client.

The Frontend (App.js) acts as the client dashboard, listening for the server's push messages. It uses these events to immediately update the interface, changing the Live Status color, running the attack pulse animation, and incrementing the Threat Counter. Users control the stream by emitting start_simulation or stop_simulation events back to the backend.


💻 Quick Start
Install Python Dependencies: pip install -r requirements.txt

Start Backend: python app.py

Start Frontend:

cd cyberwatch-frontend
npm install
npm start