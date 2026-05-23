'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { subscribeToCollection, updateDocument } from '@/firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';
import { COLLECTIONS, TASK_STATUS_COLORS, PRIORITY_COLORS } from '@/lib/constants';
import type { Task } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function TasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection(COLLECTIONS.TASKS, (data) => {
      const allTasks = data as unknown as Task[];
      const myTasks = allTasks.filter(t => t.assignedTo === user.uid);
      
      // Sort: pending first, then by due date
      setTasks(myTasks.sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateA - dateB;
      }));
      setIsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleUpdateStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateDocument(COLLECTIONS.TASKS, taskId, { status: newStatus });
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update task');
    }
  };

  return (
    <div className="p-4 pb-24 space-y-4 h-full flex flex-col">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/30" />
            <p>You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const statusColor = TASK_STATUS_COLORS[task.status] || TASK_STATUS_COLORS.pending;
              const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
              const isCompleted = task.status === 'completed';
              
              return (
                <Card key={task.id} className={cn(
                  "glass-card border-none shadow-sm transition-all",
                  isCompleted && "opacity-60 grayscale-[0.5]"
                )}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={cn("font-semibold text-base pr-4", isCompleted && "line-through")}>
                        {task.title}
                      </h3>
                      <Badge variant="secondary" className={cn("text-[10px] uppercase font-bold border-none shrink-0", priorityColor.bg, priorityColor.text)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className={cn(
                        "flex items-center px-2 py-1 rounded-md",
                        statusColor.bg, statusColor.text
                      )}>
                        {task.status === 'pending' && <Clock className="w-3.5 h-3.5 mr-1.5" />}
                        {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                        {task.status === 'overdue' && <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                        {task.status.replace('-', ' ').toUpperCase()}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'N/A'}</span>
                      </div>
                    </div>

                    {!isCompleted && (
                      <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                        {task.status !== 'in-progress' && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                            onClick={() => handleUpdateStatus(task.id, 'in-progress')}
                          >
                            Start Task
                          </Button>
                        )}
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          onClick={() => handleUpdateStatus(task.id, 'completed')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
