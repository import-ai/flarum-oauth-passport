ARG FORUM_BASE=flarum-local-pr5:rollback
ARG PACKAGE=import-ai/flarum-oauth-passport
FROM ${FORUM_BASE} AS baseline

FROM baseline AS update
ARG REVISION
ARG PACKAGE
COPY source/ /opt/extension-source/
COPY prepare.php check-lock.php /tmp/
RUN cp /opt/flarum/composer.lock /tmp/baseline.lock \
 && php /tmp/prepare.php "$REVISION" "$PACKAGE" \
 && COMPOSER_ALLOW_SUPERUSER=1 composer update --working-dir=/opt/flarum "$PACKAGE" --no-dev --no-interaction --no-plugins --no-scripts --no-audit \
 && php /tmp/check-lock.php "$PACKAGE"

FROM baseline
ARG REVISION
ARG PACKAGE
LABEL org.opencontainers.image.revision=$REVISION
RUN rm -rf "/opt/flarum/vendor/$PACKAGE"
COPY --from=update --chown=flarum:flarum /opt/flarum/composer.json /opt/flarum/composer.lock /opt/flarum/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/autoload.php /opt/flarum/vendor/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/composer/ /opt/flarum/vendor/composer/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/fof/ /opt/flarum/vendor/fof/
COPY --from=update --chown=flarum:flarum /opt/flarum/vendor/${PACKAGE}/ /opt/flarum/vendor/${PACKAGE}/
