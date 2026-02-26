'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { identifiersApi } from '@/lib/api/identifiers';
import {
  IdentifierUserLevel,
  IdentifierUserLevelLabels,
  IdentifierPermissionLevel,
  IdentifierPermissionLabels,
  IdentifierDto,
  IdentifierRecordDto,
  SaveTagRequest,
} from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Plus,
  Trash2,
  ShieldBan,
  ShieldCheck,
  ShieldMinus,
  Search,
  AlertTriangle,
  Loader2,
  Tag,
  ShieldAlert,
  List,
  RefreshCw,
} from 'lucide-react';

// Helper para extraer mensaje de error del backend
function getErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors) {
    const messages = Object.values(data.errors).flat() as string[];
    if (messages.length > 0) return messages.join('. ');
  }
  return fallback;
}

export default function IdentificadoresPage() {
  // --- Save Tag form state ---
  const [saveForm, setSaveForm] = useState<SaveTagRequest>({
    tag: '',
    userLevel: IdentifierUserLevel.Vehicle,
    permission: IdentifierPermissionLevel.ReleasePump,
  });

  // --- Delete Tag form state ---
  const [deletePosition, setDeletePosition] = useState('');
  const [deleteTag, setDeleteTag] = useState('');

  // --- Blacklist form state ---
  const [blacklistPushTag, setBlacklistPushTag] = useState('');
  const [blacklistPopTag, setBlacklistPopTag] = useState('');

  // --- Pending identifier result ---
  const [pendingResult, setPendingResult] = useState<IdentifierDto | null | undefined>(undefined);

  // --- Tag list state ---
  const [tagList, setTagList] = useState<IdentifierRecordDto[]>([]);

  // --- Mutations ---
  const readPendingMutation = useMutation({
    mutationFn: () => identifiersApi.readPending(),
    onSuccess: (data) => {
      setPendingResult(data);
      if (data && data.hasData) {
        toast.success(`Tag encontrado: ${data.tag}`);
      } else {
        toast('No hay identificadores pendientes', { icon: 'ℹ️' });
      }
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Error al leer identificador pendiente'));
    },
  });

  const saveTagMutation = useMutation({
    mutationFn: (data: SaveTagRequest) => identifiersApi.saveTag(data),
    onSuccess: () => {
      toast.success('Tag registrado exitosamente en el concentrador');
      setSaveForm({
        tag: '',
        userLevel: IdentifierUserLevel.Vehicle,
        permission: IdentifierPermissionLevel.ReleasePump,
      });
      if (tagList.length > 0) refreshTagList();
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Error al registrar tag'));
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: () => identifiersApi.deleteTag({ position: deletePosition, tag: deleteTag }),
    onSuccess: () => {
      toast.success('Tag eliminado del concentrador');
      setDeletePosition('');
      setDeleteTag('');
      if (tagList.length > 0) refreshTagList();
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Error al eliminar tag'));
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => identifiersApi.clearAllTags(),
    onSuccess: () => {
      toast.success('Todos los tags han sido eliminados del concentrador');
      setTagList([]);
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Error al limpiar tags')),
  });

  const pushBlacklistMutation = useMutation({
    mutationFn: (tag: string) => identifiersApi.pushBlacklist(tag),
    onSuccess: () => {
      toast.success('Tag agregado a la blacklist');
      setBlacklistPushTag('');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Error al agregar a blacklist')),
  });

  const popBlacklistMutation = useMutation({
    mutationFn: (tag: string) => identifiersApi.popBlacklist(tag),
    onSuccess: () => {
      toast.success('Tag removido de la blacklist');
      setBlacklistPopTag('');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Error al remover de blacklist')),
  });

  const listTagsMutation = useMutation({
    mutationFn: () => identifiersApi.listTags(),
    onSuccess: (data) => {
      setTagList(data);
      toast.success(`${data.length} tag${data.length !== 1 ? 's' : ''} encontrado${data.length !== 1 ? 's' : ''}`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Error al cargar tags'));
    },
  });

  const refreshTagList = () => listTagsMutation.mutate();

  const clearBlacklistMutation = useMutation({
    mutationFn: () => identifiersApi.clearBlacklist(),
    onSuccess: () => toast.success('Blacklist limpiada exitosamente'),
    onError: (error: any) => toast.error(getErrorMessage(error, 'Error al limpiar blacklist')),
  });

  // --- Handlers ---
  const handleSaveTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveForm.tag.trim()) {
      toast.error('El tag es requerido');
      return;
    }
    if (saveForm.tag.length > 16) {
      toast.error('El tag no puede tener mas de 16 caracteres');
      return;
    }
    saveTagMutation.mutate(saveForm);
  };

  const handleDeleteTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePosition.trim() || !deleteTag.trim()) {
      toast.error('La posicion y el tag son requeridos');
      return;
    }
    if (!confirm(`¿Eliminar el tag "${deleteTag}" en posicion ${deletePosition}?`)) return;
    deleteTagMutation.mutate();
  };

  const handleClearAll = () => {
    if (!confirm('¿Eliminar TODOS los tags del concentrador? Esta accion no se puede deshacer.')) return;
    clearAllMutation.mutate();
  };

  const handlePushBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistPushTag.trim()) {
      toast.error('El tag es requerido');
      return;
    }
    pushBlacklistMutation.mutate(blacklistPushTag.trim());
  };

  const handlePopBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistPopTag.trim()) {
      toast.error('El tag es requerido');
      return;
    }
    popBlacklistMutation.mutate(blacklistPopTag.trim());
  };

  const handleClearBlacklist = () => {
    if (!confirm('¿Limpiar toda la blacklist? Esta accion no se puede deshacer.')) return;
    clearBlacklistMutation.mutate();
  };

  // UserLevel options for select
  const userLevelOptions = Object.entries(IdentifierUserLevelLabels).map(([value, label]) => ({
    value: Number(value),
    label,
  }));

  // Permission options for select
  const permissionOptions = Object.entries(IdentifierPermissionLabels).map(([value, label]) => ({
    value: Number(value),
    label,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Identificadores
            </h1>
            <p className="text-gray-600 mt-1">Gestion de tags RFID y blacklist del concentrador</p>
          </div>
        </div>
      </div>

      {/* Leer Pendiente */}
      <Card className="mb-6 border-2 border-indigo-100 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Leer el ultimo identificador pendiente del concentrador</p>
              {pendingResult !== undefined && (
                <div className="mt-2">
                  {pendingResult && pendingResult.hasData ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300 border gap-1.5 text-sm" variant="outline">
                      <Tag className="h-3.5 w-3.5" />
                      Tag: {pendingResult.tag}
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 border-gray-300 border gap-1.5" variant="outline">
                      Sin datos pendientes
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={() => readPendingMutation.mutate()}
              variant="outline"
              className="gap-2 whitespace-nowrap"
              disabled={readPendingMutation.isPending}
            >
              {readPendingMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Leer Pendiente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Tags / Blacklist */}
      <Tabs defaultValue="tags" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="tags" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Tags RFID
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="gap-2">
            <ShieldBan className="h-4 w-4" />
            Blacklist
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TAB: Tags */}
        {/* ============================================================ */}
        <TabsContent value="tags" className="space-y-6">
          {/* Lista de Tags */}
          <Card className="border-2 border-indigo-100 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <List className="h-5 w-5 text-indigo-600" />
                    Tags Registrados
                  </CardTitle>
                  <CardDescription>Tags almacenados en la memoria del concentrador</CardDescription>
                </div>
                <Button
                  onClick={() => listTagsMutation.mutate()}
                  disabled={listTagsMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {listTagsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {listTagsMutation.isPending ? 'Leyendo concentrador...' : 'Cargar Tags'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {listTagsMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                  <p className="text-gray-500">Leyendo tags del concentrador...</p>
                  <p className="text-xs text-gray-400 mt-1">Esto puede tardar varios segundos</p>
                </div>
              ) : tagList.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50">
                        <TableHead className="font-bold">Posicion</TableHead>
                        <TableHead className="font-bold">Tag</TableHead>
                        <TableHead className="font-bold">Bicos</TableHead>
                        <TableHead className="font-bold">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tagList.map((record) => (
                        <TableRow key={record.position} className="hover:bg-indigo-50/50 transition-colors">
                          <TableCell className="font-mono text-sm">{record.position}</TableCell>
                          <TableCell>
                            <Badge className="font-mono bg-indigo-50 text-indigo-700 border-indigo-200 border" variant="outline">
                              {record.tag}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{record.nozzleCodes || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {String(record.day).padStart(2, '0')}/{String(record.month).padStart(2, '0')}{' '}
                            {String(record.hour).padStart(2, '0')}:{String(record.minute).padStart(2, '0')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-gray-400 mt-3 text-right">{tagList.length} tag{tagList.length !== 1 ? 's' : ''} registrado{tagList.length !== 1 ? 's' : ''}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Presiona "Cargar Tags" para leer los tags del concentrador</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registrar Tag */}
          <Card className="border-2 border-indigo-100 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-indigo-600" />
                Registrar Tag
              </CardTitle>
              <CardDescription>Guardar un identificador RFID en la memoria del concentrador</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveTag} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Tag */}
                  <div className="space-y-2">
                    <Label htmlFor="save-tag">
                      Tag (hex) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="save-tag"
                      value={saveForm.tag}
                      onChange={(e) => setSaveForm({ ...saveForm, tag: e.target.value.toUpperCase() })}
                      placeholder="Ej: 0A1B2C3D4E5F6789"
                      maxLength={16}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">Maximo 16 caracteres hexadecimales</p>
                  </div>

                  {/* User Level */}
                  <div className="space-y-2">
                    <Label>
                      Nivel de Usuario <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={String(saveForm.userLevel)}
                      onValueChange={(v) => setSaveForm({ ...saveForm, userLevel: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        {userLevelOptions.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Permission Level */}
                  <div className="space-y-2">
                    <Label>
                      Nivel de Permiso <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={String(saveForm.permission)}
                      onValueChange={(v) => setSaveForm({ ...saveForm, permission: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar permiso" />
                      </SelectTrigger>
                      <SelectContent>
                        {permissionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={saveTagMutation.isPending}
                    className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {saveTagMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {saveTagMutation.isPending ? 'Registrando...' : 'Registrar Tag'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Eliminar Tag */}
          <Card className="border-2 border-orange-100 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trash2 className="h-5 w-5 text-orange-600" />
                Eliminar Tag
              </CardTitle>
              <CardDescription>Eliminar un identificador especifico de la memoria del concentrador</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeleteTag} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="delete-position">
                      Posicion <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="delete-position"
                      value={deletePosition}
                      onChange={(e) => setDeletePosition(e.target.value)}
                      placeholder="Ej: 000001"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delete-tag">
                      Tag (hex) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="delete-tag"
                      value={deleteTag}
                      onChange={(e) => setDeleteTag(e.target.value.toUpperCase())}
                      placeholder="Ej: 0A1B2C3D4E5F6789"
                      maxLength={16}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={deleteTagMutation.isPending}
                    className="gap-2 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
                  >
                    {deleteTagMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {deleteTagMutation.isPending ? 'Eliminando...' : 'Eliminar Tag'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Eliminar Todos */}
          <Card className="border-2 border-red-100 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-red-700">Zona de peligro</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Eliminar todos los tags registrados en el concentrador. Esta accion no se puede deshacer.
                  </p>
                </div>
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  disabled={clearAllMutation.isPending}
                  className="gap-2 whitespace-nowrap border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  {clearAllMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {clearAllMutation.isPending ? 'Eliminando...' : 'Eliminar Todos los Tags'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: Blacklist */}
        {/* ============================================================ */}
        <TabsContent value="blacklist" className="space-y-6">
          {/* Agregar a Blacklist */}
          <Card className="border-2 border-indigo-100 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldBan className="h-5 w-5 text-indigo-600" />
                Agregar a Blacklist
              </CardTitle>
              <CardDescription>Bloquear un identificador (maximo 20 posiciones en el concentrador)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePushBlacklist} className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="bl-push-tag">
                      Tag (hex) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bl-push-tag"
                      value={blacklistPushTag}
                      onChange={(e) => setBlacklistPushTag(e.target.value.toUpperCase())}
                      placeholder="Ej: 0A1B2C3D4E5F6789"
                      maxLength={16}
                      className="font-mono"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={pushBlacklistMutation.isPending}
                    className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {pushBlacklistMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldBan className="h-4 w-4" />
                    )}
                    {pushBlacklistMutation.isPending ? 'Agregando...' : 'Agregar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quitar de Blacklist */}
          <Card className="border-2 border-green-100 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                Quitar de Blacklist
              </CardTitle>
              <CardDescription>Desbloquear un identificador previamente bloqueado</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePopBlacklist} className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="bl-pop-tag">
                      Tag (hex) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bl-pop-tag"
                      value={blacklistPopTag}
                      onChange={(e) => setBlacklistPopTag(e.target.value.toUpperCase())}
                      placeholder="Ej: 0A1B2C3D4E5F6789"
                      maxLength={16}
                      className="font-mono"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={popBlacklistMutation.isPending}
                    className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                  >
                    {popBlacklistMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldMinus className="h-4 w-4" />
                    )}
                    {popBlacklistMutation.isPending ? 'Quitando...' : 'Quitar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Limpiar Blacklist */}
          <Card className="border-2 border-red-100 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-red-700">Zona de peligro</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Limpiar toda la blacklist del concentrador. Esta accion no se puede deshacer.
                  </p>
                </div>
                <Button
                  onClick={handleClearBlacklist}
                  variant="outline"
                  disabled={clearBlacklistMutation.isPending}
                  className="gap-2 whitespace-nowrap border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                  {clearBlacklistMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-4 w-4" />
                  )}
                  {clearBlacklistMutation.isPending ? 'Limpiando...' : 'Limpiar Blacklist'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
