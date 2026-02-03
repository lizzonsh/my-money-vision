import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const RecentTransactions = () => {
  const { expenses, incomes, currentMonth } = useFinance();

  // Combine and sort transactions
  const transactions = [
    ...expenses
      .filter(e => e.month === currentMonth)
      .map(e => ({
        id: e.id,
        type: 'expense' as const,
        amount: Number(e.amount),
        description: e.description,
        date: e.expense_date,
        category: e.category,
      })),
    ...incomes
      .filter(i => i.month === currentMonth)
      .map(i => ({
        id: i.id,
        type: 'income' as const,
        amount: Number(i.amount),
        description: i.description || i.name,
        date: i.income_date || '',
        category: i.name,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Transactions</h3>
        <button className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No transactions this month
          </p>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    transaction.type === 'income'
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {transaction.type === 'income' ? (
                    <ArrowDownRight className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {transaction.category.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    transaction.type === 'income' ? 'text-success' : 'text-foreground'
                  )}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.date ? formatDate(transaction.date) : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
