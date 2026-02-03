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

use League\OAuth2\Client\Provider\ResourceOwnerInterface;
use League\OAuth2\Client\Tool\ArrayAccessorTrait;

class PassportResourceOwner implements ResourceOwnerInterface
{
    use ArrayAccessorTrait;

    /**
     * @var array
     */
    protected $response;

    /**
     * @var string
     */
    protected $idField;

    /**
     * @var string
     */
    protected $nameField;

    /**
     * @var string
     */
    protected $emailField;

    /**
     * Creates new resource owner.
     *
     * @param array $response
     * @param string $idField
     * @param string $nameField
     * @param string $emailField
     */
    public function __construct(array $response, string $idField = 'id', string $nameField = 'name', string $emailField = 'email')
    {
        $this->response = $response;
        $this->idField = $idField;
        $this->nameField = $nameField;
        $this->emailField = $emailField;
    }

    /**
     * Get resource owner id.
     *
     * @return string|null
     */
    public function getId(): ?string
    {
        return $this->getNestedValue($this->idField, $this->response);
    }

    /**
     * Get resource owner name.
     *
     * @return string|null
     */
    public function getName(): ?string
    {
        return $this->getNestedValue($this->nameField, $this->response);
    }

    /**
     * Get resource owner email address.
     *
     * @return string|null
     */
    public function getEmail(): ?string
    {
        return $this->getNestedValue($this->emailField, $this->response);
    }

    /**
     * Return all of the owner details available as an array.
     *
     * @return array
     */
    public function toArray(): array
    {
        return $this->response;
    }

    /**
     * Get a nested value from the response using dot notation.
     *
     * @param string $path
     * @param array $data
     * @return mixed|null
     */
    protected function getNestedValue(string $path, array $data)
    {
        // Support dot notation for nested fields (e.g., "data.user.id")
        $keys = explode('.', $path);
        $value = $data;

        foreach ($keys as $key) {
            if (is_array($value) && array_key_exists($key, $value)) {
                $value = $value[$key];
            } else {
                return null;
            }
        }

        return $value;
    }
}
