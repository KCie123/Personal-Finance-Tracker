const express = require('express');
const router = express.Router();
// We need to get the pool from the main server file or set it up again.
// Let's modify server.js slightly to export it properly.

// Placeholder: Replace with actual pool import after modifying server.js
// const { pool } = require('../db'); // Assuming db setup is moved to db.js later
let pool;
const setPool = (dbPool) => {
    pool = dbPool;
};


// GET /api/accounts - Fetch all accounts
router.get('/', async (req, res) => {
    if (!pool) {
        return res.status(500).json({ error: 'Database pool not initialized' });
    }
    try {
        const result = await pool.query(
            'SELECT account_id, account_name, account_type, current_balance FROM accounts ORDER BY account_name ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching accounts:', err.message || err);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// TODO: Add routes for POST (create account), PUT (update), DELETE

module.exports = { router, setPool }; // Export both router and the setter function
