import React, { useState, useEffect } from 'react';
import { Account, Transaction } from '../types'; // Import Transaction type

const API_BASE_URL = 'http://localhost:4000/api';

type RatioCategory = 'Need' | 'Want' | 'Saving'; // Define type alias

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransactionAdded: () => void; // Function to trigger refresh in Dashboard
    accounts: Account[];
    transactionToEdit?: Transaction | null; // <-- Add optional prop for editing
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    isOpen,
    onClose,
    onTransactionAdded,
    accounts,
    transactionToEdit = null // <-- Default to null
}) => {
    // Form State
    const [type, setType] = useState<'Expense' | 'Income'>('Expense');
    const [accountId, setAccountId] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
    const [category, setCategory] = useState<string>('');
    const [ratioCategory, setRatioCategory] = useState<RatioCategory | ''>(''); // <-- Add state for ratio category
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const isEditing = !!transactionToEdit; // Determine if we are in edit mode

    // Reset form when modal opens or accounts change
    useEffect(() => {
        if (isOpen) {
            if (isEditing && transactionToEdit) {
                // Populate form with existing data
                const editAmount = Math.abs(parseFloat(transactionToEdit.amount)).toString(); // Use positive amount for form input
                setType(parseFloat(transactionToEdit.amount) < 0 ? 'Expense' : 'Income');
                setAccountId(transactionToEdit.account_id.toString());
                setDescription(transactionToEdit.description);
                setAmount(editAmount);
                // Ensure date format is YYYY-MM-DD for the input field
                try {
                    setDate(new Date(transactionToEdit.transaction_date).toISOString().split('T')[0]);
                } catch {
                    setDate(new Date().toISOString().split('T')[0]); // Fallback
                }
                setCategory(transactionToEdit.category || '');
                setRatioCategory((transactionToEdit.ratio_category as RatioCategory) || '');
            } else {
                // Reset form for adding new
                setType('Expense');
                // Set default account if available and not already set or if previous selection is gone
                if (accounts.length > 0 && (!accountId || !accounts.find(acc => acc.account_id.toString() === accountId))) {
                    setAccountId(accounts[0].account_id.toString());
                } else if (accounts.length === 0) {
                    setAccountId(''); // Clear if no accounts
                }
                setDescription('');
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
                setCategory('');
                setRatioCategory(''); // <-- Reset ratio category
            }
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, transactionToEdit, isEditing, accounts]); // Add dependencies

    // Handle form submission
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        // Basic Validation
        if (!accountId || !description || !amount || !date) {
            setError('Please fill in all required fields (Account, Description, Amount, Date).');
            setIsSubmitting(false);
            return;
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
             setError('Please enter a valid positive amount.');
             setIsSubmitting(false);
             return;
        }

        // Adjust amount based on type (make expenses negative)
        const finalAmount = type === 'Expense' ? -numericAmount : numericAmount;

        const transactionData = {
            account_id: parseInt(accountId, 10),
            transaction_type: type,
            description: description,
            amount: finalAmount,
            transaction_date: date,
            category: category || null,
            ratio_category: ratioCategory || null, // <-- Include ratio category
        };

        const url = isEditing
            ? `${API_BASE_URL}/transactions/${transactionToEdit?.transaction_id}`
            : `${API_BASE_URL}/transactions`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method, // Use PUT or POST
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(transactionData),
            });

            if (!response.ok) {
                // Try to parse error message from backend
                let errorMsg = `HTTP error! status: ${response.status}`;
                 try { const errBody = await response.json(); errorMsg = errBody.error || errorMsg; } catch (_) {}
                 throw new Error(errorMsg);
            }

            // Success!
            onTransactionAdded(); // Trigger refresh in parent
            onClose(); // Close the modal

        } catch (error: any) {
            console.error("Failed to add transaction:", error);
            setError(error.message || 'Failed to add transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };


    if (!isOpen) {
        return null; // Don't render anything if modal is closed
    }

    // Render the modal
    return (
        // Modal Overlay
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            {/* Modal Content */}
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-100">
                        {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-slate-200 transition duration-150"
                        aria-label="Close modal"
                    >
                        {/* Simple X icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Transaction Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Transaction Type (Radio Buttons) */}
                    <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                             <input
                                type="radio"
                                name="transactionType"
                                value="Expense"
                                checked={type === 'Expense'}
                                onChange={() => setType('Expense')}
                                className="form-radio text-red-500 focus:ring-red-400"
                                disabled={isSubmitting}
                            />
                            <span className="text-red-400 font-medium">Expense</span>
                        </label>
                         <label className="flex items-center space-x-2 cursor-pointer">
                             <input
                                type="radio"
                                name="transactionType"
                                value="Income"
                                checked={type === 'Income'}
                                onChange={() => setType('Income')}
                                className="form-radio text-green-500 focus:ring-green-400"
                                disabled={isSubmitting}
                             />
                            <span className="text-green-400 font-medium">Income</span>
                        </label>
                    </div>

                     {/* Account Selection */}
                     <div>
                         <label htmlFor="accountId" className="block text-sm font-medium text-slate-300 mb-1">Account *</label>
                         <select
                             id="accountId"
                             value={accountId}
                             onChange={(e) => setAccountId(e.target.value)}
                             required
                             disabled={isSubmitting || accounts.length === 0}
                             className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-slate-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                         >
                             <option value="" disabled>
                                 {accounts.length === 0 ? 'No accounts available' : '-- Select Account --'}
                             </option>
                             {accounts.map(acc => (
                                 <option key={acc.account_id} value={acc.account_id.toString()}>
                                     {acc.account_name} ({formatCurrency(acc.current_balance)})
                                 </option>
                             ))}
                         </select>
                     </div>


                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Description *</label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Groceries, Salary"
                        />
                    </div>

                    {/* Amount */}
                    <div>
                         <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">Amount *</label>
                         <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            step="0.01"
                            min="0.01" // Ensure positive input
                        />
                    </div>

                     {/* Date */}
                    <div>
                         <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">Date *</label>
                        <input
                            type="date"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Category (Optional) */}
                    <div>
                         <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                        <input
                            type="text"
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Food, Travel (Optional)"
                        />
                    </div>

                     {/* --- Ratio Category (Radio Buttons - Optional for Income) --- */}
                     {type === 'Expense' && ( // Only show for expenses
                         <div>
                             <label className="block text-sm font-medium text-slate-300 mb-2">Ratio Category</label>
                             <div className="flex flex-wrap gap-x-4 gap-y-2">
                                 {(['Need', 'Want', 'Saving'] as RatioCategory[]).map(rc => (
                                     <label key={rc} className="flex items-center space-x-2 cursor-pointer">
                                         <input
                                             type="radio"
                                             name="ratioCategory"
                                             value={rc}
                                             checked={ratioCategory === rc}
                                             onChange={() => setRatioCategory(rc)}
                                             className="form-radio text-blue-500 focus:ring-blue-400"
                                             disabled={isSubmitting}
                                         />
                                         <span className="text-slate-300">{rc}</span>
                                     </label>
                                 ))}
                                  <label className="flex items-center space-x-2 cursor-pointer">
                                         <input
                                             type="radio"
                                             name="ratioCategory"
                                             value="" // For unsetting
                                             checked={ratioCategory === ''}
                                             onChange={() => setRatioCategory('')}
                                             className="form-radio text-gray-500 focus:ring-gray-400"
                                             disabled={isSubmitting}
                                         />
                                         <span className="text-slate-500 italic">None</span>
                                     </label>
                             </div>
                         </div>
                     )}

                     {/* Error Display */}
                     {error && (
                        <p className="text-sm text-red-500 bg-red-900 bg-opacity-30 border border-red-700 p-2 rounded">
                            Error: {error}
                        </p>
                     )}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="mr-2 px-4 py-2 rounded bg-slate-600 hover:bg-slate-500 text-slate-100 transition duration-150 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Transaction')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Temporary helper - move to utils if needed
const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return 'N/A';
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};


export default AddTransactionModal; 