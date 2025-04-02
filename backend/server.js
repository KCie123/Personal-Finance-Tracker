require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { Pool } = require('pg'); // <-- Uncomment this line

// Import route handlers
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets'); // <-- Import budget routes

const app = express();
const server = http.createServer(app);

// --- Middleware ---
// Enable CORS for requests from your React frontend (adjust origin in production)
app.use(cors({
  origin: 'http://localhost:3000', // Assuming React runs on port 3000
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json()); // Middleware to parse JSON bodies

// --- Database Setup ---
// Use environment variables from .env file
const pool = new Pool({ // <-- Uncomment this block
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432, // Parse port to integer
});

// Pass the pool to the route modules
accountRoutes.setPool(pool);
transactionRoutes.setPool(pool);
budgetRoutes.setPool(pool); // <-- Pass pool to budget routes

// --- WebSocket Setup ---
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Allow connection from React app
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Example: Handle transaction updates
  // socket.on('new_transaction', (data) => {
  //   console.log('New transaction received:', data);
  //   // TODO: Process transaction, save to DB
  //   // Broadcast the update to other connected clients (or specific users)
  //   io.emit('transaction_update', { message: 'Transaction added', data });
  // });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('Personal Finance Tracker Backend API');
});

// Mount the routers
app.use('/api/accounts', accountRoutes.router);
app.use('/api/transactions', transactionRoutes.router);
app.use('/api/budgets', budgetRoutes.router); // <-- Mount budget routes

// --- Server Startup ---
const PORT = process.env.PORT || 4000; // Use port from .env or default to 5000
server.listen(PORT, async () => { // <-- Make callback async
  console.log(`Server running on port ${PORT}`);
  // Check database connection
  try { // <-- Add try-catch block
    const client = await pool.connect(); // Try to connect
    console.log('Database connected successfully');
    client.release(); // Release the client back to the pool
  } catch (err) {
    console.error('Error connecting to database:', err.message || err);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => { // <-- Make callback async
    console.log("Shutting down gracefully...");
    // Close WebSocket connections first if necessary (io.close() can be added if needed)
    server.close(async () => { // <-- Make callback async
        console.log("Server closed.");
        // Close database pool
        try { // <-- Add try-catch block
            if (pool) {
                await pool.end(); // <-- Uncomment and use await
                console.log("Database pool closed.");
            }
        } catch (err) {
            console.error("Error closing database pool:", err.message || err);
        } finally {
            process.exit(0);
        }
    });
});
