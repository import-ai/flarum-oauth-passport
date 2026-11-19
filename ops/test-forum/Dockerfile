ARG FORUM_BASE=flarum-local-pr5:rollback
FROM ${FORUM_BASE} AS baseline

FROM baseline AS update
ARG REVISION
COPY source/ /opt/extension-source/
COPY prepare.php /tmp/
RUN cp /opt/flarum/composer.lock /tmp/baseline.lock \
 && php /tmp/prepare.php "$REVISION" \
 && COMPOSER_ALLOW_SUPERUSER=1 composer update --working-dir=/opt/flarum import-ai/flarum-oauth-passport --no-dev --no-interaction --no-plugins --no-scripts --no-audit \
 && php -r 'function otherPackages($file) { return array_values(array_filter(json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR)["packages"], fn($p) => $p["name"] !== "import-ai/flarum-oauth-passport")); } if (otherPackages("/tmp/baseline.lock") !== otherPackages("/opt/flarum/composer.lock")) exit(1);'

FROM baseline
ARG REVISION
LABEL org.opencontainers.image.revision=$REVISION
RUN rm -rf /opt/flarum/vendor/import-ai/flarum-oauth-passport
COPY --from=update --chown=flarum:flarum /opt/flarum/composer.json /opt/flarum/composer.lock /opt/flarum/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/autoload.php /opt/flarum/vendor/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/composer/ /opt/flarum/vendor/composer/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/import-ai/flarum-oauth-passport/ /opt/flarum/vendor/import-ai/flarum-oauth-passport/
