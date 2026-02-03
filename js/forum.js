import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import LogInButtons from 'flarum/forum/components/LogInButtons';
import LogInButton from 'flarum/forum/components/LogInButton';
import HeaderSecondary from 'flarum/forum/components/HeaderSecondary';
import ItemList from 'flarum/common/utils/ItemList';

// Track if we've already applied the extend
let headerExtended = false;

// Execute immediately when module loads
function initPassport() {
  if (!app.forum) {
    // If forum data isn't loaded yet, wait and try again
    setTimeout(initPassport, 10);
    return;
  }

  const buttonColor = app.forum.attribute('importAiOAuthPassport.buttonColor');
  const buttonTextColor = app.forum.attribute('importAiOAuthPassport.buttonTextColor');
  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');
  const enabled = app.forum.attribute('importAiOAuthPassport.enabled');

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

  // Hide username/password login if disabled OR when replace mode is on
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
      .LogInModal .Form--centered > .Form-group:last-child {
        margin-top: 0 !important;
      }
    `;
    document.head.appendChild(hidePasswordStyle);
  }

  // When replace mode is on, also hide the submit button and remember me
  if (replaceLoginSignup) {
    const hideSubmitStyle = document.createElement('style');
    hideSubmitStyle.textContent = `
      .LogInModal .Form--centered > .Form-group:nth-child(3),
      .LogInModal .Form--centered > .Form-group:last-child {
        display: none !important;
      }
    `;
    document.head.appendChild(hideSubmitStyle);
  }

  // When replace mode is on, hide the modal footer with "Sign Up" link
  if (replaceLoginSignup) {
    const hideSignupStyle = document.createElement('style');
    hideSignupStyle.textContent = `
      .LogInModal .Modal-footer {
        display: none !important;
      }
    `;
    document.head.appendChild(hideSignupStyle);
  }

  // Apply header modifications if replace mode is on
  if (replaceLoginSignup && enabled && !headerExtended) {
    headerExtended = true;

    // Use CSS to hide the default buttons
    const hideHeaderButtonsStyle = document.createElement('style');
    hideHeaderButtonsStyle.textContent = `
      .Header-secondary .item-logIn,
      .Header-secondary .item-signUp {
        display: none !important;
      }
    `;
    document.head.appendChild(hideHeaderButtonsStyle);
  }

  if (enabled) {
    if (replaceLoginSignup) {
      // Override the items method to only show OAuth button
      override(LogInButtons.prototype, 'items', function () {
        const items = new ItemList();
        items.add(
          'import-ai-oauth-passport',
          LogInButton.component(
            {
              className: 'Button LogInButton--passport',
              icon: app.forum.attribute('importAiOAuthPassport.loginIcon'),
              path: '/auth/passport',
            },
            app.forum.attribute('importAiOAuthPassport.loginTitle')
          )
        );
        return items;
      });
    } else {
      // Just add OAuth button alongside existing ones
      extend(LogInButtons.prototype, 'items', function (items) {
        items.add(
          'import-ai-oauth-passport',
          LogInButton.component(
            {
              className: 'Button LogInButton--passport',
              icon: app.forum.attribute('importAiOAuthPassport.loginIcon'),
              path: '/auth/passport',
            },
            app.forum.attribute('importAiOAuthPassport.loginTitle')
          )
        );
      });
    }
  }
}

// Always extend HeaderSecondary to add OAuth button when appropriate
// This needs to happen early, before components are rendered
extend(HeaderSecondary.prototype, 'items', function (items) {
  // Check forum data is available
  if (!app.forum) return;

  const replaceLoginSignup = app.forum.attribute('importAiOAuthPassport.replaceLoginSignup');
  const enabled = app.forum.attribute('importAiOAuthPassport.enabled');

  if (replaceLoginSignup && enabled) {
    // Add OAuth login button to header
    items.add(
      'oauth-login',
      LogInButton.component(
        {
          className: 'Button Button--link',
          icon: app.forum.attribute('importAiOAuthPassport.loginIcon'),
          path: '/auth/passport',
        },
        app.forum.attribute('importAiOAuthPassport.loginTitle')
      ),
      15 // Priority
    );
  }
});

// Start initialization
initPassport();

function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
