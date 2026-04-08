'use client';

import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import clsx from 'clsx';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { Pagination } from '@/components/shared/Pagination';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { useUIStore } from '@/store/ui.store';
import { CustomerForm } from '@/components/customers/CustomerForm';

type View = 'active' | 'trash';

export default function CustomersPage() {
  const [view, setView] = useState<View>('active');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const openCreate = useUIStore((s) => s.openCreateModal);

  const { data, isLoading, isError, error } = useCustomers({
    page,
    limit: 20,
    search,
    deleted: view === 'trash',
  });

  const switchView = (next: View) => {
    if (next === view) return;
    setView(next);
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        {view === 'active' && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> New Customer
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2 border-b border-[#334155]">
        <TabButton
          active={view === 'active'}
          onClick={() => switchView('active')}
          icon={<Users className="w-4 h-4" />}
          label="Active"
        />
        <TabButton
          active={view === 'trash'}
          onClick={() => switchView('trash')}
          icon={<Trash2 className="w-4 h-4" />}
          label="Trash"
        />
      </div>

      <div className="mb-4">
        <SearchInput
          placeholder={view === 'trash' ? 'Search deleted customers...' : 'Search customers...'}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorMessage message={(error as Error)?.message} />}
      {data && (
        <>
          <CustomerTable customers={data.data} mode={view} />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <CustomerForm mode="create" />
      <CustomerForm mode="edit" />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
        active
          ? 'border-[#3B82F6] text-white'
          : 'border-transparent text-[#94A3B8] hover:text-white',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
