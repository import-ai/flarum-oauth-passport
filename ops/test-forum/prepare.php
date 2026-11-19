<?php

$package = $argv[2];
$file = '/opt/flarum/composer.json';
$config = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
$config['repositories'] ??= [];
$config['repositories'] = array_values(array_filter(
    $config['repositories'],
    static fn ($repository) => ($repository['url'] ?? '') !== '/opt/extension-source',
));
array_unshift($config['repositories'], [
    'type' => 'path',
    'url' => '/opt/extension-source',
    'options' => ['symlink' => false, 'versions' => [$package => 'dev-ci-' . $argv[1]]],
]);
$config['require'][$package] = 'dev-ci-' . $argv[1];
file_put_contents($file, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . PHP_EOL);
