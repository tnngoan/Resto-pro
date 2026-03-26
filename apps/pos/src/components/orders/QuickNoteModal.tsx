/**
 * QuickNoteModal.tsx — Quick modal to add/edit a note on an order item.
 * Common kitchen notes pre-filled as quick buttons.
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface QuickNoteModalProps {
  itemName: string;
  currentNote: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

const QUICK_NOTES = [
  'Ít cay',
  'Không cay',
  'Cay nhiều',
  'Không hành',
  'Không rau',
  'Thêm rau',
  'Ít đá',
  'Không đường',
  'Ít đường',
  'Để riêng nước',
  'Không giá',
  'Chín kỹ',
];

export function QuickNoteModal({ itemName, currentNote, onSave, onClose }: QuickNoteModalProps) {
  const [note, setNote] = useState(currentNote);

  const appendQuickNote = (quickNote: string) => {
    setNote((prev) => {
      if (prev.includes(quickNote)) return prev;
      return prev ? `${prev}, ${quickNote}` : quickNote;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-surface-medium rounded-2xl p-5 w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary">Ghi chú — {itemName}</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-light transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick note buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_NOTES.map((qn) => (
            <button
              key={qn}
              onClick={() => appendQuickNote(qn)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                note.includes(qn)
                  ? 'bg-gold-500 text-surface-dark'
                  : 'bg-surface-light text-secondary hover:text-primary'
              }`}
            >
              {qn}
            </button>
          ))}
        </div>

        {/* Free-text input */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập ghi chú tự do..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-surface-dark border border-surface-light text-primary text-sm placeholder-tertiary resize-none focus:outline-none focus:border-gold-500"
        />

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => {
              setNote('');
              onSave('');
            }}
            className="flex-1 py-2.5 rounded-lg bg-surface-light text-secondary font-medium text-sm hover:bg-surface-light/80 transition-colors min-h-[44px]"
          >
            Xóa ghi chú
          </button>
          <button
            onClick={() => onSave(note)}
            className="flex-1 py-2.5 rounded-lg bg-gold-500 text-surface-dark font-bold text-sm hover:bg-gold-400 transition-colors min-h-[44px]"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
