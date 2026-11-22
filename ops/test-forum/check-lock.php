<?php

function lockedPackages(string $file): array
{
    $lock = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);

    return array_column($lock['packages'], null, 'name');
}

$package = $argv[1];
$before = lockedPackages('/tmp/baseline.lock');
$after = lockedPackages('/opt/flarum/composer.lock');
unset($before[$package], $after[$package]);

// Older test images lack the event library required by OAuth Passport.
if ($package === 'import-ai/flarum-oauth-passport' && !isset($before['fof/extend'])) {
    unset($after['fof/extend']);
}

if ($before !== $after) {
    fwrite(STDERR, "The update changed another locked dependency.\n");
    exit(1);
}
