import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, CreditCard, Lock, AlertTriangle } from 'lucide-react';
import { 
  BANK_COMPANIES, 
  BankCompanyInfo, 
  BankLoginField,
  LOGIN_FIELD_CONFIGS 
} from '@/types/bankConnections';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddBankConnectionDialogProps {
  onAdd: (companyId: string, credentials: Record<string, string>) => void;
}

const AddBankConnectionDialog = ({ onAdd }: AddBankConnectionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<BankCompanyInfo | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'select' | 'credentials'>('select');

  const banks = BANK_COMPANIES.filter(c => c.type === 'bank');
  const creditCards = BANK_COMPANIES.filter(c => c.type === 'creditCard');

  const handleSelectCompany = (company: BankCompanyInfo) => {
    setSelectedCompany(company);
    setCredentials({});
    setStep('credentials');
  };

  const handleCredentialChange = (field: BankLoginField, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!selectedCompany) return;
    
    // Validate all required fields are filled
    const allFieldsFilled = selectedCompany.loginFields.every(
      field => credentials[field]?.trim()
    );
    
    if (!allFieldsFilled) return;
    
    onAdd(selectedCompany.id, credentials);
    handleReset();
  };

  const handleReset = () => {
    setSelectedCompany(null);
    setCredentials({});
    setStep('select');
    setOpen(false);
  };

  const CompanyButton = ({ company }: { company: BankCompanyInfo }) => (
    <button
      onClick={() => handleSelectCompany(company)}
      className="w-full p-4 rounded-lg border border-border hover:border-primary hover:bg-secondary/50 transition-all text-left group"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${company.type === 'bank' ? 'bg-primary/10' : 'bg-secondary'} group-hover:bg-primary/20`}>
          {company.type === 'bank' ? (
            <Building2 className="h-5 w-5 text-primary" />
          ) : (
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium">{company.name}</p>
          <p className="text-sm text-muted-foreground">{company.nameHe}</p>
        </div>
        {company.supportsTwoFactor && (
          <Badge variant="outline" className="text-xs">2FA</Badge>
        )}
      </div>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Add Bank Connection' : `Connect to ${selectedCompany?.name}`}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' ? (
          <Tabs defaultValue="banks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="banks" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Banks ({banks.length})
              </TabsTrigger>
              <TabsTrigger value="creditCards" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit Cards ({creditCards.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="banks">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {banks.map(company => (
                    <CompanyButton key={company.id} company={company} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="creditCards">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {creditCards.map(company => (
                    <CompanyButton key={company.id} company={company} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Your credentials will be encrypted and stored securely. They are only used to sync your financial data.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {selectedCompany?.loginFields.map(field => {
                const config = LOGIN_FIELD_CONFIGS[field];
                return (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>
                      {config.label} / {config.labelHe}
                    </Label>
                    <Input
                      id={field}
                      type={config.type}
                      placeholder={config.placeholder}
                      value={credentials[field] || ''}
                      onChange={(e) => handleCredentialChange(field, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>

            {selectedCompany?.supportsTwoFactor && (
              <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  This bank requires two-factor authentication. You may need to enter an OTP code during sync.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!selectedCompany?.loginFields.every(field => credentials[field]?.trim())}
              >
                Connect
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddBankConnectionDialog;
