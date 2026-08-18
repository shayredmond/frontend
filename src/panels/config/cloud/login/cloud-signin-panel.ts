// The sign-in form for /config/cloud/login. Split out from the signed-out
// landing (cloud-login-panel, at /config/cloud/start) so a bookmarked
// /config/cloud/login lands directly on the form.
import type { TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, query } from "lit/decorators";
import { fireEvent } from "../../../../common/dom/fire_event";
import { navigate } from "../../../../common/navigate";
import "../../../../components/ha-alert";
import "../../../../layouts/hass-subpage";
import { haStyle } from "../../../../resources/styles";
import type { HomeAssistant } from "../../../../types";
import { cloudSubpageStyle } from "../account/cloud-subpage-style";
import "./cloud-login";
import type { CloudLogin } from "./cloud-login";

@customElement("cloud-signin-panel")
export class CloudSigninPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: "is-wide", type: Boolean }) public isWide = false;

  @property({ type: Boolean }) public narrow = false;

  @property() public email?: string;

  @property({ attribute: false }) public flashMessage?: string;

  @query("cloud-login") private _cloudLoginElement?: CloudLogin;

  protected firstUpdated(): void {
    this._focusEmail();
  }

  private async _focusEmail() {
    await this.updateComplete;
    const cloudLogin = this._cloudLoginElement;
    if (!cloudLogin) {
      return;
    }
    await cloudLogin.updateComplete;
    cloudLogin.emailField?.focus();
  }

  protected render(): TemplateResult {
    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        back-path="/config/cloud/start"
        .header=${this.hass.localize("ui.panel.config.cloud.login.sign_in")}
      >
        <div class="content">
          ${
            this.flashMessage
              ? html`<ha-alert
                  dismissable
                  @alert-dismissed-clicked=${this._dismissFlash}
                >
                  ${this.flashMessage}
                </ha-alert>`
              : nothing
          }
          <cloud-login
            .hass=${this.hass}
            .email=${this.email}
            .localize=${this.hass.localize}
            .lead=${this.hass.localize(
              "ui.panel.config.cloud.login.sign_in_lead"
            )}
            check-connection
            @cloud-forgot-password=${this._handleForgotPassword}
          ></cloud-login>
        </div>
      </hass-subpage>
    `;
  }

  private _syncEmail() {
    const value = this._cloudLoginElement?.emailField?.value ?? this.email;
    if (value) {
      fireEvent(this, "cloud-email-changed", { value });
    }
  }

  private _handleForgotPassword() {
    this._dismissFlash();
    this._syncEmail();
    navigate("/config/cloud/forgot-password");
  }

  private _dismissFlash() {
    fireEvent(this, "flash-message-changed", { value: "" });
  }

  static get styles() {
    return [
      haStyle,
      cloudSubpageStyle,
      css`
        .content {
          box-sizing: border-box;
          padding-bottom: calc(
            var(--safe-area-inset-bottom) + var(--ha-space-6)
          );
          display: flex;
          flex-direction: column;
          gap: var(--ha-space-4);
        }
        ha-alert,
        cloud-login {
          display: block;
          width: 100%;
          max-width: 600px;
          margin-inline: auto;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-signin-panel": CloudSigninPanel;
  }
}
