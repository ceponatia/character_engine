# Frontend Module - CLAUDE.md

## Module Purpose

This module handles the user interface and real-time interaction components for the romantic chatbot system with a cohesive romantic dark theme and responsive design.

## Responsibilities

### Core UI Components
- **Chat Interface** - Message display with romantic styling, input handling, character selection
- **Character Management** - Character creation forms, profile editing, trait selection with visual feedback
- **Character Gallery** - Responsive grid layout with properly sized avatar thumbnails
- **Scene Management** - Location/setting selection and environmental controls
- **Session Controls** - Save/load sessions, session history, continuation options

### Real-Time Features
- **WebSocket Integration** - Real-time message delivery and typing indicators
- **Typing Indicators** - Display "Luna is talking..." when AI generates responses
- **Presence Detection** - Monitor user activity and typing status
- **Interruption Handling** - Allow users to interrupt AI responses when appropriate

### User Experience & Design
- **Romantic Dark Theme** - Burgundy, plum, and rose color palettes with deep backgrounds
- **Responsive Design** - Mobile-first approach with proper viewport scaling
- **Visual Hierarchy** - Consistent typography and spacing using slate color system
- **Interactive Elements** - Hover effects, transitions, and romantic glow effects
- **Accessibility** - Screen reader support, keyboard navigation, color contrast

## Technical Stack
- **Framework**: Next.js 15 (React) with TypeScript
- **Styling**: Custom CSS (replaced Tailwind due to configuration issues)
- **Real-Time**: WebSocket client for live interactions
- **State Management**: React Hook Form for character creation
- **Icons**: Emoji-based iconography for personality

## Implemented Features ✅

### Character Management
- ✅ **Character Builder** - 7-section wizard with comprehensive personality configuration
- ✅ **Character Gallery** - Responsive 1-4 column grid with fixed-size avatar thumbnails
- ✅ **Visual Feedback** - Toggle buttons, form validation, and progress indication
- ✅ **Avatar Generation** - DiceBear API integration for consistent character avatars

### Design System
- ✅ **Romantic Theme** - Complete color palette with burgundy/plum/rose accents via custom CSS
- ✅ **Reusable Components** - .btn, .character-card, .card, .form-input semantic classes
- ✅ **Responsive Layout** - Custom CSS Grid: 2-4 columns, fixed 200px image heights
- ✅ **Interactive States** - Hover effects, transitions, and visual feedback
- ✅ **Custom CSS Solution** - Replaced Tailwind with /app/custom.css for reliable styling

### User Interface
- ✅ **Chat Interface** - Romantic-themed messaging with gradient backgrounds
- ✅ **Navigation** - Consistent button styling and section-based navigation
- ✅ **Form Handling** - Comprehensive character creation with trait selection
- ✅ **Error Handling** - Graceful fallbacks and user feedback

## Key Features to Implement

### Real-Time Chat
- **Multiple Character Support** - Character switching and simultaneous conversations
- **Typing Indicators** - "Character is typing..." with romantic styling
- **Message Threading** - Conversation history and context management
- **Voice Integration** - Text-to-speech with character-specific voices

### Advanced Features
- **Session Management** - Save/load/continue conversation sessions
- **Character Profiles** - Detailed character pages with full personality display
- **Environmental Controls** - Time, weather, location settings affecting character behavior
- **Interruption Handling** - User interruption of AI responses based on character tolerance

## Integration Points
- **Backend API**: RESTful endpoints for character/session management
- **WebSocket Server**: Real-time messaging and presence updates
- **Character Engine**: Character state display and interaction controls
- **Session Manager**: Save/load functionality and session history

## Design Specifications

### Custom CSS Architecture (Replaced Tailwind)

**File Location**: `/app/custom.css` - Imported in layout.tsx after globals.css

### Responsive Breakpoints
- **Mobile (default)**: 2 columns, 200px fixed avatar height
- **Tablet (768px+)**: 3 columns, 200px fixed avatar height  
- **Desktop (1024px+)**: 4 columns, 200px fixed avatar height
- **Max card width**: 280px with centering for consistency

### Color System
- **Primary**: Rose (#e11d48) - main actions and accents
- **Secondary**: Purple (#9333ea) - secondary actions
- **Background**: Linear gradient (#0f172a → #1e293b → #374151)
- **Cards**: rgba(15, 23, 42, 0.8) with backdrop-blur
- **Text**: White, #f1f5f9, #cbd5e1, #94a3b8, #64748b for hierarchy

### Component Classes
- **.btn, .btn-primary, .btn-secondary**: Semantic button system with gradients
- **.character-card**: Fixed-size cards with hover scaling and glow effects
- **.character-image**: 200px × 200px containers with overlay text
- **.characters-grid**: CSS Grid responsive layout (2→3→4 columns)
- **.card**: General purpose glass-morphism containers
- **.form-input**: Form inputs with rose focus states and proper placeholder styling
- **.chat-message.user/.character**: Styled message bubbles for conversation
- **.empty-state**: Centered empty states with large emoji icons

### CSS Grid Implementation
```css
.characters-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
@media (min-width: 768px) {
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (min-width: 1024px) {
  grid-template-columns: repeat(4, 1fr);
}
```

### Debugging Notes
- **Tailwind Issues**: Configuration not being applied consistently, custom classes not working
- **Solution**: Complete replacement with semantic custom CSS classes
- **Image Sizing**: Fixed with explicit 200px height and object-fit: cover
- **Grid Layout**: Custom CSS Grid more reliable than Tailwind's responsive classes
- **Performance**: Single CSS file loads faster than Tailwind processing

This module provides a complete, visually cohesive romantic chatbot interface with professional UX patterns and responsive design.