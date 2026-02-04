# Flarum OAuth Passport | OAuth2 登录集成

![License](https://img.shields.io/badge/license-MIT-blue.svg) [![Latest Stable Version](https://img.shields.io/packagist/v/import-ai/flarum-oauth-passport.svg)](https://packagist.org/packages/import-ai/flarum-oauth-passport) [![Downloads](https://img.shields.io/packagist/dt/import-ai/flarum-oauth-passport.svg)](https://packagist.org/packages/import-ai/flarum-oauth-passport) ![Flarum](https://img.shields.io/badge/Flarum-1.2%2B-orange.svg)

[English](./README.md) | 简体中文

一个独立的 Flarum 扩展，支持通过 Laravel Passport 或任何 OAuth2 兼容服务器进行 OAuth2 认证。无需依赖 `fof/oauth` - 完全掌控 OAuth 流程，自定义回调路由 `/auth/passport`。

## 功能

- **独立实现**：不依赖 `fof/oauth` - 完全控制 OAuth 流程
- **通用 OAuth2 支持**：兼容 Laravel Passport、Keycloak、Auth0 或任何标准 OAuth2 服务器
- **灵活的用户数据映射**：可配置 ID、显示名和邮箱字段名（支持 JSON 点符号访问嵌套数据）
- **可自定义登录按钮**：设置自定义标题、图标（FontAwesome）、背景色和文字颜色
- **账号关联**：通过 OAuth 提供者 ID 自动关联账号
- **资料同步**：可选在每次登录时同步显示名和邮箱
- **无密码选项**：隐藏默认用户名/密码字段，实现纯 OAuth 认证
- **弹窗配置**：支持全屏弹窗或自定义宽高
- **应用内浏览器支持**：内置微信等应用内浏览器的回退处理机制
- **迁移支持**：无缝从 `blt950/oauth-generic` 和 `fof/passport` 迁移

## 安装

使用 [扩展程序管理器](https://discuss.flarum.org/d/33955) 或通过 composer 手动安装：

```sh
composer require import-ai/flarum-oauth-passport:"*"
```

## 更新

```sh
composer update import-ai/flarum-oauth-passport:"*"
php flarum migrate
php flarum cache:clear
```

## 配置

1. 进入 **管理后台** > **扩展** > **OAuth Passport**
2. 将 **重定向 URL** 复制到 OAuth 服务器的允许重定向 URL 列表中
3. 配置 OAuth 端点和凭证（见下文）

### OAuth 服务器设置

| 设置项 | 说明 |
|--------|------|
| **客户端 ID** | OAuth 应用的客户端 ID |
| **客户端密钥** | OAuth 应用的客户端密钥 |
| **作用域** | 逗号分隔的 OAuth 作用域（默认：`read`） |
| **授权端点** | OAuth 授权 URL（如：`https://auth.example.com/oauth/authorize`） |
| **令牌端点** | OAuth 令牌 URL（如：`https://auth.example.com/oauth/token`） |
| **用户信息端点** | 用户信息 URL（如：`https://auth.example.com/api/user`） |

### 用户数据映射

配置 OAuth 服务器用户信息响应中的字段名：

| 设置项 | 默认值 | 点符号支持 |
|--------|--------|-----------|
| **用户 ID 字段** | `id` | 支持（如：`data.user.id`） |
| **显示名字段** | `name` | 支持（如：`data.name`） |
| **邮箱地址字段** | `email` | 支持（如：`data.email`） |

### 用户注册选项

| 设置项 | 说明 |
|--------|------|
| **强制使用用户 ID 作为用户名** | 使用 OAuth 用户 ID 作为 Flarum 用户名，不允许用户选择 |
| **强制使用显示名** | 使用 OAuth 显示名，不允许用户选择 |
| **强制使用邮箱地址** | 使用 OAuth 邮箱并标记为已验证 |
| **登录时更新显示名** | 每次登录时从 OAuth 服务器同步显示名 |
| **登录时更新邮箱地址** | 每次登录时从 OAuth 服务器同步邮箱 |

### 登录按钮自定义

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| **按钮标题** | "使用 Passport 登录" | 登录按钮上显示的文本 |
| **按钮图标** | `fas fa-passport` | FontAwesome 图标类名 |
| **按钮背景颜色** | `#3B82F6` | 十六进制颜色代码 |
| **按钮文字颜色** | `#ffffff` | 十六进制颜色代码 |

### 弹窗设置

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| **全屏弹窗** | `false` | 使用全屏弹窗进行 OAuth（忽略宽高设置） |
| **弹窗宽度** | `580` | OAuth 弹窗宽度（像素） |
| **弹窗高度** | `400` | OAuth 弹窗高度（像素） |

### 高级选项

- **替换登录/注册按钮**：隐藏默认用户名/密码字段，仅显示 OAuth 按钮

## OAuth 流程

1. 用户点击"使用 Passport 登录"按钮
2. 扩展携带 state 参数重定向到 OAuth 服务器（CSRF 防护）
3. 用户在 OAuth 服务器上完成认证
4. OAuth 服务器重定向回 `/auth/passport?code=xxx&state=xxx`
5. 扩展验证 state 并将授权码交换为访问令牌
6. 扩展获取用户信息并创建/登录 Flarum 用户
7. 可选：派发 `OAuthLoginSuccessful` 事件供自定义处理

## 从其他扩展迁移

本扩展内置迁移支持：
- `blt950/oauth-generic`
- `fof/passport`

只需安装本扩展，现有的 OAuth 关联账号将继续正常工作。

## 事件

扩展在 OAuth 登录成功后派发 `FoF\Extend\Events\OAuthLoginSuccessful` 事件，允许其他扩展执行自定义操作：

```php
use FoF\Extend\Events\OAuthLoginSuccessful;

$events->listen(OAuthLoginSuccessful::class, function (OAuthLoginSuccessful $event) {
    $token = $event->token;        // League\OAuth2\Client 的 AccessToken
    $user = $event->user;          // ResourceOwnerInterface
    $provider = $event->provider;  // 'passport'
    $providerId = $event->providerId;
    $actor = $event->actor;        // 当前用户（未登录时为 null）
});
```

## 应用内浏览器支持

针对微信等会拦截弹窗的环境，扩展包含中间件来检测应用内浏览器，并提供 OAuth 认证完成的回退机制。

## 系统要求

- Flarum 1.2.0 或更高版本
- PHP 7.4 或更高版本
- OAuth2 兼容的身份验证服务器

## 链接

- [Packagist](https://packagist.org/packages/import-ai/flarum-oauth-passport)
- [GitHub](https://github.com/import-ai/flarum-oauth-passport)

