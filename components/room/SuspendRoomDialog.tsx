import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface SuspendRoomDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  suspendDays: string;
  setSuspendDays: (days: string) => void;
  onSuspend: () => void;
}

export function SuspendRoomDialog({ isOpen, onOpenChange, suspendDays, setSuspendDays, onSuspend }: SuspendRoomDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend Room</DialogTitle>
        </DialogHeader>
        <div>
          <Label htmlFor="suspendDays">Suspend for (days)</Label>
          <Input
            id="suspendDays"
            type="number"
            value={suspendDays}
            onChange={e => setSuspendDays(e.target.value)}
            placeholder="Enter number of days"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSuspend}>Suspend</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}