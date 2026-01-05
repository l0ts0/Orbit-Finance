import React from 'react';
import { CategoryDef } from '../types';
import { ICON_MAP } from '../utils/iconMap';
import { MoreHorizontal, Check } from 'lucide-react';

interface CategorySelectorProps {
    categories: CategoryDef[];
    selectedCategoryId: string;
    onSelectCategory: (id: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
    categories,
    selectedCategoryId,
    onSelectCategory,
}) => {
    return (
        <div className="grid grid-cols-4 gap-3 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
            {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelectCategory(cat.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isSelected
                                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                            }`}
                    >
                        <div className={`p-2 rounded-full ${cat.color} ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
                            {ICON_MAP[cat.icon] || <MoreHorizontal size={16} />}
                        </div>
                        <span className={`text-xs font-medium truncate w-full text-center ${isSelected ? 'text-indigo-300' : 'text-slate-500'}`}>
                            {cat.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
