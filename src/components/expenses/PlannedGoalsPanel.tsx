 import { useFinance } from '@/contexts/FinanceContext';
 import { useGoalItems, GoalItem } from '@/hooks/useGoalItems';
 import { formatCurrency, formatMonth } from '@/lib/formatters';
 import { Target, CreditCard, Building2 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 const PlannedGoalsPanel = () => {
   const { currentMonth } = useFinance();
   const { goalItems } = useGoalItems();
 
   // Get unpurchased goal items planned for current month
   const plannedGoalItems = goalItems.filter(
     item => !item.is_purchased && item.planned_month === currentMonth
   );
 
   const totalPlannedGoals = plannedGoalItems.reduce(
     (sum, item) => sum + Number(item.estimated_cost), 0
   );
 
   const creditCardGoals = plannedGoalItems
     .filter(item => item.payment_method === 'credit_card')
     .reduce((sum, item) => sum + Number(item.estimated_cost), 0);
 
   const bankTransferGoals = plannedGoalItems
     .filter(item => item.payment_method === 'bank_transfer')
     .reduce((sum, item) => sum + Number(item.estimated_cost), 0);
 
   const formatCardName = (cardId?: string | null) => {
     if (!cardId) return '';
     const cardNames: Record<string, string> = {
       'fly-card': 'Fly Card',
       'hever': 'Hever',
       'visa': 'Visa',
     };
     return cardNames[cardId] || cardId;
   };
 
   return (
     <div className="glass rounded-xl p-5 shadow-card animate-slide-up h-full">
       <div className="flex items-center justify-between mb-4">
         <div>
           <h3 className="font-semibold flex items-center gap-2">
             <Target className="h-4 w-4 text-primary" />
             Planned Goals
           </h3>
           <p className="text-lg font-bold text-primary">{formatCurrency(totalPlannedGoals)}</p>
           <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
             {creditCardGoals > 0 && (
               <span className="text-primary">CC: {formatCurrency(creditCardGoals)}</span>
             )}
             {bankTransferGoals > 0 && (
               <span className="text-success">Bank: {formatCurrency(bankTransferGoals)}</span>
             )}
           </div>
         </div>
       </div>
 
       <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
         {plannedGoalItems.length === 0 ? (
           <p className="text-sm text-muted-foreground text-center py-4">
             No planned goals for this month
           </p>
         ) : (
           plannedGoalItems.map((item) => (
             <div
               key={item.id}
               className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 interactive-card group"
             >
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-primary/20 group-hover:scale-110 transition-transform">
                   <Target className="h-4 w-4 text-primary" />
                 </div>
                 <div>
                   <p className="text-sm font-medium">{item.name}</p>
                   <div className="flex items-center gap-2 flex-wrap">
                     <span className={cn(
                       'text-xs px-2 py-0.5 rounded-full flex items-center gap-1',
                       item.payment_method === 'credit_card' 
                         ? 'bg-primary/20 text-primary' 
                         : 'bg-success/20 text-success'
                     )}>
                       {item.payment_method === 'credit_card' ? (
                         <>
                           <CreditCard className="h-3 w-3" />
                           {item.card_id ? formatCardName(item.card_id) : 'Credit Card'}
                         </>
                       ) : (
                         <>
                           <Building2 className="h-3 w-3" />
                           Bank Transfer
                         </>
                       )}
                     </span>
                   </div>
                 </div>
               </div>
               <span className="font-semibold text-primary">{formatCurrency(Number(item.estimated_cost))}</span>
             </div>
           ))
         )}
       </div>
     </div>
   );
 };
 
 export default PlannedGoalsPanel;