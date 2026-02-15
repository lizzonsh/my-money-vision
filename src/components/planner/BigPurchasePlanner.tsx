import { useState } from 'react';
import { useFinance, BigPurchaseGoal } from '@/contexts/FinanceContext';
import { useGoalItems, GoalItem } from '@/hooks/useGoalItems';
import {
  formatCurrency,
} from '@/lib/formatters';
import { Plus, Target, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import GoalCard from '@/components/goals/GoalCard';
import { useToast } from '@/hooks/use-toast';

const BigPurchasePlanner = () => {
  const { bigPurchases, addBigPurchase, updateBigPurchase, deleteBigPurchase, archiveBigPurchase, addExpense, deleteExpense, expenses } = useFinance();
  const { goalItems, addGoalItem, updateGoalItem, deleteGoalItem, markAsPurchased, unmarkAsPurchased } = useGoalItems();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<BigPurchaseGoal | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    priority: 'medium',
    category: 'other',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      priority: 'medium',
      category: 'other',
      notes: '',
    });
    setEditingGoal(null);
  };

  const handleOpenEdit = (goal: BigPurchaseGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      priority: goal.priority,
      category: goal.category,
      notes: goal.notes || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalData = {
      name: formData.name,
      target_amount: 0,
      current_saved: 0,
      monthly_contribution: 0,
      target_date: null,
      priority: formData.priority as 'high' | 'medium' | 'low',
      category: formData.category as 'furniture' | 'electronics' | 'education' | 'vehicle' | 'property' | 'vacation' | 'other',
      notes: formData.notes || null,
      is_archived: false,
    };

    if (editingGoal) {
      updateBigPurchase({ id: editingGoal.id, ...goalData });
    } else {
      addBigPurchase(goalData);
    }
    resetForm();
    setIsOpen(false);
  };

  const handlePurchaseItem = (item: GoalItem) => {
    // Create an expense for this purchase
    const today = new Date();
    const expenseMonth = item.planned_month || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    addExpense({
      month: expenseMonth,
      description: item.name,
      amount: Number(item.estimated_cost),
      category: 'goal',
      expense_date: today.toISOString().split('T')[0],
      payment_method: item.payment_method as 'credit_card' | 'bank_transfer',
      card_id: item.card_id || null,
      kind: 'planned',
      expense_month: null,
      month_of_expense: null,
      recurring_day_of_month: null,
      recurring_type: null,
    });

    // Mark as purchased
    markAsPurchased({ itemId: item.id });
    toast({ title: `${item.name} added to expenses`, description: `₪${item.estimated_cost} expense created` });
  };

  const handleUnpurchaseItem = (itemId: string) => {
    // Find the goal item to get its name
    const item = goalItems.find(i => i.id === itemId);
    if (item) {
      // Find and delete the associated expense (match by description and category)
      const associatedExpense = expenses.find(
        e => e.description === item.name && e.category === 'goal'
      );
      if (associatedExpense) {
        deleteExpense(associatedExpense.id);
      }
    }
    
    // Unmark as purchased
    unmarkAsPurchased(itemId);
    toast({ title: 'Purchase undone', description: 'Expense has been removed' });
  };

  const getItemsForGoal = (goalId: string) => goalItems.filter(item => item.goal_id === goalId);

  const activeGoals = bigPurchases.filter(g => !g.is_archived);
  const archivedGoals = bigPurchases.filter(g => g.is_archived);
  const displayedGoals = showArchived ? archivedGoals : activeGoals;

  // Calculate total stats (active goals only)
  const activeGoalIds = new Set(activeGoals.map(g => g.id));
  const activeGoalItems = goalItems.filter(i => activeGoalIds.has(i.goal_id));
  const totalItems = activeGoalItems.length;
  const purchasedItems = activeGoalItems.filter(i => i.is_purchased).length;
  const totalCost = activeGoalItems.reduce((sum, i) => sum + Number(i.estimated_cost), 0);
  const purchasedCost = activeGoalItems.filter(i => i.is_purchased).reduce((sum, i) => sum + Number(i.estimated_cost), 0);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Goals</h2>
          <p className="text-muted-foreground">Track your planned purchases</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />New Goal</Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., New Setup" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
              </div>
              <Button type="submit" className="w-full">{editingGoal ? 'Save Changes' : 'Create Goal'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      {totalItems > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Items</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Purchased</p>
            <p className="text-2xl font-bold text-success">{purchasedItems}</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Spent</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(purchasedCost)}</p>
          </div>
        </div>
      )}

      {/* Archive Toggle */}
      {archivedGoals.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? 'Show Active' : `Archived (${archivedGoals.length})`}
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {displayedGoals.length === 0 ? (
          <div className="col-span-2 glass rounded-xl p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{showArchived ? 'No archived goals' : 'No goals yet'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {showArchived ? 'Archived goals will appear here' : 'Create a goal to start tracking your purchases'}
            </p>
            {!showArchived && <Button onClick={() => setIsOpen(true)}>Create Your First Goal</Button>}
          </div>
        ) : (
          displayedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              items={getItemsForGoal(goal.id)}
              onEditGoal={handleOpenEdit}
              onDeleteGoal={deleteBigPurchase}
              onAddItem={addGoalItem}
              onUpdateItem={updateGoalItem}
              onDeleteItem={deleteGoalItem}
              onPurchaseItem={handlePurchaseItem}
              onUnpurchaseItem={handleUnpurchaseItem}
              onArchiveGoal={(id) => archiveBigPurchase({ id, is_archived: !goal.is_archived })}
              isArchived={goal.is_archived}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BigPurchasePlanner;
