# Git Branching Strategy

## Branch Structure

### Main Branches
- **`main`** - Production-ready code only. Protected branch.
- **`develop`** - Integration branch for features. Daily development work.

### Supporting Branches
- **`feature/*`** - New features or enhancements
- **`bugfix/*`** - Bug fixes
- **`hotfix/*`** - Critical production fixes
- **`release/*`** - Preparing new releases

## Workflow

### Daily Development
```bash
# Always start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/character-memory-system
# or
git checkout -b bugfix/chat-websocket-disconnect

# Work on your feature...
git add .
git commit -m "Add character memory persistence"

# Push feature branch
git push -u origin feature/character-memory-system
```

### Feature Integration
```bash
# When feature is complete, merge to develop
git checkout develop
git pull origin develop
git merge feature/character-memory-system
git push origin develop

# Delete feature branch
git branch -d feature/character-memory-system
git push origin --delete feature/character-memory-system
```

### Releases
```bash
# Create release branch from develop
git checkout develop
git checkout -b release/v1.0.0

# Final testing, version bumps, documentation
git commit -m "Prepare release v1.0.0"

# Merge to main
git checkout main
git merge release/v1.0.0
git tag v1.0.0
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/v1.0.0
```

## Branch Naming Conventions

### Features
- `feature/native-arrays-migration`
- `feature/multi-character-chat`
- `feature/vector-memory-search`
- `feature/character-voice-system`

### Bug Fixes
- `bugfix/websocket-reconnection`
- `bugfix/character-traits-validation`
- `bugfix/frontend-mobile-responsive`

### Hotfixes
- `hotfix/security-vulnerability`
- `hotfix/database-connection-leak`

### Current Feature Ideas
- `feature/relationship-progression-tracking`
- `feature/emotional-memory-weighting`
- `feature/character-personality-evolution`
- `feature/session-save-restore`
- `feature/multi-user-support`

## Commit Message Format

```
type: brief description

Longer explanation if needed.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Build/tool changes

## Current Status
- **main** - Initial release with native arrays ✅
- **develop** - Active development branch (current)
- Ready for feature branch creation