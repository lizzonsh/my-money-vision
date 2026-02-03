import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, 
  CreditCard, 
  RefreshCw, 
  Settings, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { BankConnectionDisplay, BANK_COMPANIES } from '@/types/bankConnections';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BankConnectionCardProps {
  connection: BankConnectionDisplay;
  onToggleActive: (id: string, isActive: boolean) => void;
  onSync: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BankConnectionCard = ({ 
  connection, 
  onToggleActive, 
  onSync, 
  onEdit, 
  onDelete 
}: BankConnectionCardProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const company = BANK_COMPANIES.find(c => c.id === connection.companyId);
  const isBank = company?.type === 'bank';

  const handleSync = async () => {
    setIsSyncing(true);
    await onSync(connection._id);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const getStatusIcon = () => {
    switch (connection.lastSyncStatus) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (connection.lastSyncStatus) {
      case 'success':
        return <Badge variant="outline" className="border-green-500 text-green-500">Synced</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="secondary">Never synced</Badge>;
    }
  };

  return (
    <Card className={`transition-all ${!connection.isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isBank ? 'bg-primary/10' : 'bg-secondary'}`}>
              {isBank ? (
                <Building2 className="h-5 w-5 text-primary" />
              ) : (
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{connection.companyName}</CardTitle>
              <p className="text-sm text-muted-foreground">{connection.companyNameHe}</p>
            </div>
          </div>
          <Switch 
            checked={connection.isActive}
            onCheckedChange={(checked) => onToggleActive(connection._id, checked)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
          {connection.lastSync && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(connection.lastSync), { addSuffix: true })}
            </span>
          )}
        </div>

        {connection.lastSyncStatus === 'error' && connection.errorMessage && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <p className="text-xs text-destructive">{connection.errorMessage}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleSync}
            disabled={!connection.isActive || isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(connection._id)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the connection to {connection.companyName}? 
                  This will remove all stored credentials and sync history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(connection._id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankConnectionCard;
