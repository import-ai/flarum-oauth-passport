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
 * - Handles oauth_token for in-app browser OAuth flow
 * - Customizable popup dimensions for OAuth
 */

/**
 * Open OAuth popup with custom dimensions
 */
function openOAuthPopup(path) {
  const fullscreen = app.forum.attribute('importAiOAuthPassport.fullscreenPopup');

  if (fullscreen) {
    window.open(app.forum.attribute('baseUrl') + path, 'logInPopup', 'fullscreen=yes');
  } else {
    const defaultWidth = 580;
    const defaultHeight = 400;

    const width = app.forum.attribute('importAiOAuthPassport.popupWidth') || defaultWidth;
    const height = app.forum.attribute('importAiOAuthPassport.popupHeight') || defaultHeight;

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const top = windowHeight / 2 - height / 2;
    const left = windowWidth / 2 - width / 2;

    window.open(
      app.forum.attribute('baseUrl') + path,
      'logInPopup',
      `width=${width},height=${height},top=${top},left=${left},status=no,scrollbars=yes,resizable=no`
    );
  }
}

// Handle oauth_token URL parameter for in-app browser OAuth flow (WeChat, etc.)
const urlParams = new URLSearchParams(window.location.search);
const oauthToken = urlParams.get('oauth_token');

if (oauthToken) {
  // Build payload with all OAuth data for SignUpModal
  const payload = { token: oauthToken };

  // Add optional fields if present
  const oauthUsername = urlParams.get('oauth_username');
  if (oauthUsername) payload.username = oauthUsername;

  const oauthEmail = urlParams.get('oauth_email');
  if (oauthEmail) payload.email = oauthEmail;

  const oauthProvided = urlParams.get('oauth_provided');
  if (oauthProvided) payload.provided = oauthProvided.split(',');

  // Clean up the URL
  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, document.title, cleanUrl);

  // Trigger the authentication complete flow with full payload
  app.authenticationComplete(payload);
}

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

  // Hide password login fields in replace mode
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

// Add OAuth button to header when in replace mode and user is not logged in
extend(HeaderSecondary.prototype, 'items', function (items) {
  if (!app.forum) return;

  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');
  const enabled = app.forum.attribute('importAiOAuthPassport.enabled');
  const isLoggedIn = !!app.session.user;

  if (replaceLoginSignup && enabled && !isLoggedIn) {
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

// Override LogInButton onclick to use custom popup dimensions for passport
// Use event delegation to intercept clicks before they reach the button's onclick
function initPassportClickInterceptor() {
  document.addEventListener('click', function(event) {
    // Find if the click was on or inside a passport login button
    const button = event.target.closest('button.LogInButton, a.LogInButton');
    if (!button) return;

    // Check if this is the passport button by looking at the path or href attribute
    const path = button.getAttribute('path');
    const href = button.getAttribute('href');
    const targetPath = path || href || '';

    if (!targetPath.includes('/auth/passport')) return;

    // Prevent the default behavior (which would use fof/oauth's handler)
    event.preventDefault();
    event.stopPropagation();

    // Open our custom popup
    openOAuthPopup('/auth/passport');
  }, true);  // Use capture phase to intercept before bubbling
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
initPassportClickInterceptor();

// Helper: Adjust color brightness
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
