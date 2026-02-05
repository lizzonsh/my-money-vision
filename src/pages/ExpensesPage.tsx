 import { useState } from 'react';
 import ExpensesList from '@/components/expenses/ExpensesList';
 import RecurringPaymentsPanel from '@/components/expenses/RecurringPaymentsPanel';
 import BudgetProgress from '@/components/dashboard/BudgetProgress';
 import MonthNavigation from '@/components/navigation/MonthNavigation';
 import PlannedGoalsPanel from '@/components/expenses/PlannedGoalsPanel';
 import { SpendingByCategoryChart } from '@/components/charts/FinanceCharts';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import {
   ResizablePanelGroup,
   ResizablePanel,
   ResizableHandle,
 } from '@/components/ui/resizable';
 import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
 import { GripVertical } from 'lucide-react';
 
 interface PanelConfig {
   id: string;
   title: string;
   component: React.ReactNode;
 }

const ExpensesPage = () => {
  const [panelOrder, setPanelOrder] = useState<string[]>(['expenses', 'budget', 'goals', 'chart']);

  const panels: Record<string, PanelConfig> = {
    expenses: { id: 'expenses', title: 'Expenses', component: <ExpensesList /> },
    budget: { id: 'budget', title: 'Budget', component: <BudgetProgress /> },
    goals: { id: 'goals', title: 'Goals', component: <PlannedGoalsPanel /> },
    chart: { id: 'chart', title: 'Spending Chart', component: <SpendingByCategoryChart /> },
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(panelOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setPanelOrder(items);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your spending</p>
        </div>
        <MonthNavigation />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg">
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="h-full p-1">
                <ExpensesList />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={25}>
              <div className="h-full p-1">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="side-panels">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {panelOrder.filter(id => id !== 'expenses').map((panelId, index) => {
                          const panel = panels[panelId];
                          if (!panel) return null;
                          return (
                            <Draggable key={panel.id} draggableId={panel.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative ${snapshot.isDragging ? 'z-50 opacity-90' : ''}`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute -left-1 top-4 p-1 cursor-grab active:cursor-grabbing hover:bg-secondary/50 rounded transition-colors z-10"
                                    title="Drag to reorder"
                                  >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  {panel.component}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringPaymentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpensesPage;