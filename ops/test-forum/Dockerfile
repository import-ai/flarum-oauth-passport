ARG FORUM_BASE=flarum-local-pr5:rollback
ARG PACKAGE=import-ai/flarum-oauth-passport
FROM ${FORUM_BASE} AS baseline

FROM baseline AS update
ARG REVISION
ARG PACKAGE
COPY source/ /opt/extension-source/
COPY prepare.php /tmp/
RUN cp /opt/flarum/composer.lock /tmp/baseline.lock \
 && php /tmp/prepare.php "$REVISION" "$PACKAGE" \
 && COMPOSER_ALLOW_SUPERUSER=1 composer update --working-dir=/opt/flarum "$PACKAGE" --no-dev --no-interaction --no-plugins --no-scripts --no-audit \
 && php -r 'function otherPackages($file, $package) { return array_values(array_filter(json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR)["packages"], fn($p) => $p["name"] !== $package)); } if (otherPackages("/tmp/baseline.lock", $argv[1]) !== otherPackages("/opt/flarum/composer.lock", $argv[1])) exit(1);' "$PACKAGE"

FROM baseline
ARG REVISION
ARG PACKAGE
LABEL org.opencontainers.image.revision=$REVISION
RUN rm -rf "/opt/flarum/vendor/$PACKAGE"
COPY --from=update --chown=flarum:flarum /opt/flarum/composer.json /opt/flarum/composer.lock /opt/flarum/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/autoload.php /opt/flarum/vendor/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/composer/ /opt/flarum/vendor/composer/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/${PACKAGE}/ /opt/flarum/vendor/${PACKAGE}/
