// Signed-out landing for /config/cloud/start (the cloud entry). "Sign in"
// routes to /config/cloud/login (the form) and "Start your free trial" to
// /config/cloud/register.
import {
  mdiBackupRestore,
  mdiCellphone,
  mdiDeleteForever,
  mdiDotsVertical,
  mdiDownload,
  mdiEarth,
  mdiMicrophone,
  mdiMicrophoneMessage,
} from "@mdi/js";
import type { TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../../../common/dom/fire_event";
import { navigate } from "../../../../common/navigate";
import "../../../../components/ha-alert";
import "../../../../components/ha-button";
import "../../../../components/ha-card";
import "../../../../components/ha-dropdown";
import type { HaDropdownSelectEvent } from "../../../../components/ha-dropdown";
import "../../../../components/ha-dropdown-item";
import "../../../../components/ha-svg-icon";
import { removeCloudData } from "../../../../data/cloud";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../../dialogs/generic/show-dialog-box";
import "../../../../layouts/hass-subpage";
import { haStyle } from "../../../../resources/styles";
import type { HomeAssistant } from "../../../../types";
import { cloudSubpageStyle } from "../account/cloud-subpage-style";
import { showSupportPackageDialog } from "../account/show-dialog-cloud-support-package";

const FEATURE_GRID = [
  ["backup", mdiBackupRestore, "green", "feature_backup"],
  ["voice-control", mdiMicrophoneMessage, "cyan", "feature_voice_control"],
  ["voice-quality", mdiMicrophone, "purple", "feature_voice_quality"],
  ["companion", mdiCellphone, "primary", "feature_companion"],
] as const;

@customElement("cloud-login-panel")
export class CloudLoginPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: "is-wide", type: Boolean }) public isWide = false;

  @property({ type: Boolean }) public narrow = false;

  @property() public email?: string;

  @property({ attribute: false }) public flashMessage?: string;

  protected render(): TemplateResult {
    return this._renderLanding();
  }

  private _renderFlash() {
    return this.flashMessage
      ? html`<ha-alert
          dismissable
          @alert-dismissed-clicked=${this._dismissFlash}
        >
          ${this.flashMessage}
        </ha-alert>`
      : nothing;
  }

  private _renderLanding(): TemplateResult {
    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        back-path="/config"
        .header=${this.hass.localize(
          "ui.panel.config.cloud.login.landing_title"
        )}
      >
        <ha-dropdown slot="toolbar-icon" @wa-select=${this._handleMenuAction}>
          <ha-icon-button
            slot="trigger"
            .label=${this.hass.localize("ui.common.menu")}
            .path=${mdiDotsVertical}
          ></ha-icon-button>

          <ha-dropdown-item value="reset">
            ${this.hass.localize(
              "ui.panel.config.cloud.account.reset_cloud_data"
            )}
            <ha-svg-icon slot="icon" .path=${mdiDeleteForever}></ha-svg-icon>
          </ha-dropdown-item>
          <ha-dropdown-item value="download">
            ${this.hass.localize(
              "ui.panel.config.cloud.account.download_support_package"
            )}
            <ha-svg-icon slot="icon" .path=${mdiDownload}></ha-svg-icon>
          </ha-dropdown-item>
        </ha-dropdown>
        <div class="content">
          ${this._renderFlash()}
          <ha-card outlined>
            <div class="card-content hero">
              <h2>
                ${this.hass.localize("ui.panel.config.cloud.login.hero_title")}
              </h2>
              <p class="lead">
                ${this.hass.localize("ui.panel.config.cloud.login.hero_lead")}
              </p>
              <div class="hero-actions">
                <ha-button
                  size="l"
                  appearance="filled"
                  @click=${this._handleRegister}
                >
                  ${this.hass.localize(
                    "ui.panel.config.cloud.register.headline"
                  )}
                </ha-button>
                <ha-button appearance="plain" @click=${this._handleSignIn}>
                  ${this.hass.localize("ui.panel.config.cloud.login.sign_in")}
                </ha-button>
              </div>
              <p class="trial-note">
                ${this.hass.localize("ui.panel.config.cloud.login.trial_note")}
              </p>
            </div>
          </ha-card>

          <div class="funding-section">
            <img src="/static/icons/logo_ohf.svg" alt="Open Home Foundation" />
            <p>
              ${this.hass.localize(
                "ui.panel.config.cloud.account.funding_note"
              )}
            </p>
          </div>

          <ha-card outlined>
            <div class="card-content feature-lead">
              <div class="icon-tile blue">
                <ha-svg-icon .path=${mdiEarth}></ha-svg-icon>
              </div>
              <div class="feature-text">
                <div class="feature-title">
                  ${this.hass.localize(
                    "ui.panel.config.cloud.login.feature_remote_title"
                  )}
                </div>
                <p>
                  ${this.hass.localize(
                    "ui.panel.config.cloud.login.feature_remote_body"
                  )}
                </p>
              </div>
            </div>
          </ha-card>

          <div class="feature-grid">
            ${FEATURE_GRID.map(
              ([key, icon, tint, i18nBase]) => html`
                <ha-card outlined data-feature=${key}>
                  <div class="card-content feature-cell">
                    <div class="icon-tile ${tint}">
                      <ha-svg-icon .path=${icon}></ha-svg-icon>
                    </div>
                    <div class="feature-title small">
                      ${this.hass.localize(
                        `ui.panel.config.cloud.login.${i18nBase}_title`
                      )}
                    </div>
                    <p>
                      ${this.hass.localize(
                        `ui.panel.config.cloud.login.${i18nBase}_body`
                      )}
                    </p>
                  </div>
                </ha-card>
              `
            )}
          </div>

          <p class="footnote">
            ${this.hass.localize("ui.panel.config.cloud.login.introduction2")}
            <a href="https://www.nabucasa.com" target="_blank" rel="noreferrer">
              Nabu&nbsp;Casa,&nbsp;Inc</a
            >${this.hass.localize("ui.panel.config.cloud.login.introduction2a")}
          </p>
        </div>
      </hass-subpage>
    `;
  }

  private _handleSignIn() {
    this._dismissFlash();
    navigate("/config/cloud/login");
  }

  private _handleRegister() {
    this._dismissFlash();
    navigate("/config/cloud/register");
  }

  private _dismissFlash() {
    fireEvent(this, "flash-message-changed", { value: "" });
  }

  private _handleMenuAction(ev: HaDropdownSelectEvent) {
    const value = ev.detail.item.value;
    switch (value) {
      case "reset":
        this._deleteCloudData();
        break;
      case "download":
        this._downloadSupportPackage();
        break;
    }
  }

  private async _deleteCloudData() {
    const confirm = await showConfirmationDialog(this, {
      title: this.hass.localize(
        "ui.panel.config.cloud.account.reset_data_confirm_title"
      ),
      text: this.hass.localize(
        "ui.panel.config.cloud.account.reset_data_confirm_text"
      ),
      confirmText: this.hass.localize("ui.panel.config.cloud.account.reset"),
      destructive: true,
    });
    if (!confirm) {
      return;
    }
    try {
      await removeCloudData(this.hass);
    } catch (err: any) {
      showAlertDialog(this, {
        title: this.hass.localize(
          "ui.panel.config.cloud.account.reset_data_failed"
        ),
        text: err?.message,
      });
      return;
    } finally {
      fireEvent(this, "ha-refresh-cloud-status");
    }
  }

  private async _downloadSupportPackage() {
    showSupportPackageDialog(this);
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
          container-type: inline-size;
        }
        ha-card {
          width: 100%;
          margin-bottom: 0;
        }
        .feature-grid,
        .footnote,
        ha-alert {
          display: block;
          width: 100%;
          max-width: 600px;
          margin-inline: auto;
        }
        .hero {
          padding: var(--ha-space-6) var(--ha-space-4) var(--ha-space-5);
        }
        .hero h2 {
          margin: 0;
          font-size: var(--ha-font-size-2xl);
          font-weight: var(--ha-font-weight-normal);
          line-height: var(--ha-line-height-condensed);
        }
        .hero .lead {
          margin: var(--ha-space-2) 0 0;
          line-height: var(--ha-line-height-normal);
          color: var(--secondary-text-color);
          text-wrap: pretty;
        }
        .hero-actions {
          display: flex;
          flex-direction: row-reverse;
          justify-content: flex-start;
          align-items: center;
          gap: var(--ha-space-2);
          margin-top: var(--ha-space-5);
        }
        .trial-note {
          margin: var(--ha-space-3) 0 0;
          font-size: var(--ha-font-size-s);
          color: var(--secondary-text-color);
        }
        .funding-section {
          box-sizing: border-box;
          width: 100%;
          max-width: 600px;
          margin-inline: auto;
          margin-block: var(--ha-space-2);
          display: flex;
          gap: var(--ha-space-3);
          align-items: flex-start;
          padding-inline: var(--ha-space-4);
        }
        .funding-section img {
          height: 28px;
          flex-shrink: 0;
        }
        .funding-section p {
          margin: 0;
          color: var(--secondary-text-color);
          line-height: var(--ha-line-height-normal);
          text-wrap: pretty;
        }
        .icon-tile {
          width: 40px;
          height: 40px;
          border-radius: var(--ha-border-radius-pill);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon-tile.blue {
          background: color-mix(in srgb, var(--blue-color) 15%, transparent);
          color: var(--blue-color);
        }
        .icon-tile.green {
          background: color-mix(in srgb, var(--green-color) 15%, transparent);
          color: var(--green-color);
        }
        .icon-tile.cyan {
          background: color-mix(in srgb, var(--cyan-color) 15%, transparent);
          color: var(--cyan-color);
        }
        .icon-tile.purple {
          background: color-mix(in srgb, var(--purple-color) 15%, transparent);
          color: var(--purple-color);
        }
        .icon-tile.primary {
          background: color-mix(in srgb, var(--primary-color) 15%, transparent);
          color: var(--primary-color);
        }
        .feature-lead {
          display: flex;
          gap: var(--ha-space-3);
          padding: var(--ha-space-4);
        }
        .feature-title {
          font-size: var(--ha-font-size-l);
          font-weight: var(--ha-font-weight-medium);
        }
        .feature-title.small {
          font-size: var(--ha-font-size-m);
        }
        .feature-text p,
        .feature-cell p {
          margin: var(--ha-space-1) 0 0;
          color: var(--secondary-text-color);
          line-height: var(--ha-line-height-normal);
          text-wrap: pretty;
        }
        .feature-cell p {
          font-size: var(--ha-font-size-s);
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--ha-space-4);
        }
        .feature-cell {
          display: flex;
          flex-direction: column;
          gap: var(--ha-space-2);
          padding: var(--ha-space-4);
        }
        .footnote {
          margin-block: 0;
          font-size: var(--ha-font-size-s);
          color: var(--secondary-text-color);
          text-align: center;
        }
        .footnote a {
          color: var(--primary-color);
        }
        @container (max-width: 560px) {
          .feature-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @container (max-width: 450px) {
          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .hero-actions ha-button {
            width: 100%;
            --ha-button-height: 48px;
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-login-panel": CloudLoginPanel;
  }

  interface HASSDomEvents {
    "cloud-email-changed": { value: string };
    "flash-message-changed": { value: string };
  }
}
