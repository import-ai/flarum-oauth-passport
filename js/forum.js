import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import LogInButtons from 'flarum/forum/components/LogInButtons';
import LogInButton from 'flarum/forum/components/LogInButton';
import HeaderSecondary from 'flarum/forum/components/HeaderSecondary';
import ItemList from 'flarum/common/utils/ItemList';

/**
 * OAuth Passport Extension - Forum Frontend
 *
 * Features:
 * - Adds OAuth login button to login modal and/or header
 * - Can replace all login/signup buttons with OAuth only
 * - Customizable button colors and icons
 */

// Apply dynamic styles once forum data is available
function applyDynamicStyles() {
  const buttonColor = app.forum.attribute('importAiOAuthPassport.buttonColor');
  const buttonTextColor = app.forum.attribute('importAiOAuthPassport.buttonTextColor');
  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');

  // Apply custom button colors
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

  // Hide password login fields when disabled or in replace mode
  if (app.forum.attribute('importAiOAuthPassport.disablePasswordLogin') || replaceLoginSignup) {
    const hidePasswordStyle = document.createElement('style');
    hidePasswordStyle.textContent = `
      .LogInModal .Form--centered > .Form-group:first-child,
      .LogInModal .Form--centered > .Form-group:nth-child(2) {
        display: none !important;
      }
      .LogInModal .LogInModal-divider {
        display: none !important;
      }
    `;
    document.head.appendChild(hidePasswordStyle);
  }

  // Hide submit/remember fields in replace mode
  if (replaceLoginSignup) {
    const hideSubmitStyle = document.createElement('style');
    hideSubmitStyle.textContent = `
      .LogInModal .Form--centered > .Form-group:nth-child(3),
      .LogInModal .Form--centered > .Form-group:last-child {
        display: none !important;
      }
      .LogInModal .Modal-footer {
        display: none !important;
      }
    `;
    document.head.appendChild(hideSubmitStyle);
  }
}

// Add OAuth button to header when in replace mode
extend(HeaderSecondary.prototype, 'items', function (items) {
  if (!app.forum) return;

  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');
  const enabled = app.forum.attribute('importAiOAuthPassport.enabled');

  if (replaceLoginSignup && enabled) {
    items.add(
      'oauth-login',
      LogInButton.component({
        className: 'Button Button--link',
        icon: app.forum.attribute('importAiOAuthPassport.loginIcon'),
        path: '/auth/passport',
      }, app.forum.attribute('importAiOAuthPassport.loginTitle')),
      15
    );
  }
});

// Modify login modal buttons
function initLoginButtons() {
  if (!app.forum) {
    setTimeout(initLoginButtons, 10);
    return;
  }

  const enabled = app.forum.attribute('importAiOAuthPassport.enabled');
  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');

  if (!enabled) return;

  // Hide default header login/signup buttons in replace mode
  if (replaceLoginSignup) {
    const hideHeaderButtons = document.createElement('style');
    hideHeaderButtons.textContent = `
      .Header-secondary .item-logIn,
      .Header-secondary .item-signUp {
        display: none !important;
      }
    `;
    document.head.appendChild(hideHeaderButtons);

    // Override to show only OAuth button
    override(LogInButtons.prototype, 'items', () => {
      const items = new ItemList();
      items.add('import-ai-oauth-passport', LogInButton.component({
        className: 'Button LogInButton--passport',
        icon: app.forum.attribute('importAiOAuthPassport.loginIcon'),
        path: '/auth/passport',
      }, app.forum.attribute('importAiOAuthPassport.loginTitle')));
      return items;
    });
  } else {
    // Add OAuth button alongside existing ones
    extend(LogInButtons.prototype, 'items', (items) => {
      items.add('import-ai-oauth-passport', LogInButton.component({
        className: 'Button LogInButton--passport',
        icon: app.forum.attribute('importAiOAuthPassport.loginIcon'),
        path: '/auth/passport',
      }, app.forum.attribute('importAiOAuthPassport.loginTitle')));
    });
  }
}

// Initialize when forum data is ready
function init() {
  if (!app.forum) {
    setTimeout(init, 10);
    return;
  }
  applyDynamicStyles();
}

// Start initialization
init();
initLoginButtons();

// Helper: Adjust color brightness
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
