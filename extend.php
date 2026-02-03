<?php

/*
 * This file is part of import-ai/flarum-oauth-passport.
 *
 * Copyright (c) Import AI.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace ImportAI\OAuthPassport;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Extend;
use FoF\Extend\Events\OAuthLoginSuccessful;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js'),

    new Extend\Locales(__DIR__.'/locale'),

    // Custom OAuth callback route - gives you full control over the page
    (new Extend\Routes('forum'))
        ->get('/auth/passport', 'import-ai-oauth-passport.auth', Controllers\PassportController::class),

    // Pass settings to frontend
    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attributes(Extenders\ForumAttributes::class),

    // Default settings
    (new Extend\Settings())
        ->default('import-ai-oauth-passport.enabled', false)
        ->default('import-ai-oauth-passport.force_userid', false)
        ->default('import-ai-oauth-passport.force_name', false)
        ->default('import-ai-oauth-passport.force_email', false)
        ->default('import-ai-oauth-passport.update_display_name', false)
        ->default('import-ai-oauth-passport.update_email', false)
        ->default('import-ai-oauth-passport.replace_login_signup', false)
        ->default('import-ai-oauth-passport.button_color', '#3B82F6')
        ->default('import-ai-oauth-passport.button_text_color', '#ffffff'),

    // Event listeners
    (new Extend\Event())
        ->listen(OAuthLoginSuccessful::class, Listeners\UpdateUserOnLogin::class),

    // Middleware for in-app browser OAuth fallback (WeChat, etc.)
    (new Extend\Middleware('forum'))
        ->add(Middleware\InAppBrowserOAuthFallback::class),
];
