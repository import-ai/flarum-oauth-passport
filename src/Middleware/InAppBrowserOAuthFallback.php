<?php

namespace ImportAI\OAuthPassport\Middleware;

use Flarum\Http\UrlGenerator;
use Flarum\Settings\SettingsRepositoryInterface;
use Laminas\Diactoros\Response\HtmlResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class InAppBrowserOAuthFallback implements MiddlewareInterface
{
    protected UrlGenerator $url;
    protected SettingsRepositoryInterface $settings;

    public function __construct(UrlGenerator $url, SettingsRepositoryInterface $settings)
    {
        $this->url = $url;
        $this->settings = $settings;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $response = $handler->handle($request);

        // Only process OAuth callback responses
        if (!$this->isOAuthCallback($request)) {
            return $response;
        }

        // Only apply fallback for in-app browsers (WeChat, etc.)
        // Normal browsers handle window.opener correctly - don't interfere
        if (!$this->isInAppBrowser($request)) {
            return $response;
        }

        // Only process HTML responses
        $contentType = $response->getHeaderLine('Content-Type');
        if (stripos($contentType, 'text/html') === false && $contentType !== '') {
            return $response;
        }

        // Get response body
        try {
            $body = (string) $response->getBody();
        } catch (\Exception $e) {
            return $response;
        }

        // Check if this is an OAuth completion response
        if (!$this->isOAuthCompletionResponse($body)) {
            return $response;
        }

        // Extract payload and generate redirect response
        return $this->generateRedirectResponse($body, $response);
    }

    protected function isOAuthCallback(ServerRequestInterface $request): bool
    {
        $path = $request->getUri()->getPath();
        $queryParams = $request->getQueryParams();

        // Check if path contains /auth/ and has code parameter
        return (strpos($path, '/auth/') !== false) && isset($queryParams['code']);
    }

    protected function isInAppBrowser(ServerRequestInterface $request): bool
    {
        $userAgent = $request->getHeaderLine('User-Agent');
        $lowerAgent = strtolower($userAgent);

        // WeChat (MicroMessenger)
        if (strpos($lowerAgent, 'micromessenger') !== false) {
            return true;
        }

        // Other common in-app browsers
        $inAppPatterns = [
            'weibo',           // Weibo
            'qq/',             // QQ browser in-app
            'mqqbrowser',      // QQ browser
            'alipay',          // Alipay
            'dingtalk',        // DingTalk
            'tiktok',          // TikTok/Douyin
            'bytedance',       // ByteDance apps
            'instagram',       // Instagram
            'fb_iab',          // Facebook in-app browser
            'fb_an',           // Facebook Android
            'twitter',         // Twitter/X
            'line/',           // LINE
            'snapchat',        // Snapchat
        ];

        foreach ($inAppPatterns as $pattern) {
            if (strpos($lowerAgent, $pattern) !== false) {
                return true;
            }
        }

        // Check for WebView indicators
        if (strpos($lowerAgent, 'wv') !== false || strpos($lowerAgent, 'webview') !== false) {
            if (strpos($lowerAgent, 'chrome/') === false && strpos($lowerAgent, 'safari/') === false) {
                return true;
            }
        }

        return false;
    }

    protected function isOAuthCompletionResponse(string $body): bool
    {
        // Check for authenticationComplete or linkingComplete in the response
        return (strpos($body, 'authenticationComplete') !== false) ||
               (strpos($body, 'linkingComplete') !== false);
    }

    protected function generateRedirectResponse(string $body, ResponseInterface $response): ResponseInterface
    {
        // Extract the payload from the JavaScript
        $payload = $this->extractPayload($body);
        $baseUrl = $this->url->to('forum')->base();

        // Check if this is a new user registration (has token but no loggedIn flag)
        $isNewUser = isset($payload['token']) && empty($payload['loggedIn']);

        if ($isNewUser) {
            // For new users, redirect with oauth_token to trigger signup modal
            $redirectUrl = $baseUrl . '?oauth_token=' . urlencode($payload['token']);
        } else {
            // For existing users, just redirect to homepage (they're already logged in via cookie)
            $redirectUrl = $baseUrl;
        }

        $html = $this->buildRedirectHtml($redirectUrl, $isNewUser);

        // Preserve important headers from original response (especially Set-Cookie)
        $headers = [];
        $cookieHeaders = $response->getHeader('Set-Cookie');
        if (!empty($cookieHeaders)) {
            $headers['Set-Cookie'] = $cookieHeaders;
        }

        return new HtmlResponse($html, 200, $headers);
    }

    protected function extractPayload(string $body): array
    {
        // Try to extract JSON payload from authenticationComplete or linkingComplete call
        // Use balanced group matching to handle nested JSON objects
        if (preg_match('/(?:authenticationComplete|linkingComplete)\s*\(\s*(\{.*\})\s*\)/s', $body, $matches)) {
            $json = $matches[1];
            // Validate it's proper JSON by decoding
            $payload = json_decode($json, true);
            if (is_array($payload) && json_last_error() === JSON_ERROR_NONE) {
                return $payload;
            }
        }

        return [];
    }

    protected function buildRedirectHtml(string $redirectUrl, bool $isNewUser): string
    {
        $messageNewUser = 'Authentication successful. Redirecting to complete registration...';
        $messageExistingUser = 'Authentication successful. Redirecting...';
        $manualLink = 'Click here if not redirected';

        $message = $isNewUser ? $messageNewUser : $messageExistingUser;

        // Get configured button color from settings (default to blue if not set)
        $buttonColor = $this->settings->get('import-ai-oauth-passport.button_color', '#3B82F6');
        $buttonTextColor = $this->settings->get('import-ai-oauth-passport.button_text_color', '#ffffff');

        // Sanitize color values
        $buttonColor = htmlspecialchars($buttonColor, ENT_QUOTES, 'UTF-8');
        $buttonTextColor = htmlspecialchars($buttonTextColor, ENT_QUOTES, 'UTF-8');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Successful</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #ffffff;
            padding: 20px;
        }
        .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px 30px;
            text-align: center;
            max-width: 360px;
            width: 100%;
        }
        .checkmark {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: {$buttonColor};
        }
        .message {
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
            color: #333;
            line-height: 1.5;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0,0,0,0.1);
            border-top-color: {$buttonColor};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .manual-link a {
            display: inline-block;
            background: {$buttonColor};
            color: {$buttonTextColor};
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            transition: opacity 0.2s;
        }
        .manual-link a:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="checkmark">&#10003;</div>
        <div class="message">{$message}</div>
        <div class="spinner"></div>
        <div class="manual-link">
            <a href="{$redirectUrl}">{$manualLink}</a>
        </div>
    </div>
    <script>
        (function() {
            var redirectUrl = '{$redirectUrl}';
            // Attempt immediate redirect
            window.location.href = redirectUrl;
            // Fallback: try again after delay
            setTimeout(function() {
                window.location.href = redirectUrl;
            }, 2000);
        })();
    </script>
</body>
</html>
HTML;
    }
}
