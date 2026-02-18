'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { attendantsApi } from '@/lib/api/attendants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Edit2, Trash2, ArrowLeft, CreditCard, Mail, Phone, Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AttendantDto, CreateAttendantRequest } from '@/types/api';

const ITEMS_PER_PAGE = 9;

export default function FrentistasPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState<AttendantDto | null>(null);
  const [onlyActive, setOnlyActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Query to fetch attendants
  const { data: attendants = [], isLoading } = useQuery({
    queryKey: ['attendants', onlyActive],
    queryFn: () => attendantsApi.getAll(onlyActive),
  });

  // Mutation to delete attendant
  const deleteMutation = useMutation({
    mutationFn: (id: string) => attendantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
      toast.success('Frentista eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar frentista');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar a ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filter and search
  const filteredAttendants = useMemo(() => {
    if (!searchQuery) return attendants;

    const query = searchQuery.toLowerCase();
    return attendants.filter((att) =>
      att.fullName.toLowerCase().includes(query) ||
      att.code.toLowerCase().includes(query) ||
      att.email?.toLowerCase().includes(query) ||
      att.tagId?.toLowerCase().includes(query) ||
      att.phone?.includes(query)
    );
  }, [attendants, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAttendants.length / ITEMS_PER_PAGE);
  const paginatedAttendants = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAttendants.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAttendants, currentPage]);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-xl text-gray-600">Cargando frentistas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Frentistas
            </h1>
            <p className="text-gray-600 mt-1">Gestión de operadores y personal</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingAttendant(null);
            setShowForm(!showForm);
          }}
          className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Frentista
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, código, TAG, email o teléfono..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => setOnlyActive(true)}
            variant={onlyActive ? 'default' : 'outline'}
            className={onlyActive ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}
          >
            Solo Activos ({attendants.filter(a => a.isActive).length})
          </Button>
          <Button
            onClick={() => setOnlyActive(false)}
            variant={!onlyActive ? 'default' : 'outline'}
            className={!onlyActive ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}
          >
            Todos ({attendants.length})
          </Button>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredAttendants.length} resultado{filteredAttendants.length !== 1 ? 's' : ''} encontrado{filteredAttendants.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <AttendantForm
          attendant={editingAttendant}
          onClose={() => {
            setShowForm(false);
            setEditingAttendant(null);
          }}
        />
      )}

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedAttendants.map((attendant) => (
          <Card
            key={attendant.id}
            className="group relative overflow-hidden border-2 transition-all hover:shadow-2xl hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
          >
            {/* Status badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
              attendant.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {attendant.isActive ? '✓ Activo' : 'Inactivo'}
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                  {attendant.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{attendant.fullName}</CardTitle>
                  <CardDescription className="text-sm">
                    <span className="font-mono bg-purple-100 px-2 py-0.5 rounded text-purple-700">
                      {attendant.code}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              {attendant.tagId && (
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  <span className="font-mono text-xs">{attendant.tagId}</span>
                </div>
              )}
              {attendant.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-pink-500" />
                  <span className="truncate">{attendant.email}</span>
                </div>
              )}
              {attendant.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-orange-500" />
                  <span>{attendant.phone}</span>
                </div>
              )}
              {attendant.hireDate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>{new Date(attendant.hireDate).toLocaleDateString('es-ES')}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-2 hover:bg-purple-50"
                  onClick={() => {
                    setEditingAttendant(attendant);
                    setShowForm(true);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(attendant.id, attendant.fullName)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="gap-2"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {filteredAttendants.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchQuery ? 'No se encontraron resultados' : 'No hay frentistas registrados'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <UserPlus className="h-4 w-4" />
              Agregar el primero
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Form Component
function AttendantForm({
  attendant,
  onClose,
}: {
  attendant: AttendantDto | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateAttendantRequest>({
    code: attendant?.code || '',
    fullName: attendant?.fullName || '',
    identificationNumber: attendant?.identificationNumber || '',
    tagId: attendant?.tagId || '',
    protocolUserLevel: attendant?.protocolUserLevel || '7',
    isActive: attendant?.isActive ?? true,
    phone: attendant?.phone || '',
    email: attendant?.email || '',
    notes: attendant?.notes || '',
  });

  const mutation = useMutation({
    mutationFn: (data: CreateAttendantRequest) =>
      attendant
        ? attendantsApi.update(attendant.id, { ...data, id: attendant.id })
        : attendantsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
      toast.success(attendant ? 'Frentista actualizado exitosamente' : 'Frentista creado exitosamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al guardar frentista');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Card className="mb-6 border-2 border-purple-200 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {attendant ? 'Editar Frentista' : 'Nuevo Frentista'}
        </CardTitle>
        <CardDescription>Complete la información del operador</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ATT001"
              />
            </div>
            <div>
              <Label htmlFor="fullName">Nombre Completo *</Label>
              <Input
                id="fullName"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <Label htmlFor="identificationNumber">DNI/RUT</Label>
              <Input
                id="identificationNumber"
                value={formData.identificationNumber}
                onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                placeholder="12345678"
              />
            </div>
            <div>
              <Label htmlFor="tagId">TAG RFID</Label>
              <Input
                id="tagId"
                value={formData.tagId}
                onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                placeholder="1234567890ABCDEF"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+123456789"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ejemplo@correo.com"
              />
            </div>
            <div>
              <Label htmlFor="protocolUserLevel">Nivel de Usuario</Label>
              <select
                id="protocolUserLevel"
                value={formData.protocolUserLevel}
                onChange={(e) => setFormData({ ...formData, protocolUserLevel: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="7">Empleado Nivel 1</option>
                <option value="8">Empleado Nivel 2</option>
                <option value="9">Empleado Nivel 3</option>
                <option value="D">Gerente Nivel 1</option>
                <option value="E">Gerente Nivel 2</option>
                <option value="F">Control Total</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Activo</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[80px]"
              placeholder="Notas adicionales..."
            />
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {mutation.isPending ? 'Guardando...' : attendant ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
