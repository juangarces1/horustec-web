'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi } from '@/lib/api/users';
import { UserDto, UserRole, UserRoleToNumber } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserDto;
  onSuccess?: () => void;
}

interface FormData {
  username: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  isActive: boolean;
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!user;

  const [formData, setFormData] = useState<FormData>({
    username: user?.username || '',
    fullName: user?.fullName || '',
    password: '',
    confirmPassword: '',
    role: user?.role || 'Operator',
    isActive: user?.isActive ?? true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (open) {
      setFormData({
        username: user?.username || '',
        fullName: user?.fullName || '',
        password: '',
        confirmPassword: '',
        role: user?.role || 'Operator',
        isActive: user?.isActive ?? true,
      });
      setErrors({});
    }
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        return usersApi.update({
          id: user.id,
          fullName: data.fullName,
          role: UserRoleToNumber[data.role],
          isActive: data.isActive,
          newPassword: data.password || null,
        });
      } else {
        return usersApi.create({
          username: data.username,
          password: data.password,
          fullName: data.fullName,
          role: UserRoleToNumber[data.role],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(isEditing ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      console.error('Error creating/updating user:', error?.response?.status, data);

      let errorMessage = 'Error al guardar usuario';
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data?.detail) {
        errorMessage = data.detail;
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.title) {
        errorMessage = data.title;
      } else if (data?.errors) {
        const messages = Object.values(data.errors).flat() as string[];
        if (messages.length > 0) {
          errorMessage = messages.join('. ');
        }
      }

      if (typeof errorMessage === 'string') {
        const msg = errorMessage.toLowerCase();
        if (msg.includes('username') || msg.includes('usuario')) {
          setErrors({ username: errorMessage });
        } else if (msg.includes('password') || msg.includes('contraseña')) {
          setErrors({ password: errorMessage });
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Error al guardar usuario');
      }
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!isEditing) {
      if (!formData.username.trim()) {
        newErrors.username = 'El nombre de usuario es requerido';
      } else if (formData.username.length > 50) {
        newErrors.username = 'El nombre de usuario no puede tener más de 50 caracteres';
      } else if (formData.username.includes(' ')) {
        newErrors.username = 'El nombre de usuario no puede contener espacios';
      }
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    } else if (formData.fullName.length > 150) {
      newErrors.fullName = 'El nombre completo no puede tener más de 150 caracteres';
    }

    if (!isEditing || formData.password) {
      if (!formData.password && !isEditing) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password && formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      mutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario del Sistema'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza la información del usuario del sistema'
              : 'Complete la información para crear un nuevo usuario del sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Username (solo en creación) */}
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="username">
                  Nombre de Usuario <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="usuario123"
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Juan Pérez"
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Rol <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Administrador</SelectItem>
                  <SelectItem value="Operator">Operador</SelectItem>
                  <SelectItem value="ReadOnly">Solo Lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                {!isEditing && <span className="text-red-500"> *</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
              {!isEditing && (
                <p className="text-xs text-gray-500">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>

            {/* Confirm Password */}
            {(!isEditing || formData.password) && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Contraseña {!isEditing && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repetir contraseña"
                    className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            )}
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-base font-medium">
                Estado del Usuario
              </Label>
              <p className="text-sm text-gray-500">
                {formData.isActive
                  ? 'El usuario puede iniciar sesión en el sistema'
                  : 'El usuario no puede acceder al sistema'}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {mutation.isPending
                ? (isEditing ? 'Actualizando...' : 'Creando...')
                : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
