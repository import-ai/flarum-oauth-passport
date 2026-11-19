# OAuth Passport test deployment

`test-forum.yml` checks PHP and rebuilds the committed frontend bundles on pull requests and pushes to `main`. The test host polls successful runs every two minutes. Only current `main` and open, same-repository PR heads targeting `main` qualify. Fork PRs run CI. Deployment results and any rollback are logged in `journalctl -u flarum-oauth-test.service`.

The host builds from the running test forum image. Its startup script uses packaged extensions and checks the extension list. The deployer updates only the selected plugin, recreates the forum, then verifies the image, installed Composer version, package file hashes and test API. Composer conflicts fail before recreation.

Install these files in `/root/.local/docker/flarum-oauth-test` on `cy-cpu-3`. Install the unit files in `/etc/systemd/system`, run `systemctl daemon-reload`, and enable `flarum-oauth-test.timer`. If the shared egress hits GitHub's anonymous rate limit, put a read-only GitHub credential in the host-only `github.env` as `FLARUM_GITHUB_TOKEN`. Keep the file restricted to root. The deployer uses the existing test Compose project and stores its image selection in `compose.override.yaml`.

If startup or verification fails, the deployer restores the previous image selection. When migration files change it first saves a test database dump in the deployment directory. Review the migration and backup before restoring database state.

For the host credential, select only this repository and read access to Actions, Contents and Pull requests. GitHub adds read access to Metadata. Rotate the credential before its expiry and check the journal after the next timer run. The latest successfully deployed workflow run number is recorded in `last-run`.

The same deployer supports the public `flarum-webhook` and `flarum-webhook-notification` repositories. After their workflows are published, install the template units and enable `flarum-plugin-test@flarum-webhook.timer` and `flarum-plugin-test@flarum-webhook-notification.timer`. Their run markers are scoped by repository. The timers and the forum deployer take the same host lock before replacing the container.
