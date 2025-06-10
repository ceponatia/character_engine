# Frontend Module - CLAUDE.md

## Module Purpose

This module provides the complete user interface for a sophisticated AI-powered character interaction framework. It handles character management, real-time chat, and advanced interaction modes with a cohesive romantic dark theme and professional UX patterns.

## Responsibilities

### Core UI Components
- **Character Management** - Creation, editing, deletion, and gallery display of AI characters
- **Interactive Chat Interface** - Real-time messaging with character-specific responses
- **Session Management** - Story creation, session handling, and conversation continuity
- **Advanced Interaction Modes** - Delete mode, selection overlays, and multi-character support
- **Navigation & Layout** - Responsive routing and consistent page structures

### State Management & Data Flow
- **Character State** - Creation forms, selection tracking, delete workflows
- **Chat State** - Message history, typing indicators, real-time updates
- **Session State** - Story configurations, character assignments, save/load functionality
- **UI State** - Mode switching, overlay management, responsive layouts

### User Experience & Design Philosophy
- **Stable DOM Architecture** - Prevents flickering and layout shifts during state changes
- **Romantic Dark Theme** - Burgundy, plum, and rose color palettes with deep backgrounds
- **Professional UX Patterns** - Confirmation dialogs, progressive disclosure, graceful error handling
- **Responsive Design** - Optimized for 1920px desktop with mobile fallbacks
- **Visual Feedback** - Smooth transitions, hover effects, and interaction states

## Technical Stack
- **Framework**: Next.js 15 (React) with TypeScript
- **Styling**: Tailwind CSS with custom component library
- **State Management**: React Hook Form for complex forms, useState for UI state
- **Components**: Reusable StableCard system for DOM stability
- **Backend Integration**: RESTful API calls with Supabase database
- **Real-Time**: WebSocket client for live chat interactions
- **Icons**: Emoji-based iconography with SVG overlays

## Implemented Features ✅

### Character Management System
- ✅ **Character Builder** - 7-section wizard with comprehensive personality configuration
- ✅ **Character Gallery** - 4×2 responsive grid optimized for 1920px displays with delete functionality
- ✅ **Delete Workflow** - Multi-step deletion with confirmation dialogs and batch operations
- ✅ **Edit Mode** - Full character editing with pre-populated forms and data persistence
- ✅ **Avatar System** - DiceBear API integration with upload support and fallback handling

### Advanced UI Components
- ✅ **StableCard System** - Prevents DOM reconstruction and image flickering during state changes
- ✅ **Overlay Management** - Selection, delete, and edit overlays with proper z-indexing
- ✅ **Form Validation** - Real-time validation with error handling and user feedback
- ✅ **Progressive Disclosure** - Section-based navigation with state preservation
- ✅ **Confirmation Patterns** - Multi-step confirmation dialogs with clear warnings

### UX & Interaction Design  
- ✅ **Stable DOM Architecture** - No layout shifts during mode transitions
- ✅ **Professional Delete Flow** - Delete mode toggle → selection → confirmation → execution
- ✅ **Responsive Grid** - 4 cards per row with scrollable overflow for large collections
- ✅ **Visual State Management** - Clear indicators for interactive modes and selections
- ✅ **Error Prevention** - Cascade deletion of character memories to maintain data integrity

### Design System
- ✅ **Romantic Dark Theme** - Burgundy/plum/rose color palette with glass-morphism effects
- ✅ **Component Library** - StableCard, SelectionOverlay, and reusable UI patterns
- ✅ **Typography Hierarchy** - Consistent text styling and information architecture
- ✅ **Interactive Feedback** - Hover effects, transitions, and loading states
- ✅ **Accessibility Patterns** - Proper contrast, keyboard navigation, and screen reader support

## Architecture Principles

### DOM Stability Pattern
The frontend implements a **stable DOM architecture** to prevent flickering and layout shifts:

```tsx
// ❌ Problematic: Conditional element types cause DOM reconstruction
{mode === 'view' ? (
  <Link href="/character/123"><div className="card">...</div></Link>
) : (
  <div onClick={handler}><div className="card">...</div></div>
)}

// ✅ Stable: Same DOM structure, conditional behavior
<StableCard 
  href="/character/123" 
  isInteractive={mode === 'edit'}
  overlays={[<SelectionOverlay isSelected={selected} />]}
>
  <div className="card">...</div>
</StableCard>
```

### Component Design Philosophy
- **Reusable Patterns** - StableCard, overlays, and interaction modes for consistency
- **State Isolation** - UI state separated from business logic
- **Progressive Enhancement** - Base functionality works, overlays enhance interaction
- **Predictable Behavior** - No surprise layout shifts or content reloading

### Key Features In Development

#### Real-Time Chat System
- **WebSocket Integration** - Live messaging with character-specific responses
- **Typing Indicators** - "Character is typing..." with romantic styling
- **Message Threading** - Conversation history and context management
- **Character Switching** - Seamless transitions between different AI companions

#### Advanced Character Features
- **Session Management** - Save/load/continue conversation sessions with story context
- **Character Profiles** - Detailed character pages showing full personality configuration
- **Relationship Progression** - Dynamic character growth based on interaction history
- **Environmental Integration** - Time, weather, location effects on character behavior

## Integration Points
- **Backend API**: RESTful endpoints for character/session management
- **WebSocket Server**: Real-time messaging and presence updates
- **Character Engine**: Character state display and interaction controls
- **Session Manager**: Save/load functionality and session history

## Component Library

### StableCard System
**Location**: `/app/components/UI/StableCard.tsx`

**Purpose**: Prevents DOM reconstruction during state changes to eliminate image flickering and layout shifts.

**Usage**:
```tsx
<StableCard
  href="/character/123"
  isInteractive={deleteMode}
  isSelected={selectedIds.has(character.id)}
  onClick={handleSelect}
  overlays={[
    <SelectionOverlay key="selection" isSelected={isSelected} />
  ]}
>
  <img src="avatar.jpg" />
  <div>Character info...</div>
</StableCard>
```

**Pre-built Overlays**:
- `SelectionOverlay` - Checkmark for selected items
- `DeleteOverlay` - Delete icon for deletion mode  
- `EditOverlay` - Edit icon for edit mode

### Layout Specifications

#### Character Gallery Grid
- **Desktop (1920px)**: 4×2 grid in 500px height scrollable container
- **Responsive**: Maintains 4 columns with proper card spacing
- **Grid Container**: `max-w-6xl` with `px-2 pt-2` for highlight edge protection
- **Card Sizing**: Fixed aspect ratio with responsive scaling

#### Color System
- **Primary**: Rose (#e11d48) - main actions and selection states
- **Secondary**: Purple (#9333ea) - secondary actions  
- **Background**: Slate gradient (#0f172a → #1e293b → #374151)
- **Cards**: Glass-morphism with `bg-slate-800/40` and backdrop-blur
- **Selection**: Rose ring (`ring-2 ring-rose-400`) with scale-105 transform

#### Typography & Spacing
- **Headings**: Gradient text (`from-rose-400 to-pink-400`)
- **Body Text**: Slate hierarchy (100, 300, 400) for information hierarchy
- **Interactive Elements**: Smooth transitions (200ms) and hover feedback
- **Form Elements**: Rose focus states with proper contrast

## Code Quality Patterns

### State Management Best Practices
- **Separate Concerns**: UI state vs business logic vs form state
- **Predictable Updates**: Immutable state updates with proper React patterns
- **Error Boundaries**: Graceful error handling with user feedback
- **Loading States**: Progressive loading with skeleton states

### Performance Optimizations
- **Memoized Functions**: `useMemo` for expensive calculations (avatar sources)
- **Stable References**: Prevent unnecessary re-renders during mode changes
- **Lazy Loading**: Dynamic imports for large components
- **Image Optimization**: Fallback strategies and error handling

### Accessibility & UX
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Readers**: Proper ARIA labels and semantic HTML structure
- **Color Contrast**: WCAG AA compliance for all text/background combinations
- **Focus Management**: Logical tab order and focus indicators

This frontend module provides a professional, stable, and scalable foundation for complex character interaction interfaces with enterprise-grade UX patterns.