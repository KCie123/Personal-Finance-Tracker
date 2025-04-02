import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:4000/api';

interface Budget {
    budget_id: number;
    category_name: string;
    budgeted_amount: string;
    actual_spending: string; // Calculated by backend
}

interface BudgetData extends Budget { // Combine if needed or keep separate
    isEditing?: boolean; // Add editing flag
}

// Simple progress bar component
const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
    let bgColor = 'bg-green-500'; // Default: under budget
    if (percentage >= 90 && percentage <= 100) {
        bgColor = 'bg-yellow-500'; // Approaching limit
    } else if (percentage > 100) {
        bgColor = 'bg-red-500'; // Over budget
    }

    return (
        <div className="w-full bg-slate-600 rounded-full h-2.5 dark:bg-slate-700 my-1">
            <div
                className={`${bgColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

// Form to add a new budget
const AddBudgetForm: React.FC<{ onBudgetAdded: () => void }> = ({ onBudgetAdded }) => {
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        if (!category || !amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid category and positive amount.');
            setIsSubmitting(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/budgets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category_name: category, budgeted_amount: amount }),
            });
             const resBody = await response.json(); // Always try to parse body
            if (!response.ok) {
                throw new Error(resBody.error || `HTTP error ${response.status}`);
            }
            setCategory('');
            setAmount('');
            onBudgetAdded(); // Refresh list
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-6 p-4 bg-slate-700 rounded-lg shadow">
            <input
                type="text"
                placeholder="Category Name"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                required
                className="p-2 border border-slate-600 rounded bg-slate-600 text-slate-100 focus:ring-blue-500 focus:border-blue-500 flex-grow"
            />
            <input
                type="number"
                placeholder="Monthly Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                required
                min="0.01"
                step="0.01"
                className="p-2 border border-slate-600 rounded bg-slate-600 text-slate-100 focus:ring-blue-500 focus:border-blue-500 flex-grow"
            />
            <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow transition duration-150 disabled:opacity-50"
            >
                {isSubmitting ? 'Adding...' : 'Add Budget'}
            </button>
             {error && <p className="text-red-400 text-sm mt-1 sm:mt-0 sm:ml-2 sm:self-center w-full sm:w-auto text-center">{error}</p>}
        </form>
    );
};


const BudgetList: React.FC = () => {
    const [budgets, setBudgets] = useState<BudgetData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingAmount, setEditingAmount] = useState<string>(''); // Temp state for editing input

    const fetchBudgets = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/budgets`);
            if (!response.ok) throw new Error('Failed to fetch budgets');
            const data: BudgetData[] = await response.json();
            setBudgets(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, []);

    // --- Edit Handling ---
    const handleEditClick = (budget: BudgetData) => {
        // Set editing flag on the specific budget item and store current amount
        setBudgets(prev => prev.map(b =>
            b.budget_id === budget.budget_id
                ? { ...b, isEditing: true }
                : { ...b, isEditing: false } // Close other edits
        ));
        setEditingAmount(budget.budgeted_amount); // Pre-fill edit input
    };

    const handleCancelEdit = (budgetId: number) => {
        setBudgets(prev => prev.map(b =>
            b.budget_id === budgetId ? { ...b, isEditing: false } : b
        ));
         setEditingAmount(''); // Clear temp amount
    };

    const handleSaveEdit = async (budgetId: number) => {
        const newAmount = parseFloat(editingAmount);
        if (isNaN(newAmount) || newAmount < 0) {
             alert("Please enter a valid positive amount."); // Simple error handling
             return;
        }

        try {
             const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ budgeted_amount: newAmount }),
            });
            const resBody = await response.json();
             if (!response.ok) throw new Error(resBody.error || `HTTP error ${response.status}`);

             // Update state locally or re-fetch
             // Re-fetching is simpler for now
             fetchBudgets();
             // Or update locally:
             // setBudgets(prev => prev.map(b =>
             //     b.budget_id === budgetId ? { ...resBody, isEditing: false } : b
             // ));
             // setEditingAmount('');

        } catch (err: any) {
            console.error("Failed to update budget:", err);
            alert(`Error updating budget: ${err.message}`);
            // Optionally revert editing state on error
            handleCancelEdit(budgetId);
        }
    };

     // --- Delete Handling ---
     const handleDeleteBudget = async (budgetId: number) => {
         if (!window.confirm('Are you sure you want to delete this budget category?')) {
            return;
        }
         try {
             const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}`, { method: 'DELETE' });
             if (!response.ok) {
                 let errorMsg = `HTTP error! status: ${response.status}`;
                  try { /* Check for JSON error body */ } catch (_) {}
                 throw new Error(errorMsg);
             }
             fetchBudgets(); // Refresh list on success
         } catch (err: any) {
            console.error("Failed to delete budget:", err);
            alert(`Error deleting budget: ${err.message}`);
         }
     };

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg p-4 md:p-6">
             <h3 className="text-xl font-semibold mb-4 text-emerald-400">Monthly Budgets</h3>

            <AddBudgetForm onBudgetAdded={fetchBudgets} /> {/* Add form */}

            {isLoading && <p className="text-slate-400">Loading budgets...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {!isLoading && !error && (
                budgets.length === 0 ? (
                    <p className="text-slate-400">No budgets set yet. Add one above!</p>
                ) : (
                    <ul className="space-y-4">
                        {budgets.map((budget) => {
                            const budgeted = parseFloat(budget.budgeted_amount);
                            const spent = parseFloat(budget.actual_spending);
                            const remaining = budgeted - spent;

                            return (
                                <li key={budget.budget_id} className="border-b border-slate-700 pb-3 last:border-b-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-slate-200">{budget.category_name}</span>
                                        {!budget.isEditing && (
                                            <span className={`text-sm ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {remaining >= 0 ? `$${remaining.toFixed(2)} left` : `$${Math.abs(remaining).toFixed(2)} over`}
                                            </span>
                                        )}
                                    </div>
                                    <ProgressBar value={spent} max={budgeted} />
                                    <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                                        <span>${spent.toFixed(2)} spent</span>
                                        {budget.isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-300">Budget: $</span>
                                                <input
                                                    type="number"
                                                    value={editingAmount}
                                                    onChange={(e) => setEditingAmount(e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                    className="px-1 py-0 border border-slate-500 rounded bg-slate-600 text-slate-100 w-20 text-xs"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleSaveEdit(budget.budget_id)} title="Save" className="text-green-400 hover:text-green-300">✓</button>
                                                <button onClick={() => handleCancelEdit(budget.budget_id)} title="Cancel" className="text-red-400 hover:text-red-300">✕</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span>Budget: ${budgeted.toFixed(2)}</span>
                                                <button onClick={() => handleEditClick(budget)} title="Edit Budget Amount" className="text-slate-400 hover:text-blue-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}> <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => handleDeleteBudget(budget.budget_id)} title="Delete Budget" className="text-slate-400 hover:text-red-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )
            )}
        </div>
    );
};

export default BudgetList; 