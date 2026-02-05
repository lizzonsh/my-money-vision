 import { useState } from 'react';
 import { BigPurchaseGoal } from '@/contexts/FinanceContext';
 import { GoalItem, GoalItemInsert } from '@/hooks/useGoalItems';
 import { formatCurrency, formatMonth } from '@/lib/formatters';
import { Trash2, Pencil, Plus, ChevronDown, ChevronUp, ShoppingCart, Check, X, CalendarDays } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
 import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
 } from '@/components/ui/collapsible';
 import { cn } from '@/lib/utils';
 
 interface GoalCardProps {
   goal: BigPurchaseGoal;
   items: GoalItem[];
   onEditGoal: (goal: BigPurchaseGoal) => void;
   onDeleteGoal: (id: string) => void;
   onAddItem: (item: GoalItemInsert) => void;
   onUpdateItem: (item: { id: string } & Partial<GoalItem>) => void;
   onDeleteItem: (id: string) => void;
   onPurchaseItem: (item: GoalItem) => void;
   onUnpurchaseItem: (id: string) => void;
 }
 
 const categoryIcons: Record<string, string> = {
   furniture: '🪑',
   electronics: '💻',
   education: '🎓',
   vehicle: '🚗',
   property: '🏠',
   vacation: '✈️',
   other: '📦',
 };
 
 const priorityStyles = {
   high: 'border-l-destructive bg-destructive/5',
   medium: 'border-l-warning bg-warning/5',
   low: 'border-l-success bg-success/5',
 };
 
// Generate months for picker (current month + next 24 months)
const generateMonthOptions = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }
  return months;
};

 const GoalCard = ({
   goal,
   items,
   onEditGoal,
   onDeleteGoal,
   onAddItem,
   onUpdateItem,
   onDeleteItem,
   onPurchaseItem,
   onUnpurchaseItem,
 }: GoalCardProps) => {
   const [isExpanded, setIsExpanded] = useState(true);
   const [isAddItemOpen, setIsAddItemOpen] = useState(false);
   const [itemFormData, setItemFormData] = useState({
     name: '',
     estimatedCost: '',
     plannedMonth: '',
     paymentMethod: 'credit_card',
     cardId: '',
     notes: '',
   });
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
 
   const purchasedItems = items.filter(i => i.is_purchased);
   const pendingItems = items.filter(i => !i.is_purchased);
   const totalCost = items.reduce((sum, i) => sum + Number(i.estimated_cost), 0);
   const purchasedCost = purchasedItems.reduce((sum, i) => sum + Number(i.estimated_cost), 0);
   const progressPercent = items.length > 0 ? (purchasedItems.length / items.length) * 100 : 0;
 
   const resetItemForm = () => {
     setItemFormData({
       name: '',
       estimatedCost: '',
       plannedMonth: '',
       paymentMethod: 'credit_card',
       cardId: '',
       notes: '',
     });
   };
 
   const handleAddItem = (e: React.FormEvent) => {
     e.preventDefault();
     onAddItem({
       goal_id: goal.id,
       name: itemFormData.name,
       estimated_cost: parseFloat(itemFormData.estimatedCost) || 0,
       planned_month: itemFormData.plannedMonth,
       payment_method: itemFormData.paymentMethod,
       card_id: itemFormData.cardId || null,
       notes: itemFormData.notes || null,
     });
     resetItemForm();
     setIsAddItemOpen(false);
   };
 
   return (
    <div className={cn('glass rounded-xl border-l-4 shadow-card overflow-hidden hover-glow', priorityStyles[goal.priority])}>
       {/* Goal Header */}
       <div className="p-5">
         <div className="flex items-start justify-between mb-3">
           <div className="flex items-center gap-3">
             <span className="text-2xl">{categoryIcons[goal.category]}</span>
             <div>
               <h3 className="font-semibold">{goal.name}</h3>
               <p className="text-sm text-muted-foreground capitalize">{goal.priority} priority</p>
             </div>
           </div>
           <div className="flex items-center gap-1">
              <button onClick={() => onEditGoal(goal)} className="p-1.5 hover:bg-secondary hover:scale-110 rounded transition-all">
               <Pencil className="h-4 w-4 text-muted-foreground" />
             </button>
              <button onClick={() => onDeleteGoal(goal.id)} className="p-1.5 hover:bg-destructive/10 hover:scale-110 rounded transition-all">
               <Trash2 className="h-4 w-4 text-destructive" />
             </button>
           </div>
         </div>
 
         {/* Progress Section */}
         <div className="space-y-2 mb-4">
           <div className="flex justify-between text-sm">
             <span className="text-muted-foreground">
               {purchasedItems.length} of {items.length} items purchased
             </span>
             <span className="font-medium">
               {formatCurrency(purchasedCost)} / {formatCurrency(totalCost)}
             </span>
           </div>
           <Progress value={progressPercent} className="h-2.5" />
         </div>
 
         {/* Items Toggle */}
         <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
           <div className="flex items-center justify-between">
             <CollapsibleTrigger asChild>
               <Button variant="ghost" size="sm" className="gap-1 px-2">
                 {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                 {isExpanded ? 'Hide items' : 'Show items'}
               </Button>
             </CollapsibleTrigger>
             <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
               <DialogTrigger asChild>
                 <Button size="sm" variant="outline" className="gap-1">
                   <Plus className="h-4 w-4" />
                   Add Item
                 </Button>
               </DialogTrigger>
               <DialogContent className="glass max-w-md">
                 <DialogHeader>
                   <DialogTitle>Add Item to "{goal.name}"</DialogTitle>
                 </DialogHeader>
                 <form onSubmit={handleAddItem} className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="itemName">Item Name</Label>
                     <Input
                       id="itemName"
                       value={itemFormData.name}
                       onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                       placeholder="e.g., Mechanical Keyboard"
                       required
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="estimatedCost">Estimated Cost (₪)</Label>
                       <Input
                         id="estimatedCost"
                         type="number"
                         value={itemFormData.estimatedCost}
                         onChange={(e) => setItemFormData({ ...itemFormData, estimatedCost: e.target.value })}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="plannedMonth">Planned Month</Label>
                        <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !itemFormData.plannedMonth && "text-muted-foreground"
                              )}
                            >
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {itemFormData.plannedMonth 
                                ? new Date(itemFormData.plannedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                : 'Select month'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-0" align="start">
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                              {generateMonthOptions().map((month) => (
                                <button
                                  key={month.value}
                                  type="button"
                                  className={cn(
                                    "w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors",
                                    itemFormData.plannedMonth === month.value && "bg-primary/20 text-primary font-medium"
                                  )}
                                  onClick={() => {
                                    setItemFormData({ ...itemFormData, plannedMonth: month.value });
                                    setMonthPickerOpen(false);
                                  }}
                                >
                                  {month.label}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>Payment Method</Label>
                       <Select
                         value={itemFormData.paymentMethod}
                         onValueChange={(value) => setItemFormData({ ...itemFormData, paymentMethod: value })}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="credit_card">Credit Card</SelectItem>
                           <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     {itemFormData.paymentMethod === 'credit_card' && (
                       <div className="space-y-2">
                         <Label>Card</Label>
                         <Select
                           value={itemFormData.cardId}
                           onValueChange={(value) => setItemFormData({ ...itemFormData, cardId: value })}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Select card" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="fly-card">Fly Card</SelectItem>
                             <SelectItem value="hever">Hever</SelectItem>
                             <SelectItem value="visa">Visa</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     )}
                   </div>
                   <Button type="submit" className="w-full">Add Item</Button>
                 </form>
               </DialogContent>
             </Dialog>
           </div>
 
           <CollapsibleContent className="pt-3">
             <div className="space-y-2">
               {items.length === 0 ? (
                 <p className="text-sm text-muted-foreground text-center py-4">
                   No items yet. Add items to track your purchases.
                 </p>
               ) : (
                 <>
                   {/* Pending Items */}
                   {pendingItems.map((item) => (
                     <div
                       key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 group hover:bg-secondary/50 transition-all"
                     >
                       <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-warning/20 text-warning group-hover:scale-110 transition-transform">
                           <ShoppingCart className="h-4 w-4" />
                         </div>
                         <div>
                           <p className="font-medium text-sm">{item.name}</p>
                           <p className="text-xs text-muted-foreground">
                             {formatMonth(item.planned_month)} • {item.card_id || 'Bank Transfer'}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="font-semibold text-sm">{formatCurrency(Number(item.estimated_cost))}</span>
                         <Button
                           size="sm"
                           variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-success/20 hover:text-success"
                           onClick={() => onPurchaseItem(item)}
                           title="Mark as purchased"
                         >
                           <Check className="h-4 w-4 text-success" />
                         </Button>
                         <button
                           onClick={() => onDeleteItem(item.id)}
                           className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                         >
                           <Trash2 className="h-3 w-3 text-destructive" />
                         </button>
                       </div>
                     </div>
                   ))}
                   
                   {/* Purchased Items */}
                   {purchasedItems.length > 0 && (
                     <div className="pt-2 border-t border-border/50">
                       <p className="text-xs text-muted-foreground mb-2">Purchased</p>
                       {purchasedItems.map((item) => (
                         <div
                           key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-success/10 group hover:bg-success/15 transition-all"
                         >
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-success/20 text-success group-hover:scale-110 transition-transform">
                               <Check className="h-4 w-4" />
                             </div>
                             <div>
                               <p className="font-medium text-sm line-through opacity-70">{item.name}</p>
                               <p className="text-xs text-muted-foreground">
                                 Purchased {item.purchased_at ? new Date(item.purchased_at).toLocaleDateString() : ''}
                               </p>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             <span className="font-semibold text-sm text-success">{formatCurrency(Number(item.estimated_cost))}</span>
                             <Button
                               size="sm"
                               variant="ghost"
                               className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                               onClick={() => onUnpurchaseItem(item.id)}
                               title="Undo purchase"
                             >
                               <X className="h-4 w-4 text-muted-foreground" />
                             </Button>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </>
               )}
             </div>
           </CollapsibleContent>
         </Collapsible>
       </div>
     </div>
   );
 };
 
 export default GoalCard;