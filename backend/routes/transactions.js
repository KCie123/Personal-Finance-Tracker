const express = require('express');
const router = express.Router();

// Placeholder: Replace with actual pool import
let pool;
const setPool = (dbPool) => {
    pool = dbPool;
};

// --- Helper Function to Get Transaction ---
// We'll need this for PUT/DELETE to know the old amount/account
const getTransactionById = async (client, transactionId) => {
    const result = await client.query('SELECT * FROM transactions WHERE transaction_id = $1', [transactionId]);
    if (result.rowCount === 0) {
        return null;
    }
    return result.rows[0];
};

// GET /api/transactions - Fetch recent transactions (e.g., last 20)
router.get('/', async (req, res) => {
     if (!pool) {
        return res.status(500).json({ error: 'Database pool not initialized' });
    }
    try {
        // Fetch transactions joining with account name for context
        const result = await pool.query(`
            SELECT
                t.transaction_id,
                t.account_id,
                a.account_name,
                t.transaction_type,
                t.description,
                t.amount,
                t.transaction_date,
                t.category,
                t.ratio_category,
                t.created_at
            FROM transactions t
            JOIN accounts a ON t.account_id = a.account_id
            ORDER BY t.transaction_date DESC, t.created_at DESC
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions:', err.message || err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// POST /api/transactions - Add a new transaction
router.post('/', async (req, res) => {
    console.log('Received POST /api/transactions request body:', req.body);

    if (!pool) {
        console.error('POST /api/transactions error: Database pool not initialized');
        return res.status(500).json({ error: 'Database pool not initialized' });
    }
    const { account_id, transaction_type, description, amount, transaction_date, category, ratio_category } = req.body;

    if (!account_id || !transaction_type || !description || amount == null || !transaction_date) {
        console.error('Validation failed: Missing required fields. Data:', req.body);
        return res.status(400).json({ error: 'Missing required transaction fields' });
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount === 0) {
        console.error('Validation failed: Invalid or zero amount. Amount received:', amount);
        return res.status(400).json({ error: 'Invalid or zero amount provided' });
    }
    if (!['Income', 'Expense', 'Transfer'].includes(transaction_type)) {
        console.error('Validation failed: Invalid transaction type. Type received:', transaction_type);
        return res.status(400).json({ error: 'Invalid transaction type' });
    }
    if (ratio_category && !['Need', 'Want', 'Saving'].includes(ratio_category)) {
        console.error('Validation failed: Invalid ratio category. Received:', ratio_category);
        return res.status(400).json({ error: 'Invalid ratio category provided. Must be Need, Want, or Saving.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO transactions (account_id, transaction_type, description, amount, transaction_date, category, ratio_category)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [account_id, transaction_type, description, numericAmount, transaction_date, category || null, ratio_category || null];
        const transactionResult = await client.query(insertQuery, values);
        const newTransaction = transactionResult.rows[0];

        const updateBalanceQuery = `
            UPDATE accounts
            SET current_balance = current_balance + $1
            WHERE account_id = $2;
        `;
        await client.query(updateBalanceQuery, [numericAmount, account_id]);

        await client.query('COMMIT');

        res.status(201).json(newTransaction);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error adding transaction (Rolled Back):', err.message || err);
        res.status(500).json({ error: 'Failed to add transaction' });
    } finally {
        client.release();
    }
});

// --- PUT /api/transactions/:id - Update a transaction ---
router.put('/:id', async (req, res) => {
    if (!pool) return res.status(500).json({ error: 'Database pool not initialized' });

    const { id } = req.params;
    const transactionId = parseInt(id, 10);
    if (isNaN(transactionId)) {
        return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    // Get updated data from body
    const { account_id, transaction_type, description, amount, transaction_date, category, ratio_category } = req.body;

    // --- Basic Validation (similar to POST) ---
    if (!account_id || !transaction_type || !description || amount == null || !transaction_date) {
        return res.status(400).json({ error: 'Missing required transaction fields' });
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount === 0) {
        return res.status(400).json({ error: 'Invalid or zero amount provided' });
    }
    if (!['Income', 'Expense', 'Transfer'].includes(transaction_type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
    }
    if (ratio_category && !['Need', 'Want', 'Saving'].includes(ratio_category)) {
         return res.status(400).json({ error: 'Invalid ratio category provided.' });
     }
    const newAccountId = parseInt(account_id, 10);
     if (isNaN(newAccountId)) {
         return res.status(400).json({ error: 'Invalid account ID' });
     }
    // TODO: Validate date format

    // --- Database Transaction ---
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get the original transaction to know old amount and account
        const originalTx = await getTransactionById(client, transactionId);
        if (!originalTx) {
            await client.query('ROLLBACK'); // No need to proceed
            return res.status(404).json({ error: 'Transaction not found' });
        }
        const originalAmount = parseFloat(originalTx.amount);
        const originalAccountId = originalTx.account_id;

        // 2. Revert the original amount from the original account balance
        await client.query(
            'UPDATE accounts SET current_balance = current_balance - $1 WHERE account_id = $2',
            [originalAmount, originalAccountId]
        );

        // 3. Update the transaction details
        const updateQuery = `
            UPDATE transactions
            SET account_id = $1, transaction_type = $2, description = $3, amount = $4,
                transaction_date = $5, category = $6, ratio_category = $7
            WHERE transaction_id = $8
            RETURNING *;
        `;
        const values = [
            newAccountId, transaction_type, description, numericAmount, transaction_date,
            category || null, ratio_category || null, transactionId
        ];
        const updatedResult = await client.query(updateQuery, values);

        // 4. Apply the *new* amount to the *new* (or potentially same) account balance
        await client.query(
            'UPDATE accounts SET current_balance = current_balance + $1 WHERE account_id = $2',
            [numericAmount, newAccountId]
        );

        await client.query('COMMIT');
        res.json(updatedResult.rows[0]); // Return the updated transaction

        // TODO: Emit WebSocket event

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error updating transaction ${transactionId}:`, err.message || err);
        res.status(500).json({ error: 'Failed to update transaction' });
    } finally {
        client.release();
    }
});

// --- DELETE /api/transactions/:id - Delete a transaction ---
router.delete('/:id', async (req, res) => {
    if (!pool) return res.status(500).json({ error: 'Database pool not initialized' });

    const { id } = req.params;
     const transactionId = parseInt(id, 10);
     if (isNaN(transactionId)) {
        return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get the original transaction to know amount and account
        const originalTx = await getTransactionById(client, transactionId);
        if (!originalTx) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Transaction not found' });
        }
        const originalAmount = parseFloat(originalTx.amount);
        const originalAccountId = originalTx.account_id;

        // 2. Revert the original amount from the account balance
         await client.query(
            'UPDATE accounts SET current_balance = current_balance - $1 WHERE account_id = $2',
            [originalAmount, originalAccountId]
        );

        // 3. Delete the transaction
        const deleteResult = await client.query('DELETE FROM transactions WHERE transaction_id = $1', [transactionId]);
        // deleteResult.rowCount should be 1 if successful, but already checked via getTransactionById

        await client.query('COMMIT');
        res.status(204).send(); // No Content on successful delete

        // TODO: Emit WebSocket event

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error deleting transaction ${transactionId}:`, err.message || err);
        res.status(500).json({ error: 'Failed to delete transaction' });
    } finally {
        client.release();
    }
});

module.exports = { router, setPool }; // Export both router and the setter function
