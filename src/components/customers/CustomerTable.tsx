'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, RotateCcw, Trash2, Undo2, X } from 'lucide-react';
import type { Customer } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { useUIStore } from '@/store/ui.store';
import { useDeleteCustomer, useRestoreCustomer } from '@/hooks/useCustomers';

interface Props {
  customers: Customer[];
  mode?: 'active' | 'trash';
}

interface UndoState {
  id: string;
  name: string;
}

const UNDO_TIMEOUT_MS = 6000;

export function CustomerTable({ customers, mode = 'active' }: Props) {
  const isTrash = mode === 'trash';
  const openEdit = useUIStore((s) => s.openEditModal);
  const deleteMut = useDeleteCustomer();
  const restoreMut = useRestoreCustomer();
  const [undo, setUndo] = useState<UndoState | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndo = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = null;
    setUndo(null);
  };

  useEffect(() => clearUndo, []);

  const handleDelete = (c: Customer) => {
    if (!confirm(`Delete customer "${c.name}"?`)) return;
    deleteMut.mutate(c.id, {
      onSuccess: () => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        setUndo({ id: c.id, name: c.name });
        dismissTimer.current = setTimeout(() => setUndo(null), UNDO_TIMEOUT_MS);
      },
    });
  };

  const handleUndo = () => {
    if (!undo) return;
    const id = undo.id;
    clearUndo();
    restoreMut.mutate(id);
  };

  const handleRestore = (c: Customer) => {
    if (!confirm(`Restore customer "${c.name}"?`)) return;
    restoreMut.mutate(c.id);
  };

  const undoBanner = undo && (
    <div
      role="status"
      className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-[#334155] bg-[#0F172A] px-4 py-2 text-sm"
    >
      <span className="text-[#CBD5E1]">
        Customer <span className="font-medium text-white">"{undo.name}"</span> deleted.
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={restoreMut.isPending}
          className="inline-flex items-center gap-1 rounded-md bg-[#22C55E]/15 px-2 py-1 font-medium text-[#22C55E] hover:bg-[#22C55E]/25 disabled:opacity-50"
        >
          <Undo2 className="w-3.5 h-3.5" />
          {restoreMut.isPending ? 'Restoring…' : 'Undo'}
        </button>
        <button
          type="button"
          onClick={clearUndo}
          className="btn-icon"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  if (customers.length === 0) {
    return (
      <>
        {undoBanner}
        <div className="card p-8 text-center text-[#94A3B8]">
          {isTrash ? 'Trash is empty' : 'No customers found'}
        </div>
      </>
    );
  }

  return (
    <>
    {undoBanner}
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0F172A] text-[#94A3B8] text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Assigned To</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#334155]">
          {customers.map((c) => (
            <tr
              key={c.id}
              className={
                isTrash
                  ? 'hover:bg-[#0F172A]/40 opacity-70'
                  : 'hover:bg-[#0F172A]/40'
              }
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} size="sm" />
                  <span className="font-medium">{c.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-[#94A3B8]">{c.email}</td>
              <td className="px-4 py-3 text-[#94A3B8]">{c.phone ?? '—'}</td>
              <td className="px-4 py-3">
                {c.assignee ? (
                  <div className="inline-flex items-center gap-2 bg-[#334155]/50 px-2 py-1 rounded-full">
                    <Avatar name={c.assignee.name} size="sm" />
                    <span className="text-xs pr-1">{c.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-[#94A3B8] bg-[#334155]/50 px-2 py-1 rounded-full">
                    Unassigned
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex gap-1">
                  {isTrash ? (
                    <button
                      className="btn-icon hover:text-[#22C55E]"
                      title="Restore"
                      disabled={restoreMut.isPending}
                      onClick={() => handleRestore(c)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <Link href={`/customers/${c.id}`} className="btn-icon" title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="btn-icon"
                        title="Edit"
                        onClick={() => openEdit(c.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-icon hover:text-[#EF4444]"
                        title="Delete"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
