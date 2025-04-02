// Define the structure for an Account object based on our API response
export interface Account {
    account_id: number;
    account_name: string;
    account_type: string;
    current_balance: string; // Comes as string from NUMERIC type via JSON
}

// Define the structure for a Transaction object based on our API response
export interface Transaction {
    transaction_id: number;
    account_id: number;
    account_name: string; // Joined from accounts table
    transaction_type: 'Income' | 'Expense' | 'Transfer'; // Restrict to known types
    description: string;
    amount: string; // Comes as string from NUMERIC type via JSON
    transaction_date: string; // Comes as string like 'YYYY-MM-DD'
    category: string | null;
    ratio_category: 'Need' | 'Want' | 'Saving' | null; // <-- Add ratio category type
    created_at: string; // Comes as ISO string
}

// Interface for Budget data (if you add types for it)
export interface BudgetData {
    budget_id: number;
    category_name: string;
    budgeted_amount: string;
    actual_spending: string;
} 