const express = require('express');
const router = express.Router();

let pool;
const setPool = (dbPool) => {
    pool = dbPool;
};

// GET /api/budgets - Fetch all budget categories and amounts
router.get('/', async (req, res) => {
    if (!pool) return res.status(500).json({ error: 'Database pool not initialized' });
    try {
        // Fetch budgets along with calculated actual spending for the current month
        const currentMonthStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const nextMonthStartDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0];

        const query = `
            SELECT
                b.budget_id,
                b.category_name,
                b.budgeted_amount,
                COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END), 0.00) AS actual_spending -- Sum only negative amounts (expenses) as positive
            FROM budgets b
            LEFT JOIN transactions t ON b.category_name = t.category
                                   AND t.transaction_date >= $1
                                   AND t.transaction_date < $2
            GROUP BY b.budget_id, b.category_name, b.budgeted_amount
            ORDER BY b.category_name ASC;
        `;
        const result = await pool.query(query, [currentMonthStartDate, nextMonthStartDate]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching budgets:', err.message || err);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

// POST /api/budgets - Create a new budget category
router.post('/', async (req, res) => {
    if (!pool) return res.status(500).json({ error: 'Database pool not initialized' });
    const { category_name, budgeted_amount } = req.body;

    if (!category_name || budgeted_amount == null) {
        return res.status(400).json({ error: 'Missing category_name or budgeted_amount' });
    }
    const numericAmount = parseFloat(budgeted_amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
        return res.status(400).json({ error: 'Invalid or negative budgeted_amount' });
    }

    try {
        const query = `
            INSERT INTO budgets (category_name, budgeted_amount)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await pool.query(query, [category_name, numericAmount]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        // Handle potential unique constraint violation (category_name already exists)
        if (err.code === '23505') { // PostgreSQL unique violation code
             return res.status(409).json({ error: `Budget for category '${category_name}' already exists.` });
        }
        console.error('Error creating budget:', err.message || err);
        res.status(500).json({ error: 'Failed to create budget' });
    }
});

// PUT /api/budgets/:id - Update a budget amount
router.put('/:id', async (req, res) => {
     if (!pool) return res.status(500).json({ error: 'Database pool not initialized' });
     const { id } = req.params;
     const { budgeted_amount } = req.body;

     if (budgeted_amount == null) {
         return res.status(400).json({ error: 'Missing budgeted_amount' });
     }
      const numericAmount = parseFloat(budgeted_amount);
     if (isNaN(numericAmount) || numericAmount < 0) {
         return res.status(400).json({ error: 'Invalid or negative budgeted_amount' });
     }
     const budgetId = parseInt(id, 10);
     if (isNaN(budgetId)) {
          return res.status(400).json({ error: 'Invalid budget ID' });
     }

     try {
        const query = `
            UPDATE budgets
            SET budgeted_amount = $1, updated_at = CURRENT_TIMESTAMP
            WHERE budget_id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [numericAmount, budgetId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        res.json(result.rows[0]);
     } catch (err) {
         console.error('Error updating budget:', err.message || err);
         res.status(500).json({ error: 'Failed to update budget' });
     }
});

// DELETE /api/budgets/:id - Delete a budget category
router.delete('/:id', async (req, res) => {
    if (!pool) return res.status(500).json({ error: 'Database pool not initialized' });
    const { id } = req.params;
    const budgetId = parseInt(id, 10);
     if (isNaN(budgetId)) {
          return res.status(400).json({ error: 'Invalid budget ID' });
     }

    try {
        const query = `DELETE FROM budgets WHERE budget_id = $1;`;
        const result = await pool.query(query, [budgetId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        res.status(204).send(); // No Content success status
    } catch (err) {
        console.error('Error deleting budget:', err.message || err);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});


module.exports = { router, setPool };
