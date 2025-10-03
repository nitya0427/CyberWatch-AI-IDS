import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
// Using Tailwind CSS for robust styling

// Define the URL of your Flask backend
const SOCKET_URL = `http://localhost:5000/ids`;

// Utility component to embed custom CSS for the single-file mandate
const AppStyles = () => (
    <style jsx="true">{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        /* CSS Reset to remove default browser margins/padding */
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: #151d29ff; /* Ensure background color covers the entire viewport */
        }
        
        .container {
            font-family: 'Inter', sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            min-height: 100vh;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        h1 {
            color: #f7f7f7ff;
            font-weight: 800;
            margin-bottom: 5px;
            font-size: 2rem;
            text-align: center;
        }

        h2 {
            color: #eceff3ff;
            font-weight: 600;
            margin-top: 20px;
            margin-bottom: 15px;
            font-size: 1.25rem;
        }

        #top-section {
            display: flex; /* Default to flex wrap for small screens */
            flex-wrap: wrap;
            gap: 20px; /* Reduced gap slightly */
            margin-bottom: 30px;
            width: 100%;
            max-width: 1000px; /* Increased max width for 3 columns */
            justify-content: center;
        }
        /* New CSS for the three columns to be flexible */
        #control-panel-column, #status-display-column, #counter-column {
            flex: 1 1 300px; /* Flex basis for minimum width and growth */
            background: #161b22;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #30363d;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
            text-align: center;
        }

        /* Responsive grid layout for larger screens */
        @media (min-width: 1000px) {
            #top-section {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
            }
            #control-panel-column, #status-display-column, #counter-column {
                flex: none; /* Disable flex basis when using grid */
            }
        }
        
        #control-panel {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .control-button {
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.1s, opacity 0.3s;
            border: none;
            color: #fff;
        }
        
        #start-button {
            background-color: #2ea44f;
        }
        #start-button:hover:not(:disabled) {
            background-color: #2c974b;
        }

        #stop-button {
            background-color: #f85149;
        }
        #stop-button:hover:not(:disabled) {
            background-color: #d73a49;
        }

        .control-button:disabled {
            background-color: #30363d;
            cursor: not-allowed;
            opacity: 0.6;
        }

        #control-status {
            margin-top: 15px;
            font-size: 0.9em;
            color: #8b949e;
            padding: 8px;
            background-color: #21262d;
            border-radius: 6px;
        }

        #status-display, #attack-counter {
            padding: 30px 10px;
            border-radius: 10px;
            font-size: 1.8rem;
            font-weight: 800;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.5s, color 0.5s;
        }
        
        #attack-counter {
            background-color: #30363d; /* Darker background for counter */
            color: #ff7b72; /* Reddish text */
            font-size: 2.5rem; /* Larger font for impact */
            border: 2px solid #ff7b7230;
        }

        .NORMAL {
            background-color: #238636;
            color: #fff;
            border: 2px solid #2ea44f;
        }

        .ATTACK {
            background-color: #f85149;
            color: #fff;
            animation: pulse-red 1.5s infinite;
            border: 2px solid #d73a49;
        }

        @keyframes pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(248, 81, 73, 0); }
            100% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0); }
        }

        #log-container {
            width: 100%;
            max-width: 1000px; /* Increased max width */
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            max-height: 400px;
            overflow-y: auto;
            margin-top: 10px;
            padding: 15px;
            font-size: 0.9em;
        }

        .log-entry {
            border-bottom: 1px solid #21262d;
            padding: 8px 0;
            display: flex;
            align-items: center;
        }
        .log-entry:last-child {
            border-bottom: none;
        }
        
        .log-attack-text {
            color: #ff7b72;
            font-weight: bold;
            margin-left: 10px;
        }
        .log-normal-text {
            color: #56d364;
            margin-left: 10px;
        }
    `}</style>
);

const CyberWatchDashboard = () => {
    // --- State Variables ---
    const [status, setStatus] = useState('AWAITING CONNECTION...');
    const [statusClass, setStatusClass] = useState('NORMAL');
    const [controlStatus, setControlStatus] = useState('Status: Waiting for connection...');
    const [isRunning, setIsRunning] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [log, setLog] = useState([]);
    // NEW STATE: Total attacks detected
    const [attackCount, setAttackCount] = useState(0); 
    
    const socketRef = useRef(null);
    const MAX_LOG_ENTRIES = 50;

    // --- Simulation Control Logic (Stable using useCallback) ---
    const updateControlUI = useCallback((data) => {
        const { state, message } = data;
        
        setControlStatus('Status: ' + message);
        if (state === 'RUNNING') {
            setIsRunning(true);
        } else if (state === 'STOPPED') {
            setIsRunning(false);
            setStatus('SIMULATION STOPPED');
            setStatusClass('NORMAL');
        } else if (state === 'STOPPING') {
            setIsRunning(false); 
        }
    }, []);

    // --- EFFECT: Handle Socket.IO Connection and Events ---
    useEffect(() => {
        // Initialize socket and assign to ref
        socketRef.current = io(SOCKET_URL, { 
            transports: ['websocket', 'polling'], 
            forceNew: true 
        });
        const socket = socketRef.current;

        // Named handler for ids_update (to be able to remove it later)
        const idsUpdateHandler = (data) => {
            const newStatus = data.status;
            
            // 1. Update main status and attack counter
            setStatus(newStatus === "ATTACK" ? "INTRUSION DETECTED" : "SYSTEM SECURE");
            setStatusClass(newStatus); 
            
            // Increment attack count if an attack is detected
            if (newStatus === 'ATTACK') {
                setAttackCount(prevCount => prevCount + 1);
            }

            // 2. Create and append log entry
            const logTime = new Date(data.timestamp * 1000).toLocaleTimeString();
            let statusHTML;
            
            if (newStatus === 'ATTACK') {
                statusHTML = <span className="log-attack-text">🚨 **THREAT ALERT** - {newStatus}</span>;
            } else {
                statusHTML = <span className="log-normal-text">✅ Status OK - {newStatus}</span>;
            }

            const newLogEntry = {
                id: data.id,
                time: logTime,
                html: statusHTML
            };

            // Use functional update to append and limit log
            setLog(prevLog => [newLogEntry, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
        };

        // --- Event Listeners ---
        socket.on('connect', () => {
            setIsConnected(true); 
            setStatus('READY');
            setStatusClass('NORMAL');
            setControlStatus('Status: Connected. Ready to start.');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            updateControlUI({state: 'STOPPED', message: 'CONNECTION LOST'}); 
            setStatus('DISCONNECTED');
            setStatusClass('ATTACK');
        });
        
        socket.on('status_control', updateControlUI);
        socket.on('ids_update', idsUpdateHandler); // Use the named handler

        // --- Cleanup Function (The Fix) ---
        return () => {
            // CRITICAL FIX: Explicitly remove listeners before disconnecting
            socket.off('ids_update', idsUpdateHandler);
            socket.off('status_control', updateControlUI);
            socket.off('connect');
            socket.off('disconnect');

            if (socket.connected) {
                socket.disconnect();
            }
        };
    }, [updateControlUI]);

    // --- Control Event Handlers ---
    const handleStart = () => {
        if (isConnected && !isRunning) {
            socketRef.current.emit('start_simulation');
        }
    };

    const handleStop = () => {
        if (isConnected && isRunning) {
            socketRef.current.emit('stop_simulation');
        }
    };
    
    // Handler to reset the attack counter
    const handleResetCounter = () => {
        setAttackCount(0);
    }

    // --- Render Function (JSX) ---
    return (
        <div className="container">
            <AppStyles /> {/* Embed CSS */}
            <h1>CyberWatch AI - Real-Time IoT Intrusion Detection System</h1>
            <p className="text-gray-500 mb-6">Powered by a Random Forest Classifier Model</p>
            
            {/* TOP SECTION: Controls, Status & Counter (Now 3 columns) */}
            <div id="top-section">
                
                <div id="control-panel-column">
                    <h2>Simulation Control</h2>
                    <div id="control-panel">
                        <button 
                            id="start-button" 
                            className="control-button" 
                            onClick={handleStart}
                            disabled={isRunning || !isConnected} 
                        >
                            START STREAM
                        </button>
                        <button 
                            id="stop-button" 
                            className="control-button" 
                            onClick={handleStop}
                            disabled={!isRunning || !isConnected} 
                        >
                            STOP STREAM
                        </button>
                        
                        <div id="control-status">{controlStatus}</div>
                    </div>
                </div>
                
                <div id="status-display-column">
                    <h2>Live Status</h2>
                    <div id="status-display" className={statusClass}>
                        {status}
                    </div>
                </div>
                
                {/* NEW COLUMN: ATTACK COUNTER */}
                <div id="counter-column">
                    <h2>Total Threats Detected</h2>
                    <div id="attack-counter">
                        {attackCount}
                    </div>
                    <button 
                        className="control-button" 
                        onClick={handleResetCounter}
                        style={{marginTop: '10px', backgroundColor: '#30363d'}}
                    >
                        RESET COUNTER
                    </button>
                </div>
            </div>

            {/* LOG SECTION */}
            <h2>Activity Log</h2>
            <div id="log-container">
                {log.length === 0 && !isRunning ? (
                    <div style={{ padding: '10px', color: '#777' }}>
                        Log empty. Press START STREAM to begin monitoring.
                    </div>
                ) : (
                    log.map((entry, index) => (
                        // Key includes index to handle potential sample ID repetition after loop reset
                        <div key={entry.id + '-' + index} className="log-entry"> 
                            <span style={{color: '#fcfbf5ff', fontWeight: 'bold'}}>[{entry.time}]</span> 
                            <span style={{margin: '0 10px', color: '#8b949e'}}>Sample #{entry.id}:</span> 
                            {entry.html}
                        </div>
                    ))
                )}
            </div>

            <p style={{marginTop: '30px', fontSize: '0.8em', color: '#777'}}>
                Architecture: Flask-SocketIO Backend | Frontend: React.js
            </p>
        </div>
    );
};

export default CyberWatchDashboard;
