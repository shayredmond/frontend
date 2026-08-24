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
  mdiHandHeart,
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

// The full USP list shown in the right-hand column. A single flat list keeps
// the value props from fighting for attention (design review, Aug 2026).
const USPS = [
  [mdiHandHeart, "red", "feature_support"],
  [mdiEarth, "blue", "feature_remote"],
  [mdiBackupRestore, "green", "feature_backup"],
  [mdiMicrophoneMessage, "cyan", "feature_voice_control"],
  [mdiMicrophone, "purple", "feature_voice_quality"],
  [mdiCellphone, "primary", "feature_companion"],
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
          <div class="landing">
            <div class="pitch">
              <h2>
                ${this.hass.localize("ui.panel.config.cloud.login.hero_title")}
              </h2>
              <p class="lead">
                ${this.hass.localize("ui.panel.config.cloud.login.hero_lead")}
              </p>
            </div>

            <ha-card outlined class="usps">
              <div class="card-content usp-list">
                ${USPS.map(
                  ([icon, tint, i18nBase]) => html`
                    <div class="usp">
                      <div class="icon-tile ${tint}">
                        <ha-svg-icon .path=${icon}></ha-svg-icon>
                      </div>
                      <div class="usp-text">
                        <div class="usp-title">
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
                    </div>
                  `
                )}
              </div>
            </ha-card>

            <div class="actions">
              <div class="action-buttons">
                <ha-button
                  size="l"
                  appearance="accent"
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
          min-height: 100%;
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
        ha-alert {
          display: block;
          width: 100%;
          max-width: 600px;
          margin-inline: auto;
        }

        /* Mobile-first: a single stacked column. */
        .landing {
          display: flex;
          flex-direction: column;
          gap: var(--ha-space-5);
          width: 100%;
          max-width: 600px;
          margin-inline: auto;
        }
        .pitch h2 {
          margin: 0;
          font-size: var(--ha-font-size-2xl);
          font-weight: var(--ha-font-weight-normal);
          line-height: var(--ha-line-height-condensed);
          /* haStyle truncates h2 to one line; let the hero title wrap. */
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
          text-wrap: balance;
        }
        .pitch .lead {
          margin: var(--ha-space-2) 0 0;
          line-height: var(--ha-line-height-normal);
          color: var(--secondary-text-color);
          text-wrap: pretty;
        }

        .usp-list {
          display: flex;
          flex-direction: column;
          gap: var(--ha-space-5);
          padding: var(--ha-space-5) var(--ha-space-4);
        }
        .usp {
          display: flex;
          gap: var(--ha-space-3);
          align-items: flex-start;
        }
        .usp-title {
          font-size: var(--ha-font-size-m);
          font-weight: var(--ha-font-weight-medium);
        }
        .usp-text p {
          margin: var(--ha-space-1) 0 0;
          font-size: var(--ha-font-size-s);
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
        .icon-tile.red {
          background: color-mix(in srgb, var(--red-color) 15%, transparent);
          color: var(--red-color);
        }

        /* Nabu Casa attribution: a muted footer below everything, spanning
           the full page width. */
        .footnote {
          margin: 0;
          width: 100%;
          max-width: 960px;
          /* Push the footer to the very bottom of the page. */
          margin-top: auto;
          margin-inline: auto;
          font-size: var(--ha-font-size-s);
          color: var(--secondary-text-color);
          text-align: center;
          text-wrap: pretty;
        }
        .footnote a {
          color: var(--primary-color);
        }

        /* Sticky bottom bar on mobile so the primary CTA stays reachable
           while scrolling the USPs. */
        .actions {
          position: sticky;
          bottom: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: var(--ha-space-2);
          padding: var(--ha-space-3) 0
            calc(var(--safe-area-inset-bottom) + var(--ha-space-3));
          background: var(--primary-background-color);
          box-shadow: 0 -1px 0 var(--divider-color);
        }
        .action-buttons {
          display: flex;
          gap: var(--ha-space-2);
        }
        .action-buttons ha-button {
          flex: 1;
          --ha-button-height: 48px;
        }
        .trial-note {
          margin: 0;
          font-size: var(--ha-font-size-s);
          color: var(--secondary-text-color);
          text-align: center;
        }

        /* Desktop: split actions (left) from the USP list (right). */
        @container (min-width: 700px) {
          .landing {
            display: grid;
            grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
            grid-template-rows: auto auto 1fr;
            column-gap: var(--ha-space-7);
            row-gap: var(--ha-space-6);
            align-items: start;
            max-width: 960px;
          }
          .pitch {
            grid-column: 1;
            grid-row: 1;
          }
          .actions {
            grid-column: 1;
            grid-row: 2;
            position: static;
            padding: 0;
            background: none;
            box-shadow: none;
          }
          .usps {
            grid-column: 2;
            grid-row: 1 / 4;
          }
          .action-buttons {
            flex-direction: column;
            max-width: 340px;
          }
          .action-buttons ha-button {
            flex: initial;
            width: 100%;
          }
          .trial-note {
            text-align: start;
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
