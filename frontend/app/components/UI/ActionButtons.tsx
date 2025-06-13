'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface ActionButtonsProps {
  // Item management
  hasItems?: boolean;
  
  // Navigation functionality
  showBack?: boolean;
  backText?: string;
  backIcon?: string;
  
  // Edit functionality
  showEdit?: boolean;
  editHref?: string;
  onEdit?: () => void;
  editText?: string;
  editIcon?: string;
  
  // Delete functionality
  showDelete?: boolean;
  deleteMode?: boolean;
  selectedCount?: number;
  onDeleteToggle?: () => void;
  onDeleteConfirm?: () => void;
  onClearSelection?: () => void; // For clearing selections when toggling delete mode
  deleteText?: string;
  deleteIcon?: string;
  
  // Styling
  variant?: 'detail' | 'library' | 'inline' | 'small';
  className?: string;
  
  // Custom actions
  customActions?: ReactNode;
  
  // Layout options for library variant
  separateConfirmButton?: boolean; // Render confirm button separately for custom positioning
}

/**
 * Unified action buttons component for edit/delete operations
 * Handles different patterns: detail pages, library pages, inline actions
 */
export default function ActionButtons({
  hasItems = true,
  showBack = false,
  backText = 'Back',
  backIcon = '←',
  showEdit = false,
  editHref,
  onEdit,
  editText = 'Edit',
  editIcon = '✏️',
  showDelete = false,
  deleteMode = false,
  selectedCount = 0,
  onDeleteToggle,
  onDeleteConfirm,
  onClearSelection,
  deleteText = 'Delete',
  deleteIcon = '🗑️',
  variant = 'detail',
  className = '',
  customActions,
  separateConfirmButton = false
}: ActionButtonsProps) {
  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };
  
  // Don't render any delete/edit buttons if library is empty
  if (!hasItems && variant === 'library') {
    return customActions ? <div className={`flex gap-4 ${className}`}>{customActions}</div> : null;
  }

  // Build styles based on variant
  const getButtonClasses = (type: 'back' | 'edit' | 'delete' | 'confirm' | 'cancel') => {
    const baseTransition = 'transition-all duration-200';
    
    switch (variant) {
      case 'detail':
        if (type === 'back') {
          return `btn-romantic-outline ${baseTransition}`;
        }
        if (type === 'edit') {
          return `btn-romantic-secondary ${baseTransition}`;
        }
        if (type === 'delete') {
          return `btn-romantic-outline ${baseTransition}`;
        }
        if (type === 'confirm') {
          return `bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg ${baseTransition}`;
        }
        break;
        
      case 'library':
        if (type === 'back') {
          return `btn-romantic-outline ${baseTransition}`;
        }
        if (type === 'delete' || type === 'cancel') {
          return `btn-romantic-outline ${baseTransition}`;
        }
        if (type === 'confirm') {
          return `bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg ${baseTransition}`;
        }
        break;
        
      case 'inline':
        if (type === 'back') {
          return `text-slate-400 hover:text-slate-200 transition-colors text-sm`;
        }
        if (type === 'edit') {
          return `opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200`;
        }
        if (type === 'delete') {
          return `text-rose-400 hover:text-rose-200 transition-colors`;
        }
        break;
        
      case 'small':
        if (type === 'back') {
          return `text-slate-400 hover:text-slate-200 transition-colors text-sm`;
        }
        if (type === 'edit') {
          return `text-slate-400 hover:text-slate-200 transition-colors text-sm`;
        }
        if (type === 'delete') {
          return `text-rose-400 hover:text-rose-200 transition-colors text-sm`;
        }
        break;
    }
    
    return baseTransition;
  };

  const handleDeleteToggle = () => {
    if (onDeleteToggle) {
      onDeleteToggle();
    }
    // Clear selections when toggling delete mode
    if (onClearSelection) {
      onClearSelection();
    }
  };

  const containerClasses = variant === 'library' 
    ? `flex gap-4 ${className}` 
    : `flex gap-4 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Custom actions first */}
      {customActions}
      
      {/* Back button */}
      {showBack && (
        <button onClick={handleBack} className={getButtonClasses('back')}>
          {variant !== 'inline' && variant !== 'small' && backIcon} {backText}
        </button>
      )}
      
      {/* Edit button */}
      {showEdit && (
        editHref ? (
          <Link href={editHref} className={getButtonClasses('edit')}>
            {variant !== 'inline' && editIcon} {editText}
          </Link>
        ) : (
          <button onClick={onEdit} className={getButtonClasses('edit')}>
            {variant !== 'inline' && editIcon} {editText}
          </button>
        )
      )}
      
      {/* Delete button/mode toggle */}
      {showDelete && onDeleteToggle && (
        <button 
          onClick={handleDeleteToggle} 
          className={getButtonClasses(deleteMode ? 'cancel' : 'delete')}
        >
          {deleteMode ? (
            'Cancel'
          ) : (
            <>
              {variant !== 'inline' && variant !== 'small' && deleteIcon} {deleteText}
            </>
          )}
        </button>
      )}
      
      {/* Confirm delete button (for library/bulk operations) - only if not separated */}
      {!separateConfirmButton && deleteMode && selectedCount > 0 && onDeleteConfirm && (
        <button 
          onClick={onDeleteConfirm}
          className={getButtonClasses('confirm')}
        >
          Confirm Delete ({selectedCount})
        </button>
      )}
    </div>
  );
}

/**
 * Separate confirm delete button for custom positioning (used with separateConfirmButton=true)
 */
export const ConfirmDeleteButton = ({ 
  selectedCount, 
  onDeleteConfirm, 
  className = "bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors" 
}: { 
  selectedCount: number; 
  onDeleteConfirm: () => void; 
  className?: string; 
}) => (
  <button onClick={onDeleteConfirm} className={className}>
    Confirm Delete ({selectedCount})
  </button>
);

// Convenience components for common patterns
export const DetailPageActions = ({ 
  editHref, 
  onEdit, 
  showDelete = false, 
  onDelete,
  editText = 'Edit',
  deleteText = 'Delete',
  itemType = 'item',
  ...props 
}: Omit<ActionButtonsProps, 'variant' | 'showEdit'> & { 
  editHref?: string; 
  onEdit?: () => void;
  onDelete?: () => void;
  itemType?: string;
}) => (
  <ActionButtons
    variant="detail"
    showEdit={true}
    editHref={editHref}
    onEdit={onEdit}
    editText={`${editText} ${itemType}`}
    showDelete={showDelete}
    onDeleteToggle={onDelete}
    deleteText={`${deleteText} ${itemType}`}
    {...props}
  />
);

export const LibraryActions = ({ 
  hasItems, 
  deleteMode, 
  selectedCount, 
  onDeleteToggle, 
  onDeleteConfirm,
  onClearSelection,
  separateConfirmButton = false,
  ...props 
}: Pick<ActionButtonsProps, 'hasItems' | 'deleteMode' | 'selectedCount' | 'onDeleteToggle' | 'onDeleteConfirm' | 'onClearSelection' | 'customActions' | 'className' | 'separateConfirmButton'>) => (
  <ActionButtons
    variant="library"
    hasItems={hasItems}
    showDelete={hasItems}
    deleteMode={deleteMode}
    selectedCount={selectedCount}
    onDeleteToggle={onDeleteToggle}
    onDeleteConfirm={onDeleteConfirm}
    onClearSelection={onClearSelection}
    separateConfirmButton={separateConfirmButton}
    {...props}
  />
);

export const InlineActions = ({ 
  showEdit = true, 
  showDelete = false, 
  onEdit, 
  onDelete,
  ...props 
}: Omit<ActionButtonsProps, 'variant'> & { 
  onEdit?: () => void; 
  onDelete?: () => void; 
}) => (
  <ActionButtons
    variant="inline"
    showEdit={showEdit}
    onEdit={onEdit}
    showDelete={showDelete}
    onDeleteToggle={onDelete}
    editText=""
    deleteText="×"
    {...props}
  />
);

export const SmallActions = ({ 
  showEdit = false, 
  showDelete = true, 
  onEdit, 
  onDelete,
  ...props 
}: Omit<ActionButtonsProps, 'variant'> & { 
  onEdit?: () => void; 
  onDelete?: () => void; 
}) => (
  <ActionButtons
    variant="small"
    showEdit={showEdit}
    onEdit={onEdit}
    showDelete={showDelete}
    onDeleteToggle={onDelete}
    editText="Edit"
    deleteText="Remove"
    {...props}
  />
);

export const BackButton = ({ 
  text = 'Back',
  variant = 'detail',
  className,
  ...props 
}: Pick<ActionButtonsProps, 'variant' | 'className'> & { 
  text?: string;
}) => (
  <ActionButtons
    variant={variant}
    showBack={true}
    backText={text}
    className={className}
    {...props}
  />
);