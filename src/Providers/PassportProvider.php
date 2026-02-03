<?php

/*
 * This file is part of import-ai/flarum-oauth-passport.
 *
 * Copyright (c) Import AI.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace ImportAI\OAuthPassport\Providers;

use Flarum\Settings\SettingsRepositoryInterface;
use League\OAuth2\Client\Provider\AbstractProvider;
use League\OAuth2\Client\Provider\Exception\IdentityProviderException;
use League\OAuth2\Client\Provider\ResourceOwnerInterface;
use League\OAuth2\Client\Token\AccessToken;
use League\OAuth2\Client\Tool\BearerAuthorizationTrait;
use Psr\Http\Message\ResponseInterface;

class PassportProvider extends AbstractProvider
{
    use BearerAuthorizationTrait;

    /**
     * @var SettingsRepositoryInterface
     */
    protected $settings;

    /**
     * @param array $options
     * @param array $collaborators
     */
    public function __construct(array $options = [], array $collaborators = [])
    {
        $this->settings = $options['settings'] ?? null;
        parent::__construct($options, $collaborators);
    }

    /**
     * Returns the base URL for authorizing a client.
     *
     * @return string
     */
    public function getBaseAuthorizationUrl(): string
    {
        return $this->settings->get('import-ai-oauth-passport.authorization_endpoint', '');
    }

    /**
     * Returns the base URL for requesting an access token.
     *
     * @param array $params
     * @return string
     */
    public function getBaseAccessTokenUrl(array $params): string
    {
        return $this->settings->get('import-ai-oauth-passport.token_endpoint', '');
    }

    /**
     * Returns the URL for requesting the resource owner's details.
     *
     * @param AccessToken $token
     * @return string
     */
    public function getResourceOwnerDetailsUrl(AccessToken $token): string
    {
        return $this->settings->get('import-ai-oauth-passport.user_information_endpoint', '');
    }

    /**
     * Returns the default scopes used by this provider.
     *
     * @return array
     */
    protected function getDefaultScopes(): array
    {
        $scopes = $this->settings->get('import-ai-oauth-passport.scopes', '');
        return $scopes ? explode(',', $scopes) : ['read'];
    }

    /**
     * Returns the string that should be used to separate scopes when building
     * the URL for requesting an access token.
     *
     * @return string
     */
    protected function getScopeSeparator(): string
    {
        return ' ';
    }

    /**
     * Checks a provider response for errors.
     *
     * @param ResponseInterface $response
     * @param array|string $data Parsed response data
     * @throws IdentityProviderException
     */
    protected function checkResponse(ResponseInterface $response, $data): void
    {
        if (!empty($data['error'])) {
            $error = $data['error'];
            if (is_array($error)) {
                $error = json_encode($error);
            }
            $code = $data['error_code'] ?? $data['code'] ?? 0;
            throw new IdentityProviderException($error, (int) $code, $data);
        }
    }

    /**
     * Generates a resource owner object from a successful resource owner
     * details request.
     *
     * @param array $response
     * @param AccessToken $token
     * @return ResourceOwnerInterface
     */
    protected function createResourceOwner(array $response, AccessToken $token): ResourceOwnerInterface
    {
        $idField = $this->settings->get('import-ai-oauth-passport.id_parameter', 'id');
        $nameField = $this->settings->get('import-ai-oauth-passport.display_name_parameter', 'name');
        $emailField = $this->settings->get('import-ai-oauth-passport.email_address_parameter', 'email');

        return new PassportResourceOwner($response, $idField, $nameField, $emailField);
    }
}
