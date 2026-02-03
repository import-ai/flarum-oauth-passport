# OAuth Passport Extension - Development Notes

## Local Development with Docker

The extension is mapped to `/plugin-dev/flarum-oauth-passport` in the Flarum container:

```bash
# Install locally for development (symlinked)
docker exec flarum-dev composer config repositories.oauth-passport path /plugin-dev/flarum-oauth-passport
docker exec flarum-dev composer require "import-ai/flarum-oauth-passport:@dev" -W

# Reset Flarum container (data is not persisted)
docker compose down && docker compose up -d

# Run migrations
docker exec flarum-dev php flarum migrate

# Database queries
docker exec flarum-dev-mariadb mariadb -u flarum -pflarum flarum -e "YOUR SQL QUERY"
```

## Problems Encountered and Solutions

### 1. JavaScript Initializer Not Executing

**Problem:**
The OAuth login button was not appearing in the login modal. The extension's JavaScript code was registered with `app.initializers.add()` but the initializers weren't being started automatically during Flarum's boot process.

**Investigation:**
- Checked browser console - no errors
- Verified `app.forum` attributes were present (enabled=true, loginTitle, loginIcon, etc.)
- Found that `LogInButtons.prototype.items` was not extended (showing original short function)
- The initializer was registered in `app.initializers._items` but `content` was never called

**Solution:**
Changed from using `app.initializers.add()` to immediate execution in `js/forum.js`:

```javascript
// Execute immediately when module loads
function initPassport() {
  if (!app.forum) {
    // If forum data isn't loaded yet, wait and try again
    setTimeout(initPassport, 10);
    return;
  }
  // ... initialization code
}

// Start initialization immediately
initPassport();
```

This ensures the code runs as soon as the module loads, with a retry mechanism if `app.forum` isn't ready yet.

---

### 2. TypeScript Type Annotations in forum.js

**Problem:**
Build failed with error: "Type annotations can only be used in TypeScript files"

**Cause:**
Added TypeScript type annotations to `js/forum.js` which is processed as JavaScript, not TypeScript.

**Solution:**
Removed type annotations from `forum.js`:
```javascript
// Before (error):
function adjustColor(color: string, amount: number): string {

// After (fixed):
function adjustColor(color, amount) {
```

---

### 3. Flarum Version Compatibility

**Problem:**
Initially set `composer.json` requirement to `"flarum/core": "^2.0.0"` but the test environment runs Flarum 1.8.10.

**Solution:**
Downgraded requirement to `"flarum/core": "^1.2.0"` to support Flarum 1.x.

---

### 4. Forum Attributes Not Available During Initialization

**Problem:**
JavaScript code runs before `app.forum` is populated, causing `app.forum.attribute()` calls to fail.

**Solution:**
Added early return with `setTimeout` retry:
```javascript
if (!app.forum) {
  setTimeout(initPassport, 10);
  return;
}
```

---

## Key Implementation Details

### Frontend JavaScript Structure
The `js/forum.js` entry point must be plain JavaScript (not TypeScript) and executes immediately:
- Imports `flarum/forum/app`
- Imports components from `flarum/core.compat`
- Calls `extend()` to modify `LogInButtons.prototype.items`

### Backend Forum Attributes
The `ForumAttributes` extender passes settings to frontend via `ForumSerializer`:
```php
public function __invoke(ForumSerializer $serializer): array
{
    return [
        'importAiOAuthPassport.enabled' => (bool) $this->settings->get('...'),
        // ... other attributes
    ];
}
```

### OAuth Flow
1. User clicks "Login with Passport" button
2. Button navigates to `/auth/passport`
3. `PassportController` redirects to OAuth server authorize endpoint
4. User authenticates on OAuth server
5. OAuth server redirects back to `/auth/passport?code=...`
6. Controller exchanges code for access token
7. Fetches user info and creates/logs in Flarum user

---

## Migration Notes

The extension can migrate data from:
1. **blt950/oauth-generic** - Migrates OAuth provider settings
2. **fof/passport** - Migrates user login provider associations

Run migrations automatically on enable, or manually via:
```bash
docker exec flarum-dev php flarum migrate
```
