import app from 'flarum/admin/app';

app.initializers.add('import-ai/oauth-passport', () => {
  app.extensionData
    .for('import-ai-oauth-passport')
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.enabled_label'),
      setting: 'import-ai-oauth-passport.enabled',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.redirect_url_label'),
      setting: 'import-ai-oauth-passport.redirect_url',
      type: 'text',
      placeholder: 'http://your-forum.com/auth/passport',
      readonly: true,
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.client_id_label'),
      setting: 'import-ai-oauth-passport.client_id',
      type: 'text',
      placeholder: 'your-client-id',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.client_secret_label'),
      setting: 'import-ai-oauth-passport.client_secret',
      type: 'text',
      placeholder: 'your-client-secret',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.scopes_label'),
      setting: 'import-ai-oauth-passport.scopes',
      type: 'text',
      placeholder: 'read',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.authorization_endpoint_label'),
      setting: 'import-ai-oauth-passport.authorization_endpoint',
      type: 'text',
      placeholder: 'https://your-server.com/oauth/authorize',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.token_endpoint_label'),
      setting: 'import-ai-oauth-passport.token_endpoint',
      type: 'text',
      placeholder: 'https://your-server.com/oauth/token',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.user_information_endpoint_label'),
      setting: 'import-ai-oauth-passport.user_information_endpoint',
      type: 'text',
      placeholder: 'https://your-server.com/api/user',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.id_parameter_label'),
      setting: 'import-ai-oauth-passport.id_parameter',
      type: 'text',
      placeholder: 'id',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.display_name_parameter_label'),
      setting: 'import-ai-oauth-passport.display_name_parameter',
      type: 'text',
      placeholder: 'name',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.email_address_parameter_label'),
      setting: 'import-ai-oauth-passport.email_address_parameter',
      type: 'text',
      placeholder: 'email',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.force_userid_label'),
      setting: 'import-ai-oauth-passport.force_userid',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.force_name_label'),
      setting: 'import-ai-oauth-passport.force_name',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.force_email_label'),
      setting: 'import-ai-oauth-passport.force_email',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.update_display_name_label'),
      setting: 'import-ai-oauth-passport.update_display_name',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.update_email_label'),
      setting: 'import-ai-oauth-passport.update_email',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.replace_login_signup_label'),
      setting: 'import-ai-oauth-passport.replace_login_signup',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.button_title_label'),
      setting: 'import-ai-oauth-passport.button_title',
      type: 'text',
      placeholder: 'Login with Passport',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.button_icon_label'),
      setting: 'import-ai-oauth-passport.button_icon',
      type: 'text',
      placeholder: 'fas fa-passport',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.button_color_label'),
      setting: 'import-ai-oauth-passport.button_color',
      type: 'text',
      placeholder: '#684ba6',
    })
    .registerSetting({
      label: app.translator.trans('import-ai-oauth-passport.admin.settings.button_text_color_label'),
      setting: 'import-ai-oauth-passport.button_text_color',
      type: 'text',
      placeholder: '#ffffff',
    });
});
