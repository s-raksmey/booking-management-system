// components/system-config-form.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { SystemConfig } from '@/types/system';

export function SystemConfigForm() {
  const [config, setConfig] = useState<SystemConfig>({
    maxBookingLengthHours: 2,
    maxAdvanceBookingDays: 30,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/system/config');
        const data = await response.json();
        if (response.ok) {
          setConfig(data);
        } else {
          throw new Error(data.error || 'Failed to fetch system config');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch system config');
      }
    };

    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/system/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('System configuration updated successfully');
      } else {
        throw new Error('Failed to update system config');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update system config');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="maxBookingLengthHours">Maximum Booking Length (hours)</Label>
        <Input
          id="maxBookingLengthHours"
          type="number"
          min="1"
          max="24"
          value={config.maxBookingLengthHours}
          onChange={(e) => setConfig({...config, maxBookingLengthHours: parseInt(e.target.value) || 1})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxAdvanceBookingDays">Maximum Advance Booking (days)</Label>
        <Input
          id="maxAdvanceBookingDays"
          type="number"
          min="1"
          max="365"
          value={config.maxAdvanceBookingDays}
          onChange={(e) => setConfig({...config, maxAdvanceBookingDays: parseInt(e.target.value) || 1})}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enableEmailNotifications"
          checked={config.enableEmailNotifications}
          onCheckedChange={(checked: any) => setConfig({...config, enableEmailNotifications: checked})}
        />
        <Label htmlFor="enableEmailNotifications">Enable Email Notifications</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enableSMSNotifications"
          checked={config.enableSMSNotifications}
          onCheckedChange={(checked: any) => setConfig({...config, enableSMSNotifications: checked})}
        />
        <Label htmlFor="enableSMSNotifications">Enable SMS Notifications</Label>
      </div>

      <Button type="submit">Save Changes</Button>
    </form>
  );
}