'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowUp, ArrowDown, Star, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/coin/TierBadge';
import { Sparkline } from '@/components/coin/Sparkline';
import { formatPrice, formatCompact, formatPercent, formatSupply, changeColor, cn } from '@/lib/utils';
import type { Coin } from '@/types/database';

interface CoinsTableProps {
  data: Coin[];
  pageSize?: number;
  showPagination?: boolean;
  /** symbol(lowercase) → 7d sparkline values (CoinGecko sparkline_in_7d) */
  sparklineMap?: Record<string, number[]>;
  /** Row density: dense (compact data row) | comfortable (Material-style) */
  density?: 'dense' | 'comfortable';
}

export function CoinsTable({ data, pageSize = 100, showPagination = true, sparklineMap, density = 'dense' }: CoinsTableProps) {
  const tTable = useTranslations('table');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'rank', desc: false }]);

  const columns = useMemo<ColumnDef<Coin>[]>(
    () => [
      // Watchlist (★)
      {
        id: 'watchlist',
        header: '',
        cell: () => (
          <button
            aria-label="Add to watchlist"
            className="text-muted-foreground/40 hover:text-tier-s transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <Star className="h-3.5 w-3.5" />
          </button>
        ),
        size: 24,
        enableSorting: false,
      },
      // Rank
      {
        id: 'rank',
        accessorKey: 'rank',
        header: '#',
        cell: ({ row }) => <span className="num text-muted-foreground text-[11px]">{row.original.rank ?? '—'}</span>,
        size: 36,
      },
      // Tier
      {
        id: 'tier',
        accessorKey: 'tier',
        header: 'Tier',
        cell: ({ row }) => <TierBadge tier={row.original.tier} size="sm" />,
        size: 48,
      },
      // Coin (image + name + symbol)
      {
        id: 'name',
        accessorKey: 'name',
        header: tTable('name'),
        cell: ({ row }) => (
          <Link href={`/coin/${row.original.id}`} className="flex items-center gap-2 group min-w-0">
            {row.original.image_url ? (
              <Image
                src={row.original.image_url}
                alt={row.original.symbol}
                width={18}
                height={18}
                className="rounded-full shrink-0"
                unoptimized
              />
            ) : (
              <div className="h-[18px] w-[18px] rounded-full bg-muted shrink-0" />
            )}
            <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {row.original.name}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase shrink-0">{row.original.symbol}</span>
          </Link>
        ),
        size: 220,
      },
      // Price
      {
        id: 'price',
        accessorKey: 'price_usd',
        header: tTable('price'),
        cell: ({ row }) => <span className="num font-medium tabular-nums">{formatPrice(row.original.price_usd)}</span>,
        size: 92,
      },
      // 1h
      {
        id: 'change_1h',
        accessorKey: 'change_1h',
        header: '1h',
        cell: ({ row }) => (
          <span className={cn('num font-medium text-[11px] tabular-nums', changeColor(row.original.change_1h))}>
            {formatPercent(row.original.change_1h)}
          </span>
        ),
        size: 60,
      },
      // 24h
      {
        id: 'change_24h',
        accessorKey: 'change_24h',
        header: '24h',
        cell: ({ row }) => (
          <span className={cn('num font-medium text-[11px] tabular-nums', changeColor(row.original.change_24h))}>
            {formatPercent(row.original.change_24h)}
          </span>
        ),
        size: 64,
      },
      // 7d
      {
        id: 'change_7d',
        accessorKey: 'change_7d',
        header: '7d',
        cell: ({ row }) => (
          <span className={cn('num font-medium text-[11px] tabular-nums', changeColor(row.original.change_7d))}>
            {formatPercent(row.original.change_7d)}
          </span>
        ),
        size: 64,
      },
      // 30d
      {
        id: 'change_30d',
        accessorKey: 'change_30d',
        header: '30d',
        cell: ({ row }) => (
          <span className={cn('num font-medium text-[11px] tabular-nums', changeColor(row.original.change_30d))}>
            {formatPercent(row.original.change_30d)}
          </span>
        ),
        size: 64,
      },
      // Market Cap
      {
        id: 'market_cap',
        accessorKey: 'market_cap_usd',
        header: tTable('marketCap'),
        cell: ({ row }) => <span className="num tabular-nums">{formatCompact(row.original.market_cap_usd)}</span>,
        size: 100,
      },
      // 24h Volume
      {
        id: 'volume_24h',
        accessorKey: 'volume_24h_usd',
        header: tTable('volume24h'),
        cell: ({ row }) => <span className="num tabular-nums">{formatCompact(row.original.volume_24h_usd)}</span>,
        size: 100,
      },
      // Circulating Supply
      {
        id: 'circulating',
        accessorKey: 'circulating_supply',
        header: tTable('circulating'),
        cell: ({ row }) => (
          <span className="num text-muted-foreground text-[11px] tabular-nums">
            {formatSupply(row.original.circulating_supply, row.original.symbol.toUpperCase())}
          </span>
        ),
        size: 116,
      },
      // Sparkline 7d (CryptoRank UI 風)
      {
        id: 'sparkline',
        header: '7d',
        cell: ({ row }) => {
          const sym = row.original.symbol.toLowerCase();
          const data = sparklineMap?.[sym] ?? sparklineMap?.[row.original.id];
          return (
            <div className="flex items-center">
              <Sparkline data={data} width={94} height={28} strokeWidth={1.3} />
            </div>
          );
        },
        enableSorting: false,
        size: 100,
      },
    ],
    [tTable, sparklineMap],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
    initialState: { pagination: { pageSize } },
  });

  const totalRows = data.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const fromRow = (currentPage - 1) * pageSize + 1;
  const toRow = Math.min(currentPage * pageSize, totalRows);

  if (totalRows === 0) {
    return <div className="py-16 text-center text-muted-foreground text-sm">{tTable('noResults')}</div>;
  }

  const rowClass = density === 'dense' ? 'h-[42px]' : 'h-[56px]';

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto thin-scrollbar rounded-lg border border-border/60 bg-card/30">
        <table className="data-table w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn('text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium px-3 py-2 text-left', canSort && 'cursor-pointer hover:text-foreground')}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="inline-flex shrink-0">
                            {sortDir === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : sortDir === 'desc' ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-25" />
                            )}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={cn(rowClass, 'border-t border-border/30 hover:bg-accent/30 transition-colors')}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-1">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{tTable('showing', { from: fromRow, to: toRow, total: totalRows })}</span>
          <div className="flex items-center gap-2">
            <Button size="xs" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              {tTable('previous')}
            </Button>
            <Button size="xs" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              {tTable('next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
