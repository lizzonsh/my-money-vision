import { useState } from 'react';
import { useUserIssues, UserIssue } from '@/hooks/useUserIssues';
import { useIssueComments, useIssueCommentCounts } from '@/hooks/useIssueComments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Bug, Trash2, Edit, CheckCircle, Clock, AlertCircle, Filter, MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const IssuesPage = () => {
  const { issues, isLoading, addIssue, updateIssue, deleteIssue } = useUserIssues();
  const { toast } = useToast();

  const issueIds = issues.map(i => i.id);
  const { data: commentCounts = {} } = useIssueCommentCounts(issueIds);

  const [resolveDialogIssue, setResolveDialogIssue] = useState<UserIssue | null>(null);
  const [resolveComment, setResolveComment] = useState('');
  const [commentsPanelIssue, setCommentsPanelIssue] = useState<UserIssue | null>(null);

  const handleStatusChange = (id: string, value: string, field: 'status' | 'priority') => {
    if (field === 'status' && value === 'resolved') {
      const issue = issues.find(i => i.id === id);
      if (issue) {
        setResolveDialogIssue(issue);
        setResolveComment('');
        return;
      }
    }
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
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredIssues = priorityFilter === 'all' 
    ? issues 
    : issues.filter(i => i.priority === priorityFilter);

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortByPriority = (a: UserIssue, b: UserIssue) => 
    (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2);

  const openIssues = filteredIssues.filter(i => i.status === 'open').sort(sortByPriority);
  const inProgressIssues = filteredIssues.filter(i => i.status === 'in_progress').sort(sortByPriority);
  const resolvedIssues = filteredIssues.filter(i => i.status === 'resolved').sort(sortByPriority);

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as string;
    const issue = issues.find(i => i.id === draggableId);
    if (!issue || issue.status === newStatus) return;

    // If dropping into resolved, require comment via dialog
    if (newStatus === 'resolved') {
      setResolveDialogIssue(issue);
      setResolveComment('');
      return;
    }

    updateIssue({ id: draggableId, status: newStatus });
  };

  const columns = [
    { id: 'open', label: 'Open', icon: <AlertCircle className="h-5 w-5 text-yellow-400" />, items: openIssues },
    { id: 'in_progress', label: 'In Progress', icon: <Clock className="h-5 w-5 text-blue-400" />, items: inProgressIssues },
    { id: 'resolved', label: 'Resolved', icon: <CheckCircle className="h-5 w-5 text-green-400" />, items: resolvedIssues },
  ];

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
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid gap-6 md:grid-cols-3">
            {columns.map((col) => (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 min-h-[200px] rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-accent/30' : ''
                    }`}
                  >
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      {col.icon}
                      {col.label} ({col.items.length})
                    </h2>
                    {col.items.map((issue, index) => (
                      <Draggable key={issue.id} draggableId={issue.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'opacity-90' : ''}
                          >
                            <IssueCard
                              issue={issue}
                              commentCount={commentCounts[issue.id] || 0}
                              onEdit={handleEdit}
                              onDelete={deleteIssue}
                              onStatusChange={handleStatusChange}
                              onOpenComments={setCommentsPanelIssue}
                              getStatusColor={getStatusColor}
                              getPriorityColor={getPriorityColor}
                              getStatusIcon={getStatusIcon}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {col.items.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No {col.label.toLowerCase()} issues</p>
                    )}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Resolve Dialog - requires comment */}
      <Dialog open={!!resolveDialogIssue} onOpenChange={(open) => { if (!open) setResolveDialogIssue(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Please leave a comment explaining the resolution before marking this issue as resolved.
          </p>
          <div className="space-y-2">
            <Label htmlFor="resolve-comment">Resolution Comment</Label>
            <Textarea
              id="resolve-comment"
              placeholder="Describe how this issue was resolved..."
              value={resolveComment}
              onChange={(e) => setResolveComment(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResolveDialogIssue(null)}>Cancel</Button>
            <ResolveButton
              issueId={resolveDialogIssue?.id || ''}
              comment={resolveComment}
              onDone={() => {
                updateIssue({ id: resolveDialogIssue!.id, status: 'resolved' });
                setResolveDialogIssue(null);
                setResolveComment('');
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Panel Dialog */}
      <Dialog open={!!commentsPanelIssue} onOpenChange={(open) => { if (!open) setCommentsPanelIssue(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments: {commentsPanelIssue?.title}
            </DialogTitle>
          </DialogHeader>
          {commentsPanelIssue && <CommentsSection issueId={commentsPanelIssue.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Resolve button that adds comment then resolves
const ResolveButton = ({ issueId, comment, onDone }: { issueId: string; comment: string; onDone: () => void }) => {
  const { addComment } = useIssueComments(issueId);

  const handleResolve = () => {
    if (!comment.trim()) return;
    addComment({ issueId, content: comment }, { onSuccess: () => onDone() });
  };

  return (
    <Button onClick={handleResolve} disabled={!comment.trim()}>
      <CheckCircle className="h-4 w-4 mr-2" />
      Resolve
    </Button>
  );
};

// Comments section for the dialog
const CommentsSection = ({ issueId }: { issueId: string }) => {
  const { comments, isLoading, addComment, deleteComment } = useIssueComments(issueId);
  const [newComment, setNewComment] = useState('');

  const handleAdd = () => {
    if (!newComment.trim()) return;
    addComment({ issueId, content: newComment }, {
      onSuccess: () => setNewComment(''),
    });
  };

  return (
    <div className="space-y-4">
      <div className="max-h-64 overflow-y-auto space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 rounded-lg p-3 group">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm">{comment.content}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => deleteComment(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
        />
        <Button size="icon" onClick={handleAdd} disabled={!newComment.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

interface IssueCardProps {
  issue: UserIssue;
  commentCount: number;
  onEdit: (issue: UserIssue) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, value: string, field: 'status' | 'priority') => void;
  onOpenComments: (issue: UserIssue) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

const IssueCard = ({ issue, commentCount, onEdit, onDelete, onStatusChange, onOpenComments, getStatusColor, getPriorityColor, getStatusIcon }: IssueCardProps) => {
  return (
    <Card className="group cursor-grab active:cursor-grabbing">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{issue.title}</CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenComments(issue)}>
              <MessageSquare className="h-4 w-4" />
            </Button>
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
          {commentCount > 0 && (
            <button
              onClick={() => onOpenComments(issue)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IssuesPage;
