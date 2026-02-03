import { extend, override } from 'flarum/common/extend';
import app from 'flarum/forum/app';
import LogInButtons from 'flarum/forum/components/LogInButtons';
import LogInButton from 'flarum/forum/components/LogInButton';
import ItemList from 'flarum/common/utils/ItemList';

/**
 * Open OAuth popup with custom dimensions
 */
function openOAuthPopup(path: string) {
  const fullscreen = app.forum.attribute('importAiOAuthPassport.fullscreenPopup');

  if (fullscreen) {
    window.open(app.forum.attribute<string>('baseUrl') + path, 'logInPopup', 'fullscreen=yes');
  } else {
    const defaultWidth = 580;
    const defaultHeight = 400;

    const width = app.forum.attribute<number>('importAiOAuthPassport.popupWidth') || defaultWidth;
    const height = app.forum.attribute<number>('importAiOAuthPassport.popupHeight') || defaultHeight;

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const top = windowHeight / 2 - height / 2;
    const left = windowWidth / 2 - width / 2;

    window.open(
      app.forum.attribute<string>('baseUrl') + path,
      'logInPopup',
      `width=${width},height=${height},top=${top},left=${left},status=no,scrollbars=yes,resizable=no`
    );
  }
}

app.initializers.add('import-ai/oauth-passport', () => {
  // Wait for forum data to be loaded
  if (!app.forum) {
    return;
  }

  // Apply custom button styles
  const buttonColor = app.forum.attribute('importAiOAuthPassport.buttonColor');
  const buttonTextColor = app.forum.attribute('importAiOAuthPassport.buttonTextColor');

  if (buttonColor || buttonTextColor) {
    const style = document.createElement('style');
    style.textContent = `
      .LogInButton--passport {
        ${buttonColor ? `background-color: ${buttonColor} !important;` : ''}
        ${buttonTextColor ? `color: ${buttonTextColor} !important;` : ''}
      }
      .LogInButton--passport:hover,
      .LogInButton--passport:focus {
        ${buttonColor ? `background-color: ${adjustColor(buttonColor, -20)} !important;` : ''}
      }
    `;
    document.head.appendChild(style);
  }

  // Replace login/signup buttons with OAuth button if enabled
  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');

  // Hide username/password login if disabled
  if (replaceLoginSignup) {
    const hidePasswordStyle = document.createElement('style');
    hidePasswordStyle.textContent = `
      .LogInModal .Form--centered > .Form-group:first-child,
      .LogInModal .Form--centered > .Form-group:nth-child(2) {
        display: none !important;
      }
      .LogInModal .LogInModal-divider {
        display: none !important;
      }
      .LogInModal .Form--centered > .Form-group:last-child {
        margin-top: 0 !important;
      }
    `;
    document.head.appendChild(hidePasswordStyle);
  }

  extend(LogInButtons.prototype, 'items', function (items: ItemList) {
    // Only show if OAuth Passport is enabled
    if (!app.forum.attribute('importAiOAuthPassport.enabled')) {
      return;
    }

    // If replace mode is on, clear all existing items first
    if (replaceLoginSignup) {
      items.clear();
    }

    items.add(
      'import-ai-oauth-passport',
      LogInButton.component(
        {
          className: 'Button LogInButton--passport',
          icon: app.forum.attribute('importAiOAuthPassport.loginIcon'),
          path: '/auth/passport',
        },
        app.forum.attribute('importAiOAuthPassport.loginTitle')
      ),
      // When replacing, set high priority to ensure it's first
      replaceLoginSignup ? 100 : 0
    );
  });

  // Also hide the sign up link when replace mode is on
  if (replaceLoginSignup) {
    const hideSignupStyle = document.createElement('style');
    hideSignupStyle.textContent = `
      .LogInModal .Modal-footer {
        display: none !important;
      }
    `;
    document.head.appendChild(hideSignupStyle);
  }

  // Override LogInButton onclick to use custom popup dimensions for passport
  override(LogInButton.prototype, 'initAttrs', function (original, attrs: any) {
    // Call original first
    original(attrs);

    // Only override for passport OAuth path
    if (attrs.path === '/auth/passport') {
      attrs.onclick = function () {
        openOAuthPopup(attrs.path);
      };
    }
  });
});

// Helper function to darken/lighten color
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
