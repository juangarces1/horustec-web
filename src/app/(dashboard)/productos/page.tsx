'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { productsApi } from '@/lib/api/products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, PackagePlus, Edit2, Trash2, ArrowLeft, Search, ChevronLeft, ChevronRight, Fuel } from 'lucide-react';
import type { ProductDto, CreateProductRequest } from '@/types/api';

const ITEMS_PER_PAGE = 8;

export default function ProductosPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [onlyActive, setOnlyActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Query to fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', onlyActive],
    queryFn: () => productsApi.getAll(onlyActive),
  });

  // Mutation to delete product
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar producto');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar el producto "${name}"? Esto también eliminará su historial de precios.`)) {
      deleteMutation.mutate(id);
    }
  };

  // Filter and search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;

    const query = searchQuery.toLowerCase();
    return products.filter((prod) =>
      prod.name.toLowerCase().includes(query) ||
      prod.code.toLowerCase().includes(query) ||
      prod.description?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="text-xl text-gray-600">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4 md:p-8">
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
              Productos
            </h1>
            <p className="text-gray-600 mt-1">Gestión de combustibles y servicios</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(!showForm);
          }}
          className="gap-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700"
        >
          <PackagePlus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, código o descripción..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => setOnlyActive(true)}
            variant={onlyActive ? 'default' : 'outline'}
            className={onlyActive ? 'bg-gradient-to-r from-amber-600 to-red-600' : ''}
          >
            Solo Activos ({products.filter(p => p.isActive).length})
          </Button>
          <Button
            onClick={() => setOnlyActive(false)}
            variant={!onlyActive ? 'default' : 'outline'}
            className={!onlyActive ? 'bg-gradient-to-r from-amber-600 to-red-600' : ''}
          >
            Todos ({products.length})
          </Button>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {paginatedProducts.map((product) => (
          <Card
            key={product.id}
            className="group relative overflow-hidden border-2 transition-all hover:shadow-2xl hover:-translate-y-1 bg-white/80 backdrop-blur-sm"
          >
            {/* Status badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
              product.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {product.isActive ? '✓ Activo' : 'Inactivo'}
            </div>

            {/* Fuel Icon */}
            <div className="absolute top-4 left-4 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-red-400 flex items-center justify-center text-white text-2xl opacity-20 group-hover:opacity-30 transition-opacity">
              <Fuel className="h-8 w-8" />
            </div>

            <CardHeader className="pb-3 pt-20">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-mono font-semibold">
                  {product.code}
                </span>
              </div>
              <CardTitle className="text-xl">{product.name}</CardTitle>
              {product.description && (
                <CardDescription className="text-sm line-clamp-2">
                  {product.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Price Display */}
              <div className="text-center py-3 bg-gradient-to-br from-amber-50 to-red-50 rounded-lg border border-amber-200">
                <div className="text-xs text-gray-500 mb-1">Precio Actual</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                  ₡{product.currentPrice.toFixed(product.priceDecimals)}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {product.priceDecimals} decimales
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Creado: {new Date(product.createdAt).toLocaleDateString('es-ES')}</div>
                {product.updatedAt && (
                  <div>Actualizado: {new Date(product.updatedAt).toLocaleDateString('es-ES')}</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-2 hover:bg-amber-50"
                  onClick={() => {
                    setEditingProduct(product);
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
                  onClick={() => handleDelete(product.id, product.name)}
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
                className={currentPage === page ? 'bg-gradient-to-r from-amber-600 to-red-600' : ''}
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

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchQuery ? 'No se encontraron resultados' : 'No hay productos registrados'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 gap-2 bg-gradient-to-r from-amber-600 to-red-600"
            >
              <PackagePlus className="h-4 w-4" />
              Agregar el primero
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Form Component
function ProductForm({
  product,
  onClose,
}: {
  product: ProductDto | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateProductRequest>({
    code: product?.code || '',
    name: product?.name || '',
    description: product?.description || '',
    priceDecimals: product?.priceDecimals || 3,
    currentPrice: product?.currentPrice || 0,
    isActive: product?.isActive ?? true,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateProductRequest) =>
      product
        ? productsApi.update(product.id, { ...data, id: product.id })
        : productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      toast.success(product ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al guardar producto');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Card className="mb-6 border-2 border-amber-200 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </CardTitle>
        <CardDescription>Complete la información del combustible o servicio</CardDescription>
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
                placeholder="G95"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Código del protocolo (ej: G95, DSL)</p>
            </div>
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Gasolina Super"
              />
            </div>
            <div>
              <Label htmlFor="currentPrice">Precio Actual *</Label>
              <Input
                id="currentPrice"
                type="text"
                required
                value={formData.currentPrice}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  const numValue = value === '' ? 0 : parseFloat(value);
                  if (!isNaN(numValue)) {
                    setFormData({ ...formData, currentPrice: numValue });
                  }
                }}
                placeholder="Ej: 850.500"
                className="text-xl font-bold"
              />
              <p className="text-xs text-gray-500 mt-1">Precio por litro en colones (sin restricciones)</p>
            </div>
            <div>
              <Label htmlFor="priceDecimals">Decimales de Precio *</Label>
              <select
                id="priceDecimals"
                value={formData.priceDecimals}
                onChange={(e) => setFormData({ ...formData, priceDecimals: parseInt(e.target.value) })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value={0}>0 decimales</option>
                <option value={1}>1 decimal</option>
                <option value={2}>2 decimales</option>
                <option value={3}>3 decimales</option>
                <option value={4}>4 decimales</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Precisión para mostrar precios</p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[80px]"
                placeholder="Descripción adicional del producto..."
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Activo</Label>
              <p className="text-xs text-gray-500 ml-2">Disponible para dispensadores</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700"
            >
              {mutation.isPending ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
