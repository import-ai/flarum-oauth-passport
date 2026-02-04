# Flarum OAuth Passport

![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg) ![Latest Stable Version](https://img.shields.io/packagist/v/import-ai/flarum-oauth-passport.svg?style=flat-square) ![Total Downloads](https://img.shields.io/packagist/dt/import-ai/flarum-oauth-passport.svg?style=flat-square) ![Flarum](https://img.shields.io/badge/Flarum-1.2%2B-orange.svg)

English | [简体中文](./README_zh.md)

A standalone Flarum extension that enables OAuth2 authentication via Laravel Passport or any OAuth2-compatible server. No `fof/oauth` dependency required - full control over the OAuth flow with a custom callback route at `/auth/passport`.

![screenshot](https://github.com/LucienShui/picx-images-hosting/raw/master/SCR-20260204-sqfk-3.1vz60p2wdq.webp)

## Features

- **Standalone Implementation**: No dependency on `fof/oauth` - complete control over the OAuth flow
- **Universal OAuth2 Support**: Works with Laravel Passport, Keycloak, Auth0, or any standard OAuth2 server
- **Flexible User Data Mapping**: Configure field names for ID, display name, and email (supports dot notation for nested JSON)
- **Customizable Login Button**: Set custom title, icon (FontAwesome), background color, and text color
- **Account Linking**: Automatic account linking via OAuth provider ID
- **Profile Synchronization**: Optionally update display name and email on subsequent logins
- **Passwordless Option**: Hide default username/password fields for pure OAuth authentication
- **Popup Configuration**: Fullscreen popup or custom width/height for OAuth window
- **In-App Browser Support**: Built-in fallback for WeChat and other in-app browsers
- **Migration Support**: Seamless migration from `blt950/oauth-generic` and `fof/passport`

## Installation

```bash
composer require import-ai/flarum-oauth-passport
```

## Upgrade

```bash
composer update import-ai/flarum-oauth-passport
php flarum migrate
php flarum cache:clear
```

## Configuration

1. Navigate to **Administration** > **Extensions** > **OAuth Passport**
2. Copy the **Redirect URL** to your OAuth server's allowed redirect URLs
3. Configure OAuth endpoints and credentials (see below)

### OAuth Server Settings

| Setting | Description |
|---------|-------------|
| **Client ID** | Your OAuth application client ID |
| **Client Secret** | Your OAuth application client secret |
| **Scopes** | Comma-separated OAuth scopes (default: `read`) |
| **Authorization Endpoint** | OAuth authorize URL (e.g., `https://auth.example.com/oauth/authorize`) |
| **Token Endpoint** | OAuth token URL (e.g., `https://auth.example.com/oauth/token`) |
| **User Information Endpoint** | User info URL (e.g., `https://auth.example.com/api/user`) |

### User Data Mapping

Configure the field names from your OAuth server's user info response:

| Setting | Default | Dot Notation Support |
|---------|---------|---------------------|
| **User ID Field** | `id` | Yes (e.g., `data.user.id`) |
| **Display Name Field** | `name` | Yes (e.g., `data.name`) |
| **Email Address Field** | `email` | Yes (e.g., `data.email`) |

### User Registration Options

| Setting | Description |
|---------|-------------|
| **Force User ID as Username** | Use OAuth user ID as Flarum username instead of allowing user to choose |
| **Force Display Name** | Use OAuth display name instead of allowing user to choose |
| **Force Email Address** | Use OAuth email and mark as verified |
| **Update Display Name on Login** | Sync display name from OAuth server on each login |
| **Update Email on Login** | Sync email from OAuth server on each login |

### Login Button Customization

| Setting | Default | Description |
|---------|---------|-------------|
| **Button Title** | "Login with Passport" | Text displayed on the login button |
| **Button Icon** | `fas fa-passport` | FontAwesome icon class |
| **Button Background Color** | `#3B82F6` | Hex color code |
| **Button Text Color** | `#ffffff` | Hex color code |

### Popup Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Fullscreen Popup** | `false` | Use fullscreen popup for OAuth (ignores width/height) |
| **Popup Width** | `580` | OAuth popup window width in pixels |
| **Popup Height** | `400` | OAuth popup window height in pixels |

### Advanced Options

- **Replace Login/Signup Buttons**: Hide default username/password fields and show only the OAuth button

## OAuth Flow

1. User clicks "Login with Passport" button
2. Extension redirects to OAuth server with state parameter (CSRF protection)
3. User authenticates on OAuth server
4. OAuth server redirects back to `/auth/passport?code=xxx&state=xxx`
5. Extension validates state and exchanges code for access token
6. Extension fetches user info and creates/logs in Flarum user
7. Optional: Dispatches `OAuthLoginSuccessful` event for custom handling

## Migration from Other Extensions

This extension includes built-in migrations for:
- `blt950/oauth-generic`
- `fof/passport`

Simply install this extension and existing OAuth-linked accounts will continue to work.

## Events

The extension dispatches `FoF\Extend\Events\OAuthLoginSuccessful` after a successful OAuth login, allowing other extensions to perform custom actions:

```php
use FoF\Extend\Events\OAuthLoginSuccessful;

$events->listen(OAuthLoginSuccessful::class, function (OAuthLoginSuccessful $event) {
    $token = $event->token;        // AccessToken from League\OAuth2\Client
    $user = $event->user;          // ResourceOwnerInterface
    $provider = $event->provider;  // 'passport'
    $providerId = $event->providerId;
    $actor = $event->actor;        // Current user (null if guest)
});
```

## In-App Browser Support

For environments like WeChat where popups are blocked, the extension includes middleware that detects in-app browsers and provides a fallback mechanism for completing OAuth authentication.

## Requirements

- Flarum 1.2.0 or higher
- PHP 7.4 or higher
- An OAuth2-compatible authentication server

## Links

- [GitHub](https://github.com/import-ai/flarum-oauth-passport)
- [Packagist](https://packagist.org/packages/import-ai/flarum-oauth-passport)

