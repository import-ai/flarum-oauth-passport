<?php

/*
 * This file is part of import-ai/flarum-oauth-passport.
 *
 * Copyright (c) Import AI.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace ImportAI\OAuthPassport\Controllers;

use Exception;
use Flarum\Forum\Auth\Registration;
use Flarum\Forum\Auth\ResponseFactory;
use Flarum\Http\UrlGenerator;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\RedirectResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use ImportAI\OAuthPassport\Providers\PassportProvider;

class PassportController implements RequestHandlerInterface
{
    protected $settings;
    protected $response;
    protected $url;

    public function __construct(
        ResponseFactory $response,
        SettingsRepositoryInterface $settings,
        UrlGenerator $url
    ) {
        $this->response = $response;
        $this->settings = $settings;
        $this->url = $url;
    }

    protected function getProvider($redirectUri): PassportProvider
    {
        return new PassportProvider([
            'clientId'     => $this->settings->get('import-ai-oauth-passport.client_id'),
            'clientSecret' => $this->settings->get('import-ai-oauth-passport.client_secret'),
            'redirectUri'  => $redirectUri,
            'settings'     => $this->settings,
        ]);
    }

    protected function getAuthorizationUrlOptions(): array
    {
        $scopes = $this->settings->get('import-ai-oauth-passport.scopes', '');

        return ['scope' => $scopes ? explode(',', $scopes) : ['read']];
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $redirectUri = $this->url->to('forum')->route('import-ai-oauth-passport.auth');

        $provider = $this->getProvider($redirectUri);

        $session = $request->getAttribute('session');
        $queryParams = $request->getQueryParams();

        // Handle OAuth errors
        if ($error = Arr::get($queryParams, 'error')) {
            $hint = Arr::get($queryParams, 'error_description', Arr::get($queryParams, 'hint', ''));
            throw new Exception("OAuth Error: $error - $hint");
        }

        $code = Arr::get($queryParams, 'code');

        // Step 1: Redirect to OAuth server for authorization
        if (!$code) {
            $authUrl = $provider->getAuthorizationUrl($this->getAuthorizationUrlOptions());
            $session->put('oauth2state', $provider->getState());

            return new RedirectResponse($authUrl);
        }

        // Step 2: Handle callback from OAuth server
        $state = Arr::get($queryParams, 'state');

        // Verify state to prevent CSRF attacks
        if (!$state || $state !== $session->get('oauth2state')) {
            $session->remove('oauth2state');
            throw new Exception('Invalid state parameter');
        }

        // Exchange authorization code for access token
        $token = $provider->getAccessToken('authorization_code', ['code' => $code]);

        // Get user details from OAuth server
        $user = $provider->getResourceOwner($token);

        // Create Flarum auth response
        return $this->response->make(
            'passport',
            $user->getId(),
            function (Registration $registration) use ($user) {
                $id = $user->getId();
                $name = $user->getName();
                $email = $user->getEmail();

                if (empty($id)) {
                    throw new Exception('Unable to retrieve user ID from OAuth provider');
                }

                // Handle username
                if ($this->settings->get('import-ai-oauth-passport.force_userid')) {
                    $registration->provide('username', $id);
                } else {
                    $registration->suggest('username', $id);
                }

                // Handle display name
                if (!empty($name)) {
                    if ($this->settings->get('import-ai-oauth-passport.force_name')) {
                        $registration->provide('nickname', $name);
                    } else {
                        $registration->suggest('nickname', $name);
                    }
                }

                // Handle email
                if (!empty($email)) {
                    if ($this->settings->get('import-ai-oauth-passport.force_email')) {
                        $registration->provideTrustedEmail($email);
                    } else {
                        $registration->suggest('email', $email);
                    }
                }

                $registration->setPayload($user->toArray());
            }
        );
    }
}
