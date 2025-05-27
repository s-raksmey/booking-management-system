'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { User, UserRole } from '@/types/user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'STAFF' as UserRole,
    password: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (response.ok) {
          setUsers(data);
        } else {
          throw new Error(data.error || 'Failed to fetch users');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch users');
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSuspended: suspend }),
      });

      if (response.ok) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, isSuspended: suspend } : user
        ));
        toast.success(`User ${suspend ? 'suspended' : 'activated'}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };


  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ));
        setIsEditDialogOpen(false);
        toast.success('User updated successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers([...users, createdUser]);
        setIsDialogOpen(false);
        setNewUser({
          name: '',
          email: '',
          role: 'STAFF',
          password: '',
        });
        toast.success('User created successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105">
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-indigo-800">
                Create New User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-indigo-700 font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="border-indigo-300 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-indigo-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="border-indigo-300 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-indigo-700 font-medium">
                  Role
                </Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, role: value as UserRole })
                  }
                >
                  <SelectTrigger className="border-indigo-300 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-sm">
                    <SelectItem value="SUPER_ADMIN" className="text-indigo-700 hover:bg-indigo-100">
                      Super Admin
                    </SelectItem>
                    <SelectItem value="ADMIN" className="text-indigo-700 hover:bg-indigo-100">
                      Admin
                    </SelectItem>
                    <SelectItem value="STAFF" className="text-indigo-700 hover:bg-indigo-100">
                      Staff
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-indigo-700 font-medium">
                  Password (optional)
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="border-indigo-300 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm"
                  placeholder="Leave empty for default password"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105"
              >
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                  user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                  user.role === 'STAFF' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.role}
                </span>
              </TableCell>
              <TableCell>
                {user.isSuspended ? (
                  <span className="text-red-600">Suspended</span>
                ) : (
                  <span className="text-green-600">Active</span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingUser(user);
                      setIsEditDialogOpen(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {user.isSuspended ? (
                      <DropdownMenuItem onClick={() => handleSuspendUser(user.id, false)}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleSuspendUser(user.id, true)}>
                        <UserX className="mr-2 h-4 w-4" />
                        Suspend
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-indigo-800">
              Edit User
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-indigo-700 font-medium">
                  Full Name
                </Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  className="border-indigo-300 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-indigo-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  className="border-indigo-300 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-indigo-700 font-medium">
                  Role
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value as UserRole })
                  }
                >
                  <SelectTrigger className="border-indigo-300 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-sm">
                    <SelectItem value="SUPER_ADMIN" className="text-indigo-700 hover:bg-indigo-100">
                      Super Admin
                    </SelectItem>
                    <SelectItem value="ADMIN" className="text-indigo-700 hover:bg-indigo-100">
                      Admin
                    </SelectItem>
                    <SelectItem value="STAFF" className="text-indigo-700 hover:bg-indigo-100">
                      Staff
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}