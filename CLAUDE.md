# CLAUDE.md - CharacterEngine Project

**CRITICAL**: This file contains instructions you must follow. You are forgetful, so reference these patterns frequently and ask to re-read this file if you deviate from these standards. Always update the Current Development Status section in this file with what was accomplished during your last action.

## Project Plan & Main Tools
@PROJECT_PLAN.md
@BRANCHING_STRATEGY.md

## Database Schema Reference
@CURRENT_SUPABASE_SCHEMA.md
@DEVELOPMENT_WORKFLOWS.md
@TROUBLESHOOTING.md
@TYPESCRIPT_INTERFACES.md
@API_TRANSFORMATION.md

## Project Overview

CharacterEngine: A sophisticated AI-powered character interaction framework with dynamic multi-character management, persistent memory, and intelligent character interactions. Primarily designed for romantic companions but adaptable to any character-based conversational AI application. **Status: AI-First Migration Complete ✅**

**Tech Stack**: Next.js + Tailwind CSS, **✅ COMPLETED** Hono + Bun + TypeScript, **✅ COMPLETED** Supabase + pgvector (Pure), Ollama v0.9.0 (local LLM)

## ⚙️ **CRITICAL: Frontend Utility System** 

**ALWAYS use the utility functions** - never recreate functionality that already exists!

### **📍 Import Paths & Usage**
```typescript
// Main utilities (most common)
import { truncateText, getCharacterAvatar, getSettingImage } from '@/utils/helpers';

// Specific utilities
import { formatRelativeTime, capitalize } from '@/utils/text';
import { createSearchFilter, sortByRelevance, debounce } from '@/utils/search';
import { apiGet, apiPost, charactersApi, settingsApi } from '@/utils/api';
import { validators, characterValidators } from '@/utils/validation';
import { useScrollCarousel, useSelection, useToggle } from '@/hooks/ui-state';
```

### **🚨 MANDATORY Patterns - Use Instead of Custom Code**

#### **Text Operations**
```typescript
// ✅ ALWAYS use utility
const title = truncateText(character.name, 20);
const timeAgo = formatRelativeTime(character.createdAt);

// ❌ NEVER recreate manually
const title = character.name.length > 20 ? character.name.substring(0, 20) + '...' : character.name;
```

#### **Image Handling**
```typescript
// ✅ ALWAYS use utilities (handles fallbacks automatically)
const avatar = getCharacterAvatar(character);  // Uses imageUrl or generates fallback
const settingImg = getSettingImage(setting);   // Uses imageUrl or themed fallback

// ❌ NEVER manually construct image URLs
const avatar = character.imageUrl || `https://api.dicebear.com/...`;
```

#### **API Calls**
```typescript
// ✅ ALWAYS use standardized API utilities
const response = await apiGet('/api/characters');
if (response.success) {
  setCharacters(response.data);
} else {
  console.error(response.error);
}

// ✅ Or use pre-configured clients
const characters = await charactersApi.list({ limit: 10 });
await charactersApi.delete(characterId);

// ❌ NEVER use raw fetch without error handling
const response = await fetch('/api/characters');
const data = await response.json(); // No error handling!
```

#### **Search & Filtering**
```typescript
// ✅ ALWAYS use reusable search utilities
const searchFilter = createSearchFilter(['name', 'archetype'], searchTerm);
const filteredItems = items.filter(searchFilter);

// ❌ NEVER duplicate search logic
const filtered = items.filter(item => 
  item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
  item.archetype.toLowerCase().includes(searchTerm.toLowerCase())
);
```

#### **UI State Management**
```typescript
// ✅ ALWAYS use hooks for complex state
const { selectedIds, toggleSelection, selectAll } = useSelection(characters);
const { visibleItems, scrollLeft, scrollRight } = useScrollCarousel(items, 3);

// ❌ NEVER recreate selection/carousel logic manually
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
// ... manual selection logic
```

#### **Form Validation**
```typescript
// ✅ ALWAYS use validation utilities
const { isValid, errors } = validateObject(formData, characterFormSchema);
const nameResult = characterValidators.name(characterName);

// ❌ NEVER write custom validation
if (!characterName || characterName.length < 2) { ... }
```

### **🎯 Available Utility Categories**

1. **Text Utils** (`/utils/text.ts`): truncateText, formatRelativeTime, capitalize, getInitials, slugify
2. **Image Utils** (`/utils/images.ts`): getCharacterAvatar, getSettingImage, validateImageFile, getGradientBackground
3. **Search Utils** (`/utils/search.ts`): createSearchFilter, sortByRelevance, debounce, fuzzySearch
4. **API Utils** (`/utils/api.ts`): apiGet, apiPost, apiPut, apiDelete, charactersApi, settingsApi, locationsApi
5. **Validation Utils** (`/utils/validation.ts`): validators, characterValidators, settingValidators, validateObject
6. **UI Hooks** (`/hooks/ui-state.ts`): useScrollCarousel, useSelection, useToggle, useModal, usePagination

### **🔧 Field Name Standards (Database ↔ Frontend)**

**API Layer automatically transforms:**
- Database: `image_url`, `setting_type`, `created_at` (snake_case)
- Frontend: `imageUrl`, `settingType`, `createdAt` (camelCase)

**ALWAYS use camelCase in frontend code - API handles transformation!**

### **📚 Documentation Location**
Full utility guide: `/frontend/app/utils/UTILITIES_GUIDE.md`

**Remember: If you find yourself writing utility-like code, CHECK THE UTILITIES FIRST!**

## 🔥 **CURRENT DEVELOPMENT PRIORITIES** 

**Status**: Codebase Analysis Complete - Issues Identified (2025-06-10)

### **🚨 Critical Issues (High Priority)**
1. **Character Builder Edit Mode Broken** - Field mapping uses snake_case instead of camelCase  
   `Location`: `/frontend/app/character-builder/page.tsx:129-162`
2. **Settings Page Non-Functional** - Only redirects to library, no actual functionality  
   `Location`: `/frontend/app/settings/page.tsx`
3. **API Response Inconsistencies** - Some endpoints don't align with frontend expectations

### **🔧 Missing Components (Medium Priority)**
4. **SafeImage Component** - Image fallback logic repeated across multiple files
5. **LoadingSpinner Component** - Loading states duplicated everywhere
6. **ErrorCard Component** - Error handling patterns repeated
7. **ConfirmationModal Usage** - Exists but not used, inline dialogs instead

### **⚠️ CLAUDE.md Utility Violations (Low Priority)**
8. **Characters Page Manual truncateText** - Should use utility function
9. **Date Formatting Duplication** - Should use `formatRelativeTime` utility  
10. **Manual Image Fallback Logic** - Should use helper functions

### **✅ Database Schema Status**
- Schema files updated to match actual Supabase database ✅
- PostgreSQL arrays working correctly ✅
- Backend camelCase transformation working ✅
- All foreign key relationships functional ✅

**Status**: Critical Issues Fixed ✅ (2025-06-10)

### **✅ COMPLETED Critical Issues**
1. ✅ **Character Builder Edit Mode Fixed** - All field mapping now uses camelCase
2. ✅ **Settings Page Functional** - Implemented full settings management with LibraryTemplate
3. ✅ **API Response Consistency** - All endpoints now properly transform snake_case → camelCase

**Next Action**: Complete medium priority component abstractions (Issue #4-7)

## Memories

- When pushing to github, you will add and commit for me and then instruct me to use git push origin main myself because it doesn't seem to let you do it.
- Sudo password: yurikml2
- When we need to alter the supabase database you can write the query in your response and I'll enter it for you. Provide a link to the supabase dashboard for this project to make it easy for me (https://supabase.com/dashboard/project/kkikyuztsgryqxrpbree)
- this project uses bun not npm