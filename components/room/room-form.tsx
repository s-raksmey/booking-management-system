import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RoomFormProps {
  formData: {
    name: string;
    capacity: string;
    location: string;
    features: string;
    autoApprove: string;
  };
  setFormData: (data: RoomFormProps['formData']) => void;
}

export function RoomForm({ formData, setFormData }: RoomFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          value={formData.capacity}
          onChange={e => setFormData({ ...formData, capacity: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={e => setFormData({ ...formData, location: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="features">Features (comma-separated)</Label>
        <Input
          id="features"
          value={formData.features}
          onChange={e => setFormData({ ...formData, features: e.target.value })}
          placeholder="e.g., projector, whiteboard"
        />
      </div>
      <div>
        <Label htmlFor="autoApprove">Approval Rule</Label>
        <Select
          value={formData.autoApprove}
          onValueChange={value => setFormData({ ...formData, autoApprove: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select approval rule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Auto Approve</SelectItem>
            <SelectItem value="false">Manual Approval</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}