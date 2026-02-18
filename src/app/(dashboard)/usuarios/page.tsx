'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi } from '@/lib/api/users';
import { UserDto } from '@/types/api';
import { UserFormDialog, DeleteUserDialog } from '@/components/users';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserCog,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current user from localStorage to prevent self-deletion
  const currentUsername = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  // Query to fetch users
  const {
    data: users = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Mutation to delete user
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado exitosamente');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar usuario');
    },
  });

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleEdit = (user: UserDto) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(undefined);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (user: UserDto) => {
    // Prevent user from deleting themselves
    if (user.username === currentUsername) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }

    // Check if trying to delete the last admin
    const adminUsers = users.filter((u) => u.role === 'Admin');
    if (user.role === 'Admin' && adminUsers.length === 1) {
      toast.error('No se puede eliminar el último administrador del sistema');
      return;
    }

    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      Admin: 'bg-red-100 text-red-700 border-red-300',
      Operator: 'bg-blue-100 text-blue-700 border-blue-300',
      ReadOnly: 'bg-gray-100 text-gray-700 border-gray-300',
    };

    const icons = {
      Admin: ShieldCheck,
      Operator: UserCog,
      ReadOnly: Eye,
    };

    const Icon = icons[role as keyof typeof icons] || UserCog;
    const variant = variants[role as keyof typeof variants] || variants.ReadOnly;

    return (
      <Badge className={`${variant} border gap-1.5`} variant="outline">
        <Icon className="h-3 w-3" />
        {role === 'Admin' ? 'Administrador' : role === 'Operator' ? 'Operador' : 'Solo Lectura'}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300 border gap-1.5" variant="outline">
          <CheckCircle2 className="h-3 w-3" />
          Activo
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-500 border-gray-300 border gap-1.5" variant="outline">
        <XCircle className="h-3 w-3" />
        Inactivo
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <UserCog className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Usuarios del Sistema
              </h1>
              <p className="text-gray-600 mt-1">Gestión de usuarios y permisos de acceso</p>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="border-2 border-indigo-100 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-indigo-600">{users.length}</p>
                </div>
                <UserCog className="h-8 w-8 text-indigo-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-100 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold text-red-600">
                    {users.filter((u) => u.role === 'Admin').length}
                  </p>
                </div>
                <ShieldCheck className="h-8 w-8 text-red-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-100 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Operadores</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter((u) => u.role === 'Operator').length}
                  </p>
                </div>
                <UserCog className="h-8 w-8 text-blue-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-100 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter((u) => u.isActive).length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6 border-2 border-indigo-100 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre de usuario, email o nombre completo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="gap-2 whitespace-nowrap"
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''} encontrado
          {filteredUsers.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Table */}
      <Card className="border-2 border-indigo-100 bg-white/90 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <TableHead className="font-bold">Usuario</TableHead>
                <TableHead className="font-bold">Nombre Completo</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Rol</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="font-bold">Último Acceso</TableHead>
                <TableHead className="font-bold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <UserCog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      {searchQuery ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={handleCreate}
                        className="mt-2 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
                      >
                        <UserPlus className="h-4 w-4" />
                        Crear primer usuario
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-indigo-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold shadow-md">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.username}</div>
                          {user.username === currentUsername && (
                            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300">
                              Tú
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">{user.fullName}</TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(user.lastLogin)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialogs */}
      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
        onSuccess={() => {
          refetch();
        }}
      />

      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={userToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
