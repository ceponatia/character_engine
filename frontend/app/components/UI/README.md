# UI Component Library

## StableCard Component

### Purpose
The `StableCard` component prevents DOM reconstruction and image flickering that occurs when conditionally rendering different wrapper elements (like switching between `<Link>` and `<div>`).

### Problem it Solves
When React components conditionally render different elements, it unmounts and remounts DOM nodes, causing:
- Image flickering/reloading
- Layout shifts
- Loss of focus states
- Poor user experience during mode transitions

### Before (❌ Problematic Pattern)
```tsx
{/* This causes DOM reconstruction */}
{!deleteMode ? (
  <Link href="/character/123">
    <div className="card">
      <img src="avatar.jpg" />
    </div>
  </Link>
) : (
  <div onClick={handleClick}>
    <div className="card">
      <img src="avatar.jpg" />
    </div>
  </div>
)}
```

### After (✅ Stable Pattern)
```tsx
<StableCard
  href="/character/123"
  isInteractive={deleteMode}
  isSelected={isSelected}
  onClick={handleClick}
  overlays={[
    <SelectionOverlay key="selection" isSelected={isSelected} />
  ]}
>
  <img src="avatar.jpg" />
</StableCard>
```

### Usage Examples

#### Basic Card with Navigation
```tsx
<StableCard href="/character/123">
  <img src="avatar.jpg" alt="Character" className="w-full h-48 object-cover" />
  <div className="p-4">
    <h3>Character Name</h3>
  </div>
</StableCard>
```

#### Interactive Card with Selection
```tsx
<StableCard
  href="/character/123"
  isInteractive={selectionMode}
  isSelected={selectedIds.has(character.id)}
  onClick={() => toggleSelection(character.id)}
  overlays={[
    <SelectionOverlay key="selection" isSelected={selectedIds.has(character.id)} />
  ]}
>
  <img src="avatar.jpg" alt="Character" className="w-full h-48 object-cover" />
</StableCard>
```

#### Multiple Overlays
```tsx
<StableCard
  href="/character/123"
  isInteractive={editMode}
  overlays={[
    <EditOverlay key="edit" isVisible={showEditButton} />,
    <DeleteOverlay key="delete" isVisible={showDeleteButton} />
  ]}
>
  <img src="avatar.jpg" alt="Character" />
</StableCard>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Card content (required) |
| `href` | `string` | - | Navigation URL (disabled in interactive mode) |
| `isInteractive` | `boolean` | `false` | Whether card is in interactive mode |
| `isSelected` | `boolean` | `false` | Whether card is selected (affects styling) |
| `className` | `string` | `''` | Additional CSS classes |
| `onClick` | `function` | - | Click handler for interactive mode |
| `overlays` | `ReactNode[]` | `[]` | Array of overlay components |

### Included Overlay Components

#### SelectionOverlay
Shows a checkmark when item is selected
```tsx
<SelectionOverlay isSelected={isSelected} />
```

#### DeleteOverlay
Shows a delete icon for deletion mode
```tsx
<DeleteOverlay isVisible={showDelete} />
```

#### EditOverlay
Shows an edit icon for edit mode
```tsx
<EditOverlay isVisible={showEdit} />
```

### When to Use

✅ **Use StableCard when:**
- Card needs to switch between clickable and interactive modes
- Card content should remain stable during state changes
- Implementing selection, delete, or edit overlays
- Prevention of image flickering is important

❌ **Don't use StableCard when:**
- Card structure never changes
- Simple static cards with consistent Link wrapping
- Performance is critical and you need maximum optimization

### CSS Classes

The component uses these CSS classes that should be defined in your styles:
- `.card-romantic` - Base card styling
- Responsive hover and scale effects are built-in

### Best Practices

1. **Always use keys for overlays** to prevent React reconciliation issues
2. **Keep overlay z-index consistent** (component handles this automatically)
3. **Use semantic overlay components** rather than custom divs when possible
4. **Test mode transitions** to ensure smooth user experience

### Integration Notes

- Works with existing card styling (`.card-romantic`)
- Maintains accessibility with proper click handlers
- Compatible with React 18+ strict mode
- TypeScript fully supported