import { useState, useMemo } from 'react';
import { Plus, Search, LayoutGrid, List } from 'lucide-react';
import { MenuItem } from '@restopro/shared';
import { Button } from '@restopro/ui';
import { useMenuCategories, useMenuItems, useMark86d } from '../features/menu/hooks/useMenu';
import MenuCategoryList from '../features/menu/components/MenuCategoryList';
import MenuItemCard from '../features/menu/components/MenuItemCard';
import MenuItemTable from '../features/menu/components/MenuItemTable';
import MenuItemForm from '../features/menu/components/MenuItemForm';
import { MenuViewMode, MenuItemFormData } from '../features/menu/types';

// TODO: replace with real restaurant ID from auth context
const RESTAURANT_ID = 'rest-1';

export default function MenuManagement() {
  // ─── State ───────────────────────────────────────────────────────────────────
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<MenuViewMode>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // ─── Data ────────────────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: categoriesLoading } =
    useMenuCategories(RESTAURANT_ID);
  const { data: allItems = [], isLoading: itemsLoading } =
    useMenuItems(RESTAURANT_ID);
  const mark86Mutation = useMark86d();

  // ─── Derived data ────────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Filter by category
    if (selectedCategoryId) {
      items = items.filter((item) => item.categoryId === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.nameIt?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query),
      );
    }

    return items;
  }, [allItems, selectedCategoryId, searchQuery]);

  // Stats
  const availableCount = allItems.filter((i) => i.isAvailable && !i.is86d).length;
  const out86Count = allItems.filter((i) => i.is86d).length;

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleToggle86 = (item: MenuItem) => {
    mark86Mutation.mutate({ id: item.id, is86d: !item.is86d });
  };

  const handleFormSubmit = (data: MenuItemFormData) => {
    // TODO: call create/update mutation when API is ready
    console.log('Form submitted:', editingItem ? 'UPDATE' : 'CREATE', data);
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  // ─── Loading state ───────────────────────────────────────────────────────────
  const isLoading = categoriesLoading || itemsLoading;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading text-text-primary mb-1">Thực đơn</h1>
          <p className="text-text-secondary text-sm">
            {availableCount} món có sẵn · {out86Count > 0 && (
              <span className="text-red-400">{out86Count} món hết hàng (86)</span>
            )}
            {out86Count === 0 && <span>Tất cả đều có sẵn</span>}
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={handleAddNew}>
          Thêm món
        </Button>
      </div>

      {/* ── Category tabs ───────────────────────────────────────────────────── */}
      {!isLoading && (
        <MenuCategoryList
          categories={categories}
          items={allItems}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      )}

      {/* ── Search + View toggle ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            type="text"
            placeholder="Tìm kiếm món..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-base border border-surface-light rounded-lg text-primary text-sm placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-surface-base border border-surface-light rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-gold text-surface-base'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Xem dạng lưới"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-gold text-surface-base'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Xem dạng bảng"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* ── Loading skeleton ────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-base border border-surface-light rounded-card overflow-hidden animate-pulse"
            >
              <div className="h-40 bg-surface-dark" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surface-light rounded w-3/4" />
                <div className="h-3 bg-surface-light rounded w-full" />
                <div className="h-6 bg-surface-light rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Item Grid ───────────────────────────────────────────────────────── */}
      {!isLoading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onToggle86={handleToggle86}
            />
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-text-tertiary">
              <p className="text-lg mb-2">Không tìm thấy món ăn</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc thêm món mới</p>
            </div>
          )}
        </div>
      )}

      {/* ── Item Table ──────────────────────────────────────────────────────── */}
      {!isLoading && viewMode === 'list' && (
        <MenuItemTable
          items={filteredItems}
          categories={categories}
          onEdit={handleEdit}
          onToggle86={handleToggle86}
        />
      )}

      {/* ── Form Modal ──────────────────────────────────────────────────────── */}
      <MenuItemForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        categories={categories}
        editingItem={editingItem}
      />
    </div>
  );
}
