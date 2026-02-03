import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import LogInButtons from 'flarum/forum/components/LogInButtons';
import LogInButton from 'flarum/forum/components/LogInButton';
import HeaderSecondary from 'flarum/forum/components/HeaderSecondary';
import ItemList from 'flarum/common/utils/ItemList';

function openOAuthPopup(path) {
  const fullscreen = app.forum.attribute('importAiOAuthPassport.fullscreenPopup');

  if (fullscreen) {
    window.open(app.forum.attribute('baseUrl') + path, 'logInPopup', 'fullscreen=yes');
    return;
  }

  const width = app.forum.attribute('importAiOAuthPassport.popupWidth') || 580;
  const height = app.forum.attribute('importAiOAuthPassport.popupHeight') || 400;
  const top = window.innerHeight / 2 - height / 2;
  const left = window.innerWidth / 2 - width / 2;

  window.open(
    app.forum.attribute('baseUrl') + path,
    'logInPopup',
    `width=${width},height=${height},top=${top},left=${left},status=no,scrollbars=yes,resizable=no`
  );
}

// Handle oauth_token for in-app browser OAuth flow
const urlParams = new URLSearchParams(window.location.search);
const oauthToken = urlParams.get('oauth_token');

if (oauthToken) {
  const payload = { token: oauthToken };
  const username = urlParams.get('oauth_username');
  const email = urlParams.get('oauth_email');
  const provided = urlParams.get('oauth_provided');

  if (username) payload.username = username;
  if (email) payload.email = email;
  if (provided) payload.provided = provided.split(',');

  window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
  app.authenticationComplete(payload);
}

function adjustColor(color, amount) {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function applyDynamicStyles() {
  const buttonColor = app.forum.attribute('importAiOAuthPassport.buttonColor');
  const buttonTextColor = app.forum.attribute('importAiOAuthPassport.buttonTextColor');
  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');

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

  if (replaceLoginSignup) {
    const hideStyle = document.createElement('style');
    hideStyle.textContent = `
      .LogInModal .Form--centered > .Form-group:first-child,
      .LogInModal .Form--centered > .Form-group:nth-child(2),
      .LogInModal .Form--centered > .Form-group:nth-child(3),
      .LogInModal .Form--centered > .Form-group:last-child,
      .LogInModal .LogInModal-divider,
      .LogInModal .Modal-footer {
        display: none !important;
      }
    `;
    document.head.appendChild(hideStyle);
  }
}

function initLoginButtons() {
  if (!app.forum) {
    setTimeout(initLoginButtons, 10);
    return;
  }

  const enabled = app.forum.attribute('importAiOAuthPassport.enabled');
  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');

  if (!enabled) return;

  if (replaceLoginSignup) {
    const hideStyle = document.createElement('style');
    hideStyle.textContent = '.Header-secondary .item-logIn, .Header-secondary .item-signUp { display: none !important; }';
    document.head.appendChild(hideStyle);

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
    extend(LogInButtons.prototype, 'items', (items) => {
      items.add('import-ai-oauth-passport', LogInButton.component({
        className: 'Button LogInButton--passport',
        icon: app.forum.attribute('importAiOAuthPassport.loginIcon'),
        path: '/auth/passport',
      }, app.forum.attribute('importAiOAuthPassport.loginTitle')));
    });
  }
}

// Intercept clicks on passport login buttons to use custom popup dimensions
document.addEventListener('click', function(event) {
  const button = event.target.closest('button.LogInButton, a.LogInButton');
  if (!button) return;

  const targetPath = button.getAttribute('path') || button.getAttribute('href') || '';
  if (!targetPath.includes('/auth/passport')) return;

  event.preventDefault();
  event.stopPropagation();
  openOAuthPopup('/auth/passport');
}, true);

// Add OAuth button to header in replace mode
extend(HeaderSecondary.prototype, 'items', function (items) {
  if (!app.forum) return;

  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');
  const enabled = app.forum.attribute('importAiOAuthPassport.enabled');

  if (replaceLoginSignup && enabled && !app.session.user) {
    items.add('oauth-login', LogInButton.component({
      className: 'Button Button--link',
      icon: app.forum.attribute('importAiOAuthPassport.loginIcon'),
      path: '/auth/passport',
    }, app.forum.attribute('importAiOAuthPassport.loginTitle')), 15);
  }
});

// Initialize
function init() {
  if (!app.forum) {
    setTimeout(init, 10);
    return;
  }
  applyDynamicStyles();
}

init();
initLoginButtons();
