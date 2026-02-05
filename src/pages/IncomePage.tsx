import { useState, useMemo } from 'react';
import IncomesList from '@/components/income/IncomesList';
import RecurringIncomesPanel from '@/components/income/RecurringIncomesPanel';
import NetWorthProjection from '@/components/predictions/NetWorthProjection';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PanelConfig {
  id: string;
  title: string;
  component: React.ReactNode;
}

const IncomeTrendChart = () => {
  const { incomes, currentMonth } = useFinance();
  
  const incomeTrendData = useMemo(() => {
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
    const months: { month: string; monthKey: string; income: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonthNum - 1 - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthIncome = incomes
        .filter((inc) => inc.month === monthKey)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
      
      months.push({ month: monthLabel, monthKey, income: monthIncome });
    }
    
    return months;
  }, [incomes, currentMonth]);

  return (
    <div className="glass rounded-xl p-5 shadow-card animate-slide-up">
      <h3 className="font-semibold mb-4">Income Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={incomeTrendData}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Income']}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fill="url(#incomeGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const IncomePage = () => {
  const [panelOrder, setPanelOrder] = useState<string[]>(['incomes', 'chart']);

  const panels: Record<string, PanelConfig> = {
    incomes: { id: 'incomes', title: 'Incomes', component: <IncomesList /> },
    chart: { id: 'chart', title: 'Income Trend', component: <IncomeTrendChart /> },
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
          <h1 className="text-3xl font-bold">Income</h1>
          <p className="text-muted-foreground">Track your earnings and revenue</p>
        </div>
        <MonthNavigation />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="defaults">Default Incomes</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg">
            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="h-full p-1">
                <IncomesList />
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
                        {panelOrder.filter(id => id !== 'incomes').map((panelId, index) => {
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

        <TabsContent value="defaults">
          <RecurringIncomesPanel />
        </TabsContent>

        <TabsContent value="projections">
          <NetWorthProjection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncomePage;
