import React, { useMemo } from 'react';
import { Transaction } from '../../types'; // Import Transaction type

interface RatioBudgetDisplayProps {
    transactions: Transaction[]; // Pass transactions from Dashboard
    isLoading: boolean;
    error: string | null;
}

// Simple progress bar component (can reuse from BudgetList or move to shared location)
const RatioProgressBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
    const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
    return (
        <div className="w-full bg-slate-600 rounded-full h-4 dark:bg-slate-700 my-1 relative">
            <div
                className={`h-4 rounded-full transition-all duration-500 ease-out ${color}`}
                style={{ width: `${percentage}%` }}
            ></div>
             {/* Display percentage inside or outside */}
             <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference px-2">
                {percentage.toFixed(0)}%
             </span>
        </div>
    );
};

const RatioBudgetDisplay: React.FC<RatioBudgetDisplayProps> = ({ transactions, isLoading, error }) => {

    const ratioData = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            return { totalIncome: 0, needs: 0, wants: 0, savings: 0 };
        }

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let totalIncome = 0;
        let needs = 0;
        let wants = 0;
        let savings = 0;

        transactions.forEach(tx => {
            try {
                const txDate = new Date(tx.transaction_date);
                if (isNaN(txDate.getTime())) return; // Skip invalid dates

                if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                    const amount = parseFloat(tx.amount);
                    if (amount > 0) { // Income
                        totalIncome += amount;
                    } else { // Expense
                        const absAmount = Math.abs(amount);
                        if (tx.ratio_category === 'Need') {
                            needs += absAmount;
                        } else if (tx.ratio_category === 'Want') {
                            wants += absAmount;
                        } else if (tx.ratio_category === 'Saving') {
                            savings += absAmount;
                        }
                        // Ignore expenses not categorized into Need/Want/Saving for this calculation
                    }
                }
            } catch (e) {
                console.error("Error processing transaction for ratio:", tx, e);
            }
        });

        return {
            totalIncome: parseFloat(totalIncome.toFixed(2)),
            needs: parseFloat(needs.toFixed(2)),
            wants: parseFloat(wants.toFixed(2)),
            savings: parseFloat(savings.toFixed(2)),
        };

    }, [transactions]); // Recalculate when transactions change

    const formatCurrency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    const totalSpending = ratioData.needs + ratioData.wants + ratioData.savings;
    // Use total Income as base for percentage calculation, or total spending if income is zero
    const baseAmount = ratioData.totalIncome > 0 ? ratioData.totalIncome : (totalSpending > 0 ? totalSpending : 1);

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg p-4 md:p-6">
            <h3 className="text-xl font-semibold mb-4 text-cyan-400">Ratio Spending (This Month)</h3>

            {isLoading && <p className="text-slate-400">Loading data...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {!isLoading && !error && (
                <>
                 <p className="text-sm text-slate-400 mb-3">Based on income of: <span className="font-medium text-slate-200">{formatCurrency(ratioData.totalIncome)}</span></p>
                 <div className="space-y-4">
                     {/* Needs */}
                     <div>
                         <div className="flex justify-between items-baseline mb-1">
                             <span className="font-medium text-slate-200">Needs</span>
                             <span className="text-sm text-slate-400">{formatCurrency(ratioData.needs)} (Target: 50%)</span>
                         </div>
                         <RatioProgressBar value={ratioData.needs} max={baseAmount * 0.50} color="bg-blue-500" />
                     </div>
                      {/* Wants */}
                     <div>
                         <div className="flex justify-between items-baseline mb-1">
                             <span className="font-medium text-slate-200">Wants</span>
                             <span className="text-sm text-slate-400">{formatCurrency(ratioData.wants)} (Target: 30%)</span>
                         </div>
                         <RatioProgressBar value={ratioData.wants} max={baseAmount * 0.30} color="bg-purple-500" />
                     </div>
                      {/* Savings */}
                     <div>
                         <div className="flex justify-between items-baseline mb-1">
                             <span className="font-medium text-slate-200">Savings/Debt</span>
                             <span className="text-sm text-slate-400">{formatCurrency(ratioData.savings)} (Target: 20%)</span>
                         </div>
                         <RatioProgressBar value={ratioData.savings} max={baseAmount * 0.20} color="bg-green-500" />
                     </div>

                 </div>
                </>
            )}
        </div>
    );
};

export default RatioBudgetDisplay; 