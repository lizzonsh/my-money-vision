import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building2, Info, Server } from 'lucide-react';
import BankConnectionCard from './BankConnectionCard';
import AddBankConnectionDialog from './AddBankConnectionDialog';
import { BankConnectionDisplay, BANK_COMPANIES } from '@/types/bankConnections';
import { toast } from 'sonner';

// Mock data for demonstration
const mockConnections: BankConnectionDisplay[] = [
  {
    _id: '1',
    companyId: 'hapoalim',
    companyName: 'Bank Hapoalim',
    companyNameHe: 'בנק הפועלים',
    isActive: true,
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastSyncStatus: 'success',
  },
  {
    _id: '2',
    companyId: 'visaCal',
    companyName: 'Visa Cal',
    companyNameHe: 'ויזה כאל',
    isActive: true,
    lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastSyncStatus: 'error',
    errorMessage: 'Invalid credentials. Please update your password.',
  },
  {
    _id: '3',
    companyId: 'max',
    companyName: 'Max (Leumi Card)',
    companyNameHe: 'מקס (לאומי קארד)',
    isActive: false,
    lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncStatus: 'success',
  },
];

const BankConnectionsPanel = () => {
  const [connections, setConnections] = useState<BankConnectionDisplay[]>(mockConnections);

  const handleAdd = (companyId: string, credentials: Record<string, string>) => {
    const company = BANK_COMPANIES.find(c => c.id === companyId);
    if (!company) return;

    const newConnection: BankConnectionDisplay = {
      _id: Math.random().toString(36).substr(2, 9),
      companyId: company.id,
      companyName: company.name,
      companyNameHe: company.nameHe,
      isActive: true,
      lastSyncStatus: 'pending',
    };

    setConnections(prev => [...prev, newConnection]);
    toast.success(`Connected to ${company.name}`);
    
    // In a real implementation, this would call your backend API
    console.log('Would send credentials to backend:', { companyId, credentials: '***' });
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    setConnections(prev => 
      prev.map(c => c._id === id ? { ...c, isActive } : c)
    );
    toast.success(isActive ? 'Connection enabled' : 'Connection disabled');
  };

  const handleSync = async (id: string) => {
    // In a real implementation, this would trigger the backend scraper
    toast.info('Sync triggered - waiting for backend...');
    
    // Simulate sync result
    setTimeout(() => {
      setConnections(prev => 
        prev.map(c => c._id === id ? { 
          ...c, 
          lastSync: new Date().toISOString(),
          lastSyncStatus: Math.random() > 0.3 ? 'success' : 'error',
          errorMessage: Math.random() > 0.3 ? undefined : 'Connection timeout',
        } : c)
      );
    }, 2000);
  };

  const handleEdit = (id: string) => {
    // Would open edit dialog with current credentials
    toast.info('Edit functionality - would open credentials dialog');
  };

  const handleDelete = (id: string) => {
    setConnections(prev => prev.filter(c => c._id !== id));
    toast.success('Connection deleted');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Bank Connections</CardTitle>
                <CardDescription>
                  Connect your Israeli banks and credit cards for automatic data sync
                </CardDescription>
              </div>
            </div>
            <AddBankConnectionDialog onAdd={handleAdd} />
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Server className="h-4 w-4" />
            <AlertTitle>Backend Required</AlertTitle>
            <AlertDescription>
              Bank scraping requires a Node.js backend with Puppeteer. This UI is ready to connect - 
              you'll need to implement the scraping service using{' '}
              <a 
                href="https://github.com/eshaham/israeli-bank-scrapers" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                israeli-bank-scrapers
              </a>
              {' '}on your own infrastructure.
            </AlertDescription>
          </Alert>

          {connections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bank connections yet</p>
              <p className="text-sm">Add your first bank or credit card connection above</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map(connection => (
                <BankConnectionCard
                  key={connection._id}
                  connection={connection}
                  onToggleActive={handleToggleActive}
                  onSync={handleSync}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert variant="default" className="border-blue-500/50 bg-blue-500/10">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700 dark:text-blue-300">Supported Banks & Credit Cards</AlertTitle>
        <AlertDescription className="text-blue-600 dark:text-blue-400">
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <strong>Banks:</strong>
              <ul className="mt-1 space-y-0.5">
                <li>• Bank Hapoalim</li>
                <li>• Bank Leumi</li>
                <li>• Discount Bank</li>
                <li>• Mizrahi Tefahot</li>
                <li>• Otsar Hahayal</li>
              </ul>
            </div>
            <div>
              <strong>&nbsp;</strong>
              <ul className="mt-1 space-y-0.5">
                <li>• Mercantile</li>
                <li>• Union Bank</li>
                <li>• First International</li>
                <li>• Bank Massad</li>
                <li>• Bank Yahav</li>
              </ul>
            </div>
            <div>
              <strong>Credit Cards:</strong>
              <ul className="mt-1 space-y-0.5">
                <li>• Visa Cal</li>
                <li>• Max (Leumi Card)</li>
                <li>• Isracard</li>
                <li>• American Express</li>
              </ul>
            </div>
            <div>
              <strong>&nbsp;</strong>
              <ul className="mt-1 space-y-0.5">
                <li>• Beyhad Bishvilha</li>
                <li>• Behatsdaa</li>
                <li>• One Zero (2FA)</li>
              </ul>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BankConnectionsPanel;
