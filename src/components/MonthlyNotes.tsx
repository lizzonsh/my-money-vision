import { useState, useEffect, useRef } from 'react';
import { useMonthlyNotes } from '@/hooks/useMonthlyNotes';
import { useFinance } from '@/contexts/FinanceContext';
import { StickyNote, Check, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MonthlyNotesProps {
  pageType: string;
}

const MonthlyNotes = ({ pageType }: MonthlyNotesProps) => {
  const { currentMonth } = useFinance();
  const { note, isLoading, saveNote, isSaving } = useMonthlyNotes(currentMonth, pageType);
  const [value, setValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setValue(note);
    setIsDirty(false);
  }, [note]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setIsDirty(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveNote(newValue);
      setIsDirty(false);
    }, 1000);
  };

  const handleBlur = () => {
    if (isDirty) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      saveNote(value);
      setIsDirty(false);
    }
    if (!value.trim()) setIsEditing(false);
  };

  if (isLoading) return null;

  if (!isEditing && !value.trim()) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <StickyNote className="h-3.5 w-3.5" />
        Add note
      </button>
    );
  }

  return (
    <div className="glass rounded-lg p-3 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StickyNote className="h-3.5 w-3.5" />
          <span>Monthly Note</span>
        </div>
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : isDirty ? null : value.trim() ? (
          <Check className="h-3 w-3 text-success" />
        ) : null}
      </div>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="Write a note for this month..."
        className={cn(
          "min-h-[60px] text-sm bg-transparent border-none shadow-none resize-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0",
        )}
        autoFocus={isEditing && !value.trim()}
      />
    </div>
  );
};

export default MonthlyNotes;
