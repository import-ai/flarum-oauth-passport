<?php

/*
 * This file is part of import-ai/flarum-oauth-passport.
 *
 * Copyright (c) Import AI.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace ImportAI\OAuthPassport\Listeners;

use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\LoginProvider;
use Flarum\User\User;
use Flarum\User\UserValidator;
use FoF\Extend\Events\OAuthLoginSuccessful;
use Illuminate\Contracts\Events\Dispatcher;

class UpdateUserOnLogin
{
    /**
     * @var SettingsRepositoryInterface
     */
    protected $settings;

    /**
     * @var Dispatcher
     */
    protected $events;

    public function __construct(SettingsRepositoryInterface $settings, Dispatcher $events)
    {
        $this->settings = $settings;
        $this->events = $events;
    }

    public function handle(OAuthLoginSuccessful $event): void
    {
        // Only handle passport provider events
        if ($event->providerName !== 'passport') {
            return;
        }

        // Find the login provider record
        $provider = LoginProvider::where('provider', $event->providerName)
            ->where('identifier', $event->identifier)
            ->first();

        if (!$provider) {
            return;
        }

        // Find the associated user
        $user = User::find($provider->user_id);

        if (!$user) {
            return;
        }

        $this->updateDisplayName($event, $user);
        $this->updateEmail($event, $user);
    }

    /**
     * Update the user's display name if the setting is enabled and name has changed.
     */
    protected function updateDisplayName(OAuthLoginSuccessful $event, User $user): void
    {
        if (!(bool) $this->settings->get('import-ai-oauth-passport.update_display_name')) {
            return;
        }

        $userResource = $event->userResource;

        // Get the name from the resource owner
        $newName = null;
        if (method_exists($userResource, 'getName')) {
            $newName = $userResource->getName();
        }

        // If no name method or empty name, try to get from response data
        if (empty($newName)) {
            $data = $userResource->toArray();
            $nameField = $this->settings->get('import-ai-oauth-passport.display_name_parameter', 'name');
            $newName = $data[$nameField] ?? null;
        }

        if (empty($newName)) {
            return;
        }

        // Get current display name
        $currentName = $user->display_name;

        // Only update if the name has changed
        if ($currentName !== $newName) {
            $user->nickname = $newName;
            $user->save();

            // Dispatch any events released by the user model
            foreach ($user->releaseEvents() as $releasedEvent) {
                $this->events->dispatch($releasedEvent);
            }
        }
    }

    /**
     * Update the user's email if the setting is enabled and email has changed.
     */
    protected function updateEmail(OAuthLoginSuccessful $event, User $user): void
    {
        if (!(bool) $this->settings->get('import-ai-oauth-passport.update_email')) {
            return;
        }

        $userResource = $event->userResource;

        // Get the email from the resource owner
        $newEmail = null;
        if (method_exists($userResource, 'getEmail')) {
            $newEmail = $userResource->getEmail();
        }

        // If no email method or empty email, try to get from response data
        if (empty($newEmail)) {
            $data = $userResource->toArray();
            $emailField = $this->settings->get('import-ai-oauth-passport.email_address_parameter', 'email');
            $newEmail = $data[$emailField] ?? null;
        }

        if (empty($newEmail)) {
            return;
        }

        // Only update if email has changed
        if ($user->email !== $newEmail) {
            $validator = resolve(UserValidator::class);
            $validator->setUser($user);
            $validator->assertValid(['email' => $newEmail]);

            $user->changeEmail($newEmail);
            $user->save();

            // Dispatch any events released by the user model
            foreach ($user->releaseEvents() as $releasedEvent) {
                $this->events->dispatch($releasedEvent);
            }
        }
    }
}
