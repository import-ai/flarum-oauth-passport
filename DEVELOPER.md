# Flarum OAuth Password

This file provides guidance to developers when working with code in this repository.

## Overview

This is a **standalone** Flarum extension that enables OAuth2 authentication via Laravel Passport (or any OAuth2-compatible server). It does **NOT** require `fof/oauth` and provides full control over the OAuth callback route at `/auth/passport`.

## Build Commands

### Frontend (JavaScript/TypeScript)

All frontend build commands run from the `js/` directory:

```bash
cd js/

# Development build with watch
npm run dev

# Production build
npm run build
```

## Architecture

### Backend (PHP)

**Extender Pattern** (`extend.php`):
- Uses Flarum's declarative extender system
- `Extend\Routes('forum')` registers the custom OAuth callback route at `/auth/passport`
- `Extend\ApiSerializer` passes settings to frontend via `ForumAttributes` extender
- Settings use prefix `import-ai-oauth-passport.`

**OAuth Flow** (`src/Controllers/PassportController.php`):
1. User navigates to `/auth/passport` (no code)
2. Controller redirects to OAuth server with state parameter (CSRF protection)
3. OAuth server redirects back to `/auth/passport?code=xxx&state=xxx`
4. Controller validates state, exchanges code for access token
5. Fetches user info and creates/logs in Flarum user via `ResponseFactory`

**Provider Implementation** (`src/Providers/PassportProvider.php`):
- Extends League's `AbstractProvider`
- Uses `BearerAuthorizationTrait`
- Endpoints (authorize, token, user info) are configurable via settings
- Supports dot notation for nested user data fields (e.g., `data.user.id`)

### Frontend (JavaScript)

**Critical Pattern - Immediate Execution** (`js/forum.js`):
The forum entry point executes **immediately**, not via `app.initializers.add()`. This is required because Flarum's initializer system doesn't reliably start custom initializers:

```javascript
// Execute immediately when module loads
function initPassport() {
  if (!app.forum) {
    setTimeout(initPassport, 10);  // Retry if forum not ready
    return;
  }
  // ... initialization code
}
initPassport();
```

**Admin Panel** (`js/src/admin/index.ts`):
- Uses standard `app.initializers.add()` pattern
- Registers settings via `app.extensionData.for('import-ai-oauth-passport').registerSetting()`

**Component Extension**:
- Uses `extend(LogInButtons.prototype, 'items', ...)` to add the OAuth button
- Dynamically injects CSS for button colors based on admin settings
- Can hide password login fields if `disablePasswordLogin` is enabled

### Settings Schema

All settings use the prefix `import-ai-oauth-passport.`:

| Setting | Type | Description |
|---------|------|-------------|
| `enabled` | boolean | Enable OAuth login |
| `client_id`, `client_secret` | text | OAuth credentials |
| `scopes` | text | Comma-separated OAuth scopes |
| `authorization_endpoint`, `token_endpoint`, `user_information_endpoint` | text | OAuth server URLs |
| `id_parameter`, `display_name_parameter`, `email_address_parameter` | text | JSON field names (supports dot notation) |
| `force_userid`, `force_name`, `force_email` | boolean | Force provider values vs. suggest |
| `update_display_name`, `update_email` | boolean | Update on subsequent logins |
| `disable_password_login` | boolean | Hide username/password fields |
| `button_title`, `button_icon`, `button_color`, `button_text_color` | text | UI customization |

### Frontend Attributes

Settings are exposed to frontend via `ForumAttributes` with camelCase keys:
- `importAiOAuthPassport.enabled`
- `importAiOAuthPassport.loginTitle`
- `importAiOAuthPassport.loginIcon`
- `importAiOAuthPassport.buttonColor`
- `importAiOAuthPassport.buttonTextColor`
- `importAiOAuthPassport.disablePasswordLogin`

## Key Implementation Details

1. **forum.js must be plain JavaScript** - not TypeScript (entry point files cannot have type annotations)

2. **Admin uses TypeScript** - source files in `js/src/` are TypeScript, compiled to `js/dist/`

3. **Dot notation support** - User data field names support nested JSON (e.g., `data.user.id`)

4. **Migration support** - Can migrate from `blt950/oauth-generic` and `fof/passport` via `migrations/`

5. **State validation** - OAuth state parameter stored in session (`oauth2state`) for CSRF protection

## Git Commit Guidelines

**Format**: `type(scope): Description`

**Types**:

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Styling changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Test additions or changes
- `chore` - Maintenance tasks
- `revert` - Revert previous commits
- `build` - Build system changes

**Rules**:

- Scope is required (e.g., `sidebar`, `tasks`, `auth`)
- Description in sentence case with capital first letter
- Use present tense action verbs (Add, Fix, Support, Update, Replace, Optimize)
- No period at the end
- Keep it concise and focused

**Examples**:

```
feat(apple): Support apple signin
fix(sidebar): Change the abnormal scrolling
chore(children): Optimize children api
refactor(tasks): Add timeout status
```

**Do NOT include**:

- "Generated with Claude Code" or similar attribution
- "Co-Authored-By: Claude" or any Claude co-author tags

