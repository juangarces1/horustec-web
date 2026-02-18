'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
  bgGradient?: string;
  iconBgClass?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  colorClass = 'text-slate-700',
  bgGradient = 'from-slate-50 to-gray-50',
  iconBgClass = 'bg-slate-500/20',
  valuePrefix = '',
  valueSuffix = '',
}: KPICardProps) {
  return (
    <Card className={cn('bg-gradient-to-br border-2 shadow-md hover:shadow-lg transition-shadow', bgGradient)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-sm font-medium', colorClass)}>{title}</p>
            <p className={cn('text-3xl font-bold mt-2', colorClass.replace('-700', '-900'))}>
              {valuePrefix}
              {typeof value === 'number' ? value.toLocaleString('es-CR') : value}
              {valueSuffix}
            </p>
          </div>
          <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', iconBgClass)}>
            <Icon className={cn('h-6 w-6', colorClass.replace('-700', '-600'))} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
