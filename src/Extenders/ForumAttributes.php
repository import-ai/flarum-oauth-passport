<?php

/*
 * This file is part of import-ai/flarum-oauth-passport.
 *
 * Copyright (c) Import AI.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace ImportAI\OAuthPassport\Extenders;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Locale\Translator;
use Flarum\Settings\SettingsRepositoryInterface;

class ForumAttributes
{
    /**
     * @var Translator
     */
    protected $translator;

    /**
     * @var SettingsRepositoryInterface
     */
    protected $settings;

    public function __construct(Translator $translator, SettingsRepositoryInterface $settings)
    {
        $this->translator = $translator;
        $this->settings = $settings;
    }

    public function __invoke(ForumSerializer $serializer): array
    {
        $attributes['importAiOAuthPassport.loginTitle'] = $this->settings->get('import-ai-oauth-passport.button_title')
            ?: $this->translator->trans('import-ai-oauth-passport.api.default-login-button-title');
        $attributes['importAiOAuthPassport.loginIcon'] = $this->settings->get('import-ai-oauth-passport.button_icon')
            ?: 'fas fa-passport';
        $attributes['importAiOAuthPassport.enabled'] = (bool) $this->settings->get('import-ai-oauth-passport.enabled');
        $attributes['importAiOAuthPassport.buttonColor'] = $this->settings->get('import-ai-oauth-passport.button_color')
            ?: '#684ba6';
        $attributes['importAiOAuthPassport.buttonTextColor'] = $this->settings->get('import-ai-oauth-passport.button_text_color')
            ?: '#ffffff';
        $attributes['importAiOAuthPassport.replaceLoginSignup'] = (bool) $this->settings->get('import-ai-oauth-passport.replace_login_signup');
        $attributes['importAiOAuthPassport.fullscreenPopup'] = (bool) $this->settings->get('import-ai-oauth-passport.fullscreen_popup');
        $attributes['importAiOAuthPassport.popupWidth'] = (int) $this->settings->get('import-ai-oauth-passport.popup_width') ?: 580;
        $attributes['importAiOAuthPassport.popupHeight'] = (int) $this->settings->get('import-ai-oauth-passport.popup_height') ?: 400;

        // Also pass as fof-oauth attributes so their popup utility uses our settings
        // This ensures our popup dimensions are used when fof/oauth handles the click
        $attributes['fof-oauth.fullscreenPopup'] = $attributes['importAiOAuthPassport.fullscreenPopup'];
        $attributes['fof-oauth.popupWidth'] = $attributes['importAiOAuthPassport.popupWidth'];
        $attributes['fof-oauth.popupHeight'] = $attributes['importAiOAuthPassport.popupHeight'];

        return $attributes;
    }
}
