import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css'; // We'll keep the CSS import for now
import Dashboard from './components/Dashboard/Dashboard'; // <-- Import Dashboard
import { Account, Transaction } from './types'; // Assuming types are still needed if App fetches data

// Define the backend server URL
// Using the port the user confirmed is working (4000)
const SOCKET_SERVER_URL = 'http://localhost:4000'; // <-- Updated port to 4000

function App() {
  // Optional: Store socket instance in state if components need to interact with it directly
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false); // Track connection status

  useEffect(() => {
    // Establish connection
    console.log(`Attempting to connect to WebSocket server at ${SOCKET_SERVER_URL}...`); // Updated log
    const newSocket = io(SOCKET_SERVER_URL, {
      // Optional: Configuration options
      // transports: ['websocket'], // Force WebSocket transport if needed
    });

    // Store the socket instance if needed (using state or a ref)
    // setSocket(newSocket);

    // --- Event Listeners ---
    newSocket.on('connect', () => {
      console.log('WebSocket connected! Socket ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      // Optional: Attempt to reconnect on disconnect
      // if (reason === 'io server disconnect') {
      //   // The server forcefully disconnected; maybe wait before reconnecting
      // } else {
      //   // Other reasons (e.g., network issue); try to reconnect
      //   // newSocket.connect(); // Be cautious with automatic reconnect loops
      // }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Example: Listen for custom events from the server
    // newSocket.on('transaction_update', (data) => {
    //   console.log('Received transaction update:', data);
    //   // TODO: Update state based on the received data
    // });


    // --- Cleanup on component unmount ---
    return () => {
      console.log('Disconnecting WebSocket...');
      newSocket.disconnect();
    };

  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    // Removed background/text colors here as they are now set on body in index.css
    <div className="App min-h-screen flex flex-col">
      {/* Header section with slightly darker slate */}
      <header className="bg-slate-800 shadow-md p-4 sticky top-0 z-10"> {/* Made header sticky */}
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-blue-400"> {/* Adjusted brand color */}
            Personal Finance Tracker
          </h1>
          <p className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-500'}`}> {/* Adjusted status colors */}
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <Dashboard /> {/* Render the Dashboard component */}
      </main>

      {/* Optional Footer */}
      {/* <footer className="bg-slate-800 p-4 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Personal Finance Tracker
      </footer> */}
    </div>
  );
}

export default App;
