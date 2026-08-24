// Implements the "Cloud Signup Flow" design handoff (Claude Design,
// design_handoff_cloud_signup): screen 3 (create account) and screen 4
// (in-place "Check your email" confirm state — no cloud-done redirect).
import { mdiEmailCheckOutline } from "@mdi/js";
import type { TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import { fireEvent } from "../../../../common/dom/fire_event";
import { navigate } from "../../../../common/navigate";
import "../../../../components/buttons/ha-progress-button";
import "../../../../components/ha-alert";
import "../../../../components/ha-button";
import "../../../../components/ha-card";
import "../../../../components/ha-svg-icon";
import "../../../../components/input/ha-input";
import type { HaInput } from "../../../../components/input/ha-input";
import {
  cloudLogin,
  cloudRegister,
  cloudResendVerification,
} from "../../../../data/cloud";
import "../../../../layouts/hass-subpage";
import { haStyle } from "../../../../resources/styles";
import type { HomeAssistant } from "../../../../types";
import { cloudSubpageStyle } from "../account/cloud-subpage-style";

@customElement("cloud-register")
export class CloudRegister extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: "is-wide", type: Boolean }) public isWide = false;

  @property({ type: Boolean }) public narrow = false;

  @property() public email?: string;

  @state() private _view: "form" | "confirm" = "form";

  @state() private _requestInProgress = false;

  @state() private _resendInProgress = false;

  @state() private _error?: string;

  @state() private _success?: string;

  @state() private _email = "";

  private _password = "";

  @query("#email") private _emailField?: HaInput;

  @query("#password") private _passwordField?: HaInput;

  @query("#confirm-title") private _confirmTitle?: HTMLElement;

  private _pollInterval?: number;

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopConfirmPolling();
    this._password = "";
  }

  protected render(): TemplateResult {
    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        back-path="/config/cloud/start"
        .header=${this.hass.localize("ui.panel.config.cloud.register.headline")}
      >
        <div class="content">
          ${this._view === "form" ? this._renderForm() : this._renderConfirm()}
        </div>
      </hass-subpage>
    `;
  }

  private _renderForm(): TemplateResult {
    return html`
      <ha-card outlined>
        <div class="card-header-block">
          <h2>
            ${this.hass.localize(
              "ui.panel.config.cloud.register.create_account"
            )}
          </h2>
          <p>
            ${this.hass.localize("ui.panel.config.cloud.register.information")}
          </p>
        </div>
        <div class="card-content register-form">
          ${
            this._error
              ? html`<ha-alert alert-type="error">${this._error}</ha-alert>`
              : nothing
          }
          <ha-input
            autofocus
            id="email"
            name="email"
            .label=${this.hass.localize(
              "ui.panel.config.cloud.register.email_address"
            )}
            type="email"
            autocomplete="email"
            required
            .value=${this.email ?? ""}
            .disabled=${this._requestInProgress}
            @keydown=${this._keyDown}
            .validationMessage=${this.hass.localize(
              "ui.panel.config.cloud.register.email_error_msg"
            )}
          ></ha-input>
          <ha-input
            id="password"
            type="password"
            password-toggle
            name="password"
            .label=${this.hass.localize(
              "ui.panel.config.cloud.register.password"
            )}
            autocomplete="new-password"
            minlength="8"
            required
            .disabled=${this._requestInProgress}
            @keydown=${this._keyDown}
            .validationMessage=${this.hass.localize(
              "ui.panel.config.cloud.register.password_error_msg"
            )}
          ></ha-input>
          <p class="terms">
            ${this.hass.localize("ui.panel.config.cloud.register.information4")}
            <a
              href="https://www.nabucasa.com/tos/"
              target="_blank"
              rel="noreferrer"
              >${this.hass.localize(
                "ui.panel.config.cloud.register.link_terms_conditions"
              )}</a
            >
            ·
            <a
              href="https://www.nabucasa.com/privacy_policy/"
              target="_blank"
              rel="noreferrer"
              >${this.hass.localize(
                "ui.panel.config.cloud.register.link_privacy_policy"
              )}</a
            >
          </p>
        </div>
        <div class="card-actions split">
          <ha-button
            appearance="plain"
            .disabled=${this._requestInProgress}
            @click=${this._handleSignInInstead}
          >
            ${this.hass.localize(
              "ui.panel.config.cloud.register.sign_in_instead"
            )}
          </ha-button>
          <ha-progress-button
            appearance="filled"
            @click=${this._handleRegister}
            .progress=${this._requestInProgress}
            >${this.hass.localize(
              "ui.panel.config.cloud.register.start_trial"
            )}</ha-progress-button
          >
        </div>
      </ha-card>
    `;
  }

  private _renderConfirm(): TemplateResult {
    return html`
      <ha-card outlined>
        <div class="card-content confirm">
          ${
            this._error
              ? html`<ha-alert alert-type="error">${this._error}</ha-alert>`
              : nothing
          }
          ${
            this._success
              ? html`<ha-alert alert-type="success">${this._success}</ha-alert>`
              : nothing
          }
          <div class="confirm-icon">
            <ha-svg-icon .path=${mdiEmailCheckOutline}></ha-svg-icon>
          </div>
          <h2 id="confirm-title" tabindex="-1">
            ${this.hass.localize(
              "ui.panel.config.cloud.register.check_your_email"
            )}
          </h2>
          <p>
            ${this.hass.localize(
              "ui.panel.config.cloud.register.confirm_email",
              { email: this._email }
            )}
          </p>
        </div>
        <div class="card-actions split confirm-actions">
          <ha-button
            appearance="plain"
            .disabled=${this._requestInProgress}
            @click=${this._handleCancelPendingLogin}
          >
            ${this.hass.localize("ui.common.cancel")}
          </ha-button>
          <ha-progress-button
            appearance="filled"
            @click=${this._handleClickedConfirm}
            .progress=${this._requestInProgress}
            .disabled=${this._resendInProgress}
            >${this.hass.localize(
              "ui.panel.config.cloud.register.clicked_confirm"
            )}</ha-progress-button
          >
        </div>
      </ha-card>
      <p class="footnote">
        ${this.hass.localize("ui.panel.config.cloud.register.nothing_arrived")}<button
          class="link"
          .disabled=${this._resendInProgress}
          @click=${this._handleResendVerifyEmail}
        >
          ${this.hass.localize("ui.panel.config.cloud.register.resend_link")}</button
        >.
      </p>
    `;
  }

  private _keyDown(ev: KeyboardEvent) {
    if (ev.key === "Enter") {
      this._handleRegister();
    }
  }

  private _handleSignInInstead() {
    fireEvent(this, "cloud-email-changed", {
      value: this._emailField?.value ?? this.email ?? "",
    });
    navigate("/config/cloud/login");
  }

  private async _handleRegister() {
    const emailField = this._emailField;
    const passwordField = this._passwordField;

    if (!emailField || !passwordField) {
      return;
    }

    if (!emailField.reportValidity()) {
      passwordField.reportValidity();
      emailField.focus();
      return;
    }

    if (!passwordField.reportValidity()) {
      passwordField.focus();
      return;
    }

    const email = emailField.value?.toLowerCase() || "";
    const password = passwordField.value || "";

    this._requestInProgress = true;
    this._error = undefined;

    try {
      await cloudRegister(this.hass, email, password);
      this._email = email;
      this._password = password;
      this._requestInProgress = false;
      this._view = "confirm";
      fireEvent(this, "cloud-email-changed", { value: email });
      this._startConfirmPolling();
      await this.updateComplete;
      this._confirmTitle?.focus();
    } catch (err: any) {
      this._password = "";
      this._requestInProgress = false;
      this._error =
        err && err.body && err.body.message
          ? err.body.message
          : "Unknown error";
    }
  }

  // Email confirmation happens in Nabu Casa's auth system, which the not-yet-
  // logged-in instance cannot observe or be notified by, so the only available
  // check is attempting the login over the REST API. A cloud/login WebSocket
  // command (or a backend-side cloud/wait_confirmation subscription) in core
  // would let this ride the existing socket instead — backend follow-up.
  private _startConfirmPolling() {
    this._stopConfirmPolling();
    this._pollInterval = window.setInterval(
      () => this._pollConfirmation(),
      10000
    );
  }

  private _stopConfirmPolling() {
    if (this._pollInterval !== undefined) {
      clearInterval(this._pollInterval);
      this._pollInterval = undefined;
    }
  }

  private async _pollConfirmation() {
    if (
      document.hidden ||
      this._requestInProgress ||
      this._resendInProgress ||
      !this._email ||
      !this._password
    ) {
      return;
    }
    try {
      await cloudLogin({
        hass: this.hass,
        email: this._email,
        password: this._password,
      });
      this._stopConfirmPolling();
      this._password = "";
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err: any) {
      const errCode = err?.body?.code?.toLowerCase?.();
      if (errCode !== "usernotconfirmed") {
        // Unexpected failure: stop polling quietly; the manual button still
        // works and will surface the error.
        this._stopConfirmPolling();
      }
    }
  }

  private async _handleClickedConfirm() {
    if (!this._email || !this._password) {
      // Password no longer in memory: fall back to sign in with the email
      // prefilled.
      fireEvent(this, "cloud-done", {
        flashMessage: this.hass.localize(
          "ui.panel.config.cloud.register.account_created"
        ),
      });
      return;
    }

    this._requestInProgress = true;
    this._error = undefined;
    this._success = undefined;

    try {
      await cloudLogin({
        hass: this.hass,
        email: this._email,
        password: this._password,
      });
      this._password = "";
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err: any) {
      this._requestInProgress = false;
      const errCode = err?.body?.code?.toLowerCase?.();
      this._error =
        errCode === "usernotconfirmed"
          ? this.hass.localize(
              "ui.panel.config.cloud.login.alert_email_confirm_necessary"
            )
          : (err?.body?.message ?? "Unknown error");
    }
  }

  private _handleCancelPendingLogin() {
    // Cancel the pending login and return to the registration form so the
    // user can fix a mistyped email and try again.
    this._stopConfirmPolling();
    this._password = "";
    this._error = undefined;
    this._success = undefined;
    // The pending-login retry currently lives here in the frontend (see
    // _startConfirmPolling). Once it moves to the backend for the real
    // implementation, this handler must also cancel the server-side
    // task/timer (e.g. a cloud/login/cancel command) so it stops retrying
    // for the abandoned account.
    this._view = "form";
  }

  private async _handleResendVerifyEmail() {
    const email = this._view === "confirm" ? this._email : "";

    if (!email || this._requestInProgress || this._resendInProgress) {
      return;
    }

    this._error = undefined;
    this._success = undefined;
    this._resendInProgress = true;

    const doResend = async (username: string) => {
      try {
        await cloudResendVerification(this.hass, username);
        this._success = this.hass.localize(
          "ui.panel.config.cloud.register.verification_email_sent"
        );
      } catch (err: any) {
        const errCode = err && err.body && err.body.code;
        if (errCode === "usernotfound" && username !== username.toLowerCase()) {
          await doResend(username.toLowerCase());
        } else {
          this._error =
            err && err.body && err.body.message
              ? err.body.message
              : "Unknown error";
        }
      }
    };

    try {
      await doResend(email);
    } finally {
      this._resendInProgress = false;
    }
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
          gap: var(--ha-space-3);
        }
        ha-card {
          width: 100%;
          margin-bottom: 0;
        }
        .footnote {
          display: block;
          width: 100%;
          max-width: 600px;
          margin-inline: auto;
        }
        .card-header-block {
          padding: var(--ha-space-4) var(--ha-space-4) 0;
        }
        .card-header-block h2 {
          margin: 0;
          font-size: var(--ha-font-size-2xl);
          font-weight: var(--ha-font-weight-normal);
          line-height: var(--ha-line-height-condensed);
        }
        .card-header-block p {
          margin: var(--ha-space-2) 0 0;
          color: var(--secondary-text-color);
          line-height: var(--ha-line-height-normal);
        }
        .register-form {
          display: flex;
          flex-direction: column;
        }
        .terms {
          margin: var(--ha-space-2) 0 0;
          font-size: var(--ha-font-size-s);
          color: var(--secondary-text-color);
        }
        .terms a,
        .footnote a {
          color: var(--primary-color);
        }
        .card-actions.split {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        /* The confirm screen is a centered message, so the divider above its
           actions reads as heavy; drop it. Layout comes from .card-actions.split
           (cancel left, primary right), matching the create-account form. */
        .card-actions.confirm-actions {
          border-top: none;
        }
        .footnote button.link {
          color: var(--primary-color);
        }
        .confirm {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--ha-space-3);
          padding: var(--ha-space-8) var(--ha-space-4) var(--ha-space-5);
        }
        .confirm ha-alert {
          width: 100%;
          text-align: initial;
        }
        .confirm-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--ha-border-radius-pill);
          background: color-mix(in srgb, var(--info-color) 18%, transparent);
          color: var(--info-color);
          display: flex;
          align-items: center;
          justify-content: center;
          --mdc-icon-size: 28px;
        }
        .confirm h2 {
          margin: 0;
          font-size: var(--ha-font-size-2xl);
          font-weight: var(--ha-font-weight-normal);
          line-height: var(--ha-line-height-condensed);
        }
        /* Focused programmatically only (tabindex="-1") to announce the new
           view to screen readers; no visible ring on the static heading. */
        #confirm-title:focus {
          outline: none;
        }
        .confirm p {
          margin: 0;
          max-width: 420px;
          color: var(--secondary-text-color);
          line-height: var(--ha-line-height-normal);
        }
        .footnote {
          margin-block: 0;
          font-size: var(--ha-font-size-s);
          color: var(--secondary-text-color);
          text-align: center;
        }
        /* On narrow screens the two long labels don't fit side by side, so
           stack them with the primary action on top. */
        @media (max-width: 500px) {
          .card-actions.split {
            flex-direction: column-reverse;
            align-items: stretch;
            gap: var(--ha-space-2);
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-register": CloudRegister;
  }

  interface HASSDomEvents {
    "cloud-done": { flashMessage: string };
  }
}
