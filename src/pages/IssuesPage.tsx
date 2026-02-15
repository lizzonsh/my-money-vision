import { useState } from 'react';
import { useUserIssues, UserIssue } from '@/hooks/useUserIssues';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Bug, Trash2, Edit, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';

const IssuesPage = () => {
  const { issues, isLoading, addIssue, updateIssue, deleteIssue } = useUserIssues();

  const handleStatusChange = (id: string, value: string, field: 'status' | 'priority') => {
    updateIssue({ id, [field]: value });
  };
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<UserIssue | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('open');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('open');
    setEditingIssue(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingIssue) {
      updateIssue({ id: editingIssue.id, title, description, priority, status });
    } else {
      addIssue({ title, description, priority, status });
    }
    
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (issue: UserIssue) => {
    setEditingIssue(issue);
    setTitle(issue.title);
    setDescription(issue.description || '');
    setPriority(issue.priority);
    setStatus(issue.status);
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) resetForm();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'low':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Apply priority filter
  const filteredIssues = priorityFilter === 'all' 
    ? issues 
    : issues.filter(i => i.priority === priorityFilter);

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortByPriority = (a: UserIssue, b: UserIssue) => 
    (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2);

  const openIssues = filteredIssues.filter(i => i.status === 'open').sort(sortByPriority);
  const inProgressIssues = filteredIssues.filter(i => i.status === 'in_progress').sort(sortByPriority);
  const resolvedIssues = filteredIssues.filter(i => i.status === 'resolved').sort(sortByPriority);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="h-8 w-8" />
            Issues & Bugs
          </h1>
          <p className="text-muted-foreground">Track bugs and issues you encounter while using the app</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIssue ? 'Edit Issue' : 'Report New Issue'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description, steps to reproduce, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {editingIssue && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingIssue ? 'Save Changes' : 'Report Issue'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Priority:</span>
        {['all', 'high', 'medium', 'low'].map((p) => (
          <Button
            key={p}
            variant={priorityFilter === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPriorityFilter(p)}
            className="capitalize"
          >
            {p === 'all' ? 'All' : p}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading issues...</div>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No issues reported yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Report Issue" to track any bugs or problems you encounter
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Open Issues */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              Open ({openIssues.length})
            </h2>
            {openIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onEdit={handleEdit}
                onDelete={deleteIssue}
                onStatusChange={handleStatusChange}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
            {openIssues.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No open issues</p>
            )}
          </div>

          {/* In Progress */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              In Progress ({inProgressIssues.length})
            </h2>
            {inProgressIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onEdit={handleEdit}
                onDelete={deleteIssue}
                onStatusChange={handleStatusChange}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
            {inProgressIssues.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No issues in progress</p>
            )}
          </div>

          {/* Resolved */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Resolved ({resolvedIssues.length})
            </h2>
            {resolvedIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onEdit={handleEdit}
                onDelete={deleteIssue}
                onStatusChange={handleStatusChange}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
            {resolvedIssues.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No resolved issues</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface IssueCardProps {
  issue: UserIssue;
  onEdit: (issue: UserIssue) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, value: string, field: 'status' | 'priority') => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

const IssueCard = ({ issue, onEdit, onDelete, onStatusChange, getStatusColor, getPriorityColor, getStatusIcon }: IssueCardProps) => {
  return (
    <Card className="group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{issue.title}</CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(issue)}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Issue</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this issue? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(issue.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <CardDescription className="text-xs">
          {format(new Date(issue.created_at), 'MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {issue.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{issue.description}</p>
        )}
        <div className="flex items-center gap-2">
          <Select value={issue.priority} onValueChange={(value) => onStatusChange(issue.id, value, 'priority')}>
            <SelectTrigger className="h-6 w-auto gap-1 border-0 px-2 py-0 text-xs font-medium [&>svg]:h-3 [&>svg]:w-3">
              <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${getPriorityColor(issue.priority)}`}>
                <span>{issue.priority}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={issue.status} onValueChange={(value) => onStatusChange(issue.id, value, 'status')}>
            <SelectTrigger className="h-6 w-auto gap-1 border-0 px-2 py-0 text-xs font-medium [&>svg]:h-3 [&>svg]:w-3">
              <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${getStatusColor(issue.status)}`}>
                {getStatusIcon(issue.status)}
                <span>{issue.status.replace('_', ' ')}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">
                <span className="flex items-center gap-1.5"><AlertCircle className="h-3 w-3 text-yellow-400" /> Open</span>
              </SelectItem>
              <SelectItem value="in_progress">
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-blue-400" /> In Progress</span>
              </SelectItem>
              <SelectItem value="resolved">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-400" /> Resolved</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default IssuesPage;
