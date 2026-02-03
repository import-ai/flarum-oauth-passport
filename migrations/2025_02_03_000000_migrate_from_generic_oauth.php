<?php

/*
 * This file is part of import-ai/flarum-oauth-passport.
 *
 * Copyright (c) Import AI.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Database\Schema\Builder;

return [
    'up' => static function (Builder $schema) {
        $settings = resolve(SettingsRepositoryInterface::class);

        // Check if fof-oauth generic provider settings exist
        $genericEnabled = $settings->get('fof-oauth.generic');

        if ($genericEnabled !== null) {
            // Migrate settings from fof-oauth generic provider to our standalone extension
            $settingMappings = [
                'fof-oauth.generic' => 'import-ai-oauth-passport.enabled',
                'fof-oauth.generic.client_id' => 'import-ai-oauth-passport.client_id',
                'fof-oauth.generic.client_secret' => 'import-ai-oauth-passport.client_secret',
                'fof-oauth.generic.scopes' => 'import-ai-oauth-passport.scopes',
                'fof-oauth.generic.authorization_endpoint' => 'import-ai-oauth-passport.authorization_endpoint',
                'fof-oauth.generic.token_endpoint' => 'import-ai-oauth-passport.token_endpoint',
                'fof-oauth.generic.user_information_endpoint' => 'import-ai-oauth-passport.user_information_endpoint',
                'fof-oauth.generic.id_parameter' => 'import-ai-oauth-passport.id_parameter',
                'fof-oauth.generic.display_name_parameter' => 'import-ai-oauth-passport.display_name_parameter',
                'fof-oauth.generic.email_address_parameter' => 'import-ai-oauth-passport.email_address_parameter',
                'fof-oauth.generic.force_userid' => 'import-ai-oauth-passport.force_userid',
                'fof-oauth.generic.force_name' => 'import-ai-oauth-passport.force_name',
                'fof-oauth.generic.force_email' => 'import-ai-oauth-passport.force_email',
            ];

            foreach ($settingMappings as $oldKey => $newKey) {
                $value = $settings->get($oldKey);
                if ($value !== null) {
                    $settings->set($newKey, $value);
                }
            }

            // Migrate login_providers records from 'generic' to 'passport'
            $schema->getConnection()->table('login_providers')
                ->where('provider', 'generic')
                ->update(['provider' => 'passport']);
        }

        // Also check for fof-passport settings (if migrating from fof/passport)
        $fofPassportAppId = $settings->get('fof-passport.app_id');
        if ($fofPassportAppId !== null && $settings->get('import-ai-oauth-passport.client_id') === null) {
            // Migrate from fof/passport
            $settings->set('import-ai-oauth-passport.enabled', true);
            $settings->set('import-ai-oauth-passport.client_id', $fofPassportAppId);
            $settings->set('import-ai-oauth-passport.client_secret', $settings->get('fof-passport.app_secret'));
            $settings->set('import-ai-oauth-passport.scopes', $settings->get('fof-passport.app_oauth_scopes'));
            $settings->set('import-ai-oauth-passport.authorization_endpoint', $settings->get('fof-passport.app_auth_url'));
            $settings->set('import-ai-oauth-passport.token_endpoint', $settings->get('fof-passport.app_token_url'));
            $settings->set('import-ai-oauth-passport.user_information_endpoint', $settings->get('fof-passport.app_user_url'));
            $settings->set('import-ai-oauth-passport.id_parameter', 'id');
            $settings->set('import-ai-oauth-passport.display_name_parameter', 'name');
            $settings->set('import-ai-oauth-passport.email_address_parameter', 'email');

            // Migrate login_providers records from 'passport' (fof/passport uses 'passport' as provider name)
            // They already use 'passport', so no need to update
        }
    },

    'down' => static function (Builder $schema) {
        // Down migration is optional - we don't revert to avoid data loss
        // But we can disable the extension
        $settings = resolve(SettingsRepositoryInterface::class);
        $settings->set('import-ai-oauth-passport.enabled', false);
    },
];
