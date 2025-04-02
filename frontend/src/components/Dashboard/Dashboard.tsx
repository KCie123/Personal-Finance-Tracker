import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Account, Transaction } from '../../types'; // Import the types
import AddTransactionModal from '../AddTransactionModal'; // Import the modal
import SpendingChart from './SpendingChart'; // Import the new chart component
import BudgetList from '../Budgeting/BudgetList'; // <-- Import BudgetList
import RatioBudgetDisplay from '../Budgeting/RatioBudgetDisplay'; // <-- Import Ratio display
// import styles from './Dashboard.module.css'; // Example for CSS Modules

// Use a slightly lighter slate for cards to contrast with bg-slate-900
const cardClasses = "bg-slate-800 rounded-lg shadow-lg p-4 md:p-6"; // Added shadow-lg
const API_BASE_URL = 'http://localhost:4000/api'; // Backend API base URL
const MIN_LOADING_TIME = 2000; // Minimum loading time in milliseconds (2 seconds)

// --- Loading Spinner Component (can be moved to its own file later) ---
const LoadingSpinner: React.FC = () => {
    return (
        // Centered overlay for the spinner
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-75 z-20 rounded-lg">
             {/* Spinner element using border utilities */}
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400"></div>
        </div>
    );
};

const Dashboard: React.FC = () => {
  // State for accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State for modal visibility
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null); // <-- State for editing

  // Determine overall loading state
  const isLoading = isLoadingAccounts || isLoadingTransactions;

  // --- Define Fetch Functions outside useEffect ---
  // Use useCallback to memoize these functions if they were passed as props
  // or used in dependency arrays, though not strictly necessary here yet.
  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`);
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try { const errBody = await response.json(); errorMsg = errBody.error || errorMsg; } catch (_) {}
        throw new Error(errorMsg);
      }
      const data: Account[] = await response.json();
      setAccounts(data);
    } catch (error: any) {
      console.error("Failed to fetch accounts:", error);
      setAccountsError(error.message || 'Failed to fetch accounts');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []); // Empty dependency array for useCallback as it doesn't depend on props/state

  const fetchTransactions = useCallback(async () => {
    setIsLoadingTransactions(true);
    setTransactionsError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`);
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try { const errBody = await response.json(); errorMsg = errBody.error || errorMsg; } catch (_) {}
        throw new Error(errorMsg);
      }
      const data: Transaction[] = await response.json();
      setTransactions(data);
    } catch (error: any) {
      console.error("Failed to fetch transactions:", error);
      setTransactionsError(error.message || 'Failed to fetch transactions');
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []); // Empty dependency array for useCallback

  // Fetch data on component mount using the functions defined above
  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, [fetchAccounts, fetchTransactions]); // Include memoized functions in dependency array

  // Calculate total net worth (simple sum of balances)
  const calculateNetWorth = () => {
    if (isLoadingAccounts || accountsError) return 'Calculating...';
    const total = accounts.reduce((sum, account) => {
        // Consider credit card balances typically subtract from net worth
        const balance = parseFloat(account.current_balance);
        if (account.account_type.toLowerCase().includes('credit')) {
            return sum - balance; // Subtract credit card debt
        }
        return sum + balance;
    }, 0);
    return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); // Format as currency
  };

  // Helper to format currency
  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return 'N/A';
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

    // --- Helper to format date (Improved Parsing) ---
    const formatDate = (dateString: string | null | undefined): string => {
        // Log the input to see its format
        // console.log("Formatting date string:", dateString);

        if (!dateString) {
            return 'No Date'; // Handle null or undefined input
        }

        try {
             // Try creating a Date object directly from the string
             // The Date constructor can often handle various ISO-like formats
             const date = new Date(dateString);

             // Check if the resulting date is valid
             if (isNaN(date.getTime())) {
                 console.error("Failed to parse date string:", dateString);
                 return 'Invalid Date'; // Return specific error string if parsing failed
             }

             // If valid, format it
             return date.toLocaleDateString(undefined, {
                 year: 'numeric', month: 'short', day: 'numeric'
             });
        } catch (e) {
             console.error("Error in formatDate:", e);
             return 'Invalid Date'; // Return error string on exception
        }
    };

  const handleOpenModal = (transaction: Transaction | null = null) => { // Accept optional transaction
    setEditingTransaction(transaction); // Set transaction to edit (or null for add)
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setEditingTransaction(null); // Clear editing state on close
    setIsModalOpen(false);
  };
  const handleTransactionUpdate = () => { // Renamed for clarity (add/edit/delete)
    fetchTransactions();
    fetchAccounts();
  };

  // --- Delete Transaction Handler ---
  const handleDeleteTransaction = async (transactionId: number) => {
    // Confirmation dialog
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
         // Try to get error message from response body
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          // DELETE might not return JSON body on error, check status text
          errorMsg = response.statusText || errorMsg;
          if (response.headers.get('content-type')?.includes('application/json')) {
             const errBody = await response.json();
             errorMsg = errBody.error || errorMsg;
          }
        } catch (_) { /* Ignore if body isn't JSON */ }
        throw new Error(errorMsg);
      }
       // Success (status 204 No Content doesn't need json parsing)
      handleTransactionUpdate(); // Refresh list

    } catch (error: any) {
      console.error("Failed to delete transaction:", error);
      // TODO: Display error to user (e.g., using a toast notification library)
       alert(`Error deleting transaction: ${error.message}`);
    }
  };

  // --- Process data for Spending Chart ---
  const chartData = useMemo(() => {
    console.log('Calculating chartData. Transactions:', transactions); // Log raw transactions

    if (!transactions || transactions.length === 0) {
        console.log('No transactions found for chart calculation.');
        return [];
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    console.log(`Current month: ${currentMonth}, Current year: ${currentYear}`);

    const monthlyExpenses = transactions.filter(tx => {
        try {
            const txDate = new Date(tx.transaction_date);

            // Check if the date object is valid after parsing
            if (isNaN(txDate.getTime())) {
                console.error("Failed to parse date for TxID:", tx.transaction_id, "Date string:", tx.transaction_date);
                return false; // Exclude if date is invalid
            }

            const isExpense = parseFloat(tx.amount) < 0;
            const txMonth = txDate.getMonth();
            const txYear = txDate.getFullYear();
            const isCurrentMonth = txMonth === currentMonth;
            const isCurrentYear = txYear === currentYear;

            // --- Detailed Log (keep for now) ---
             console.log(
                 `TxID: ${tx.transaction_id},`,
                 `Date: ${tx.transaction_date},`,
                 `txMonth: ${txMonth}, currentMonth: ${currentMonth}, -> MonthMatch: ${isCurrentMonth},`,
                 `txYear: ${txYear}, currentYear: ${currentYear}, -> YearMatch: ${isCurrentYear},`,
                 `Amount: ${tx.amount}, -> IsExpense: ${isExpense},`,
                 `---> IncludeInChart: ${isExpense && isCurrentMonth && isCurrentYear}`
             );
            // --------------------

             return isExpense && isCurrentMonth && isCurrentYear;
        } catch (e) {
             console.error("Error processing transaction date for TxID:", tx.transaction_id, tx.transaction_date, e);
             return false;
        }
    });
    console.log('Filtered monthly expenses:', monthlyExpenses); // Log expenses for this month

    const spendingByCategory = monthlyExpenses.reduce((acc, tx) => {
        const category = tx.category || 'Uncategorized';
        const amount = Math.abs(parseFloat(tx.amount));

        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += amount;
        return acc;
    }, {} as { [key: string]: number });
    console.log('Aggregated spending by category:', spendingByCategory); // Log aggregated data

    const finalChartData = Object.entries(spendingByCategory)
        .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
        .sort((a, b) => b.value - a.value);

    console.log('Final chart data:', finalChartData); // Log final formatted data
    return finalChartData;

}, [transactions]); // Re-calculate only when transactions change

  // Pass transactions, loading state, and error state down
  const ratioProps = {
      transactions,
      isLoading: isLoadingTransactions, // Base ratio display on transactions loading state
      error: transactionsError,
  };

  return (
    // Add relative positioning to allow absolute positioning of the spinner overlay
    <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

       {/* Conditionally render the Loading Spinner overlay */}
      {isLoading && <LoadingSpinner />}

      {/* Net Worth Card - Conditionally hide content or show error based on specific loading/error state */}
      <section className={`${cardClasses} md:col-span-1 lg:col-span-2 ${isLoading ? 'opacity-50 blur-sm' : ''} transition-opacity duration-300`}>
        <h3 className="text-lg font-semibold mb-2 text-blue-400">Total Net Worth</h3>
        {/* Show calculating only if not loading overlay is active */}
        {!isLoading && isLoadingAccounts && <p className="text-slate-400">Calculating...</p>}
        {accountsError && <p className="text-red-500">Error: {accountsError}</p>}
        {!isLoadingAccounts && !accountsError && (
           <p className="text-2xl font-bold text-slate-100">{calculateNetWorth()}</p>
        )}
        {/* Example Trend Indicator */}
        {/* <p className="text-sm text-green-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
           </svg>
           +5.2% this month
        </p> */}
      </section>

      {/* Current Balances Card - Conditionally hide content or show error */}
      <section className={`${cardClasses} ${isLoading ? 'opacity-50 blur-sm' : ''} transition-opacity duration-300`}>
        <h3 className="text-lg font-semibold mb-2 text-purple-400">Current Balances</h3>
         {/* Show placeholder only if not loading overlay is active */}
        {!isLoading && isLoadingAccounts && <p className="text-slate-400">Loading...</p>}
        {accountsError && <p className="text-red-500">Error: {accountsError}</p>}
        {!isLoadingAccounts && !accountsError && (
          <ul className="space-y-1">
            {accounts.length > 0 ? (
                accounts.map(account => (
                    <li key={account.account_id} className="flex justify-between text-slate-300">
                        <span>{account.account_name}</span>
                        <span className="font-medium text-slate-100">{formatCurrency(account.current_balance)}</span>
                    </li>
                 ))
             ) : (
                <p className="text-slate-400">No accounts found.</p>
             )}
          </ul>
        )}
      </section>

      {/* Quick Actions Card - Conditionally hide content */}
      <section className={`${cardClasses} ${isLoading ? 'opacity-50 blur-sm' : ''} transition-opacity duration-300`}>
          <h3 className="text-lg font-semibold mb-3 text-teal-400">Quick Actions</h3>
          <div className="flex flex-col space-y-2">
            <button
                onClick={() => handleOpenModal()} // Call without args for adding
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded shadow hover:shadow-lg transform hover:scale-105 active:scale-95 transition duration-150 ease-in-out w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || accounts.length === 0}
                title={accounts.length === 0 ? "Add an account first" : "Add a new transaction"}
            >
                Add Transaction
            </button>
            <button className="bg-slate-600 hover:bg-slate-500 text-slate-100 font-medium py-2 px-4 rounded shadow hover:shadow-lg transform hover:scale-105 active:scale-95 transition duration-150 ease-in-out w-full disabled:opacity-50" disabled={isLoading}>
                View Budgets
            </button>
          </div>
      </section>


      {/* Spending Chart Card - Conditionally hide content */}
      <section className={`${cardClasses} md:col-span-2 lg:col-span-2 ${isLoading ? 'opacity-50 blur-sm' : ''} transition-opacity duration-300`}>
        <h3 className="text-lg font-semibold mb-2 text-orange-400">Spending Breakdown (This Month)</h3>
        {/* Conditionally render chart or placeholder */}
        {!isLoadingTransactions && transactionsError && (
            <p className="text-red-500 h-64 flex items-center justify-center">Error loading transactions.</p>
        )}
        {!isLoadingTransactions && !transactionsError && chartData.length === 0 && (
             <p className="text-slate-400 h-64 flex items-center justify-center">No expense data for this month.</p>
        )}
         {!isLoadingTransactions && !transactionsError && chartData.length > 0 && (
            // Render the chart component
            <SpendingChart data={chartData} />
         )}
         {/* Show simple loading text if transactions are loading */}
         {isLoadingTransactions && (
             <div className="h-64 flex items-center justify-center text-slate-500">
                Loading Chart Data...
             </div>
         )}
      </section>

      {/* Budget List Card - Conditionally hide content */}
      <section className={`${cardClasses} md:col-span-2 lg:col-span-2 ${isLoading ? 'opacity-50 blur-sm' : ''} transition-opacity duration-300`}>
        <BudgetList />
      </section>

      {/* Ratio Budget Card - Conditionally hide content */}
      <section className={`${cardClasses} md:col-span-2 lg:col-span-2 ${isLoading ? 'opacity-50 blur-sm' : ''} transition-opacity duration-300`}>
        <RatioBudgetDisplay {...ratioProps} /> {/* <-- Render Ratio display */}
      </section>

      {/* Recent Transactions Card - Conditionally hide content or show error */}
      <section className={`${cardClasses} md:col-span-4 lg:col-span-4 ${isLoading ? 'opacity-50 blur-sm' : ''} transition-opacity duration-300`}>
        <h3 className="text-lg font-semibold mb-2 text-indigo-400">Recent Transactions</h3>
         {/* Show placeholder only if not loading overlay is active */}
        {!isLoading && isLoadingTransactions && <p className="text-slate-400">Loading...</p>}
        {transactionsError && <p className="text-red-500">Error: {transactionsError}</p>}
        {!isLoadingTransactions && !transactionsError && (
           <ul className="divide-y divide-slate-700">
             {transactions.length > 0 ? (
                transactions.map(tx => (
                    <li key={tx.transaction_id} className="py-3 flex justify-between items-center">
                        <div className="flex-grow mr-4"> {/* Added flex-grow and margin */}
                            <p className="font-medium text-slate-200">{tx.description}</p>
                            <p className="text-sm text-slate-400">
                                {tx.account_name} - {formatDate(tx.transaction_date)} {tx.category ? `(${tx.category})` : ''} {tx.ratio_category ? `[${tx.ratio_category}]` : ''} {/* Show ratio category */}
                            </p>
                        </div>
                        <span className={`font-medium mr-4 ${parseFloat(tx.amount) >= 0 ? 'text-green-400' : 'text-red-400'}`}> {/* Added margin */}
                            {formatCurrency(tx.amount)}
                        </span>
                        <div className="flex-shrink-0 flex space-x-2"> {/* Container for buttons */}
                             <button
                                 onClick={() => handleOpenModal(tx)} // Pass transaction to edit
                                 title="Edit Transaction"
                                 className="p-1 text-slate-400 hover:text-blue-400 transition duration-150"
                             >
                                  {/* Edit Icon (Heroicons example) */}
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                             </button>
                              <button
                                 onClick={() => handleDeleteTransaction(tx.transaction_id)}
                                 title="Delete Transaction"
                                 className="p-1 text-slate-400 hover:text-red-500 transition duration-150"
                             >
                                  {/* Delete Icon (Heroicons example) */}
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                        </div>
                    </li>
                ))
             ) : (
                <p className="text-slate-400">No transactions found.</p>
             )}
           </ul>
        )}
      </section>

      {/* --- Render the Modal --- */}
      <AddTransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onTransactionAdded={handleTransactionUpdate} // Use updated handler name
          accounts={accounts}
          transactionToEdit={editingTransaction} // Pass the transaction being edited
      />

    </div>
  );
};

export default Dashboard; 