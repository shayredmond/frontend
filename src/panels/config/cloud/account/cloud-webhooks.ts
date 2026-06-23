import type { CSSResultGroup, PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { isComponentLoaded } from "../../../../common/config/is_component_loaded";
import "../../../../components/ha-button";
import "../../../../components/ha-card";
import "../../../../components/ha-spinner";
import "../../../../components/ha-switch";
import "../../../../components/item/ha-row-item";
import type { CloudStatusLoggedIn, CloudWebhook } from "../../../../data/cloud";
import { createCloudhook, deleteCloudhook } from "../../../../data/cloud";
import type { Webhook, WebhookError } from "../../../../data/webhook";
import { fetchWebhooks } from "../../../../data/webhook";
import "../../../../layouts/hass-subpage";
import { haStyle } from "../../../../resources/styles";
import type { HomeAssistant } from "../../../../types";
import { showManageCloudhookDialog } from "../dialog-manage-cloudhook/show-dialog-manage-cloudhook";

@customElement("cloud-webhooks")
export class CloudWebhooks extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ type: Boolean }) public narrow = false;

  @property({ attribute: false }) public cloudStatus?: CloudStatusLoggedIn;

  @state() private _cloudHooks?: Record<string, CloudWebhook>;

  @state() private _localHooks?: Webhook[];

  @state() private _mobileHooks?: Webhook[];

  @state() private _progress: string[] = [];

  public connectedCallback() {
    super.connectedCallback();
    this._fetchData();
  }

  protected render() {
    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        .header=${this.hass!.localize(
          "ui.panel.config.cloud.account.webhooks.title"
        )}
        back-path="/config/cloud/account"
      >
        <div class="content">
          <ha-card
            outlined
            header=${this.hass!.localize(
              "ui.panel.config.cloud.account.webhooks.title"
            )}
          >
            <div class="card-content">
              <p>
                ${this.hass!.localize(
                  "ui.panel.config.cloud.account.webhooks.info"
                )}
              </p>
              ${!this.cloudStatus ||
              !this._localHooks ||
              !this._cloudHooks ||
              !this.hass
                ? html`
                    <div class="body-text">
                      ${this.hass!.localize(
                        "ui.panel.config.cloud.account.webhooks.loading"
                      )}
                    </div>
                  `
                : this._localHooks.length === 0
                  ? html`
                      <div class="body-text">
                        ${this.hass.localize(
                          "ui.panel.config.cloud.account.webhooks.no_hooks_yet"
                        )}
                        <a href="/config/integrations"
                          >${this.hass.localize(
                            "ui.panel.config.cloud.account.webhooks.no_hooks_yet_link_integration"
                          )}
                        </a>
                        ${this.hass.localize(
                          "ui.panel.config.cloud.account.webhooks.no_hooks_yet2"
                        )}
                        <a href="/config/automation/edit/new"
                          >${this.hass.localize(
                            "ui.panel.config.cloud.account.webhooks.no_hooks_yet_link_automation"
                          )}</a
                        >.
                      </div>
                    `
                  : this._localHooks.map((entry) => this._renderHookRow(entry))}
            </div>
            <div class="card-actions">
              <ha-button
                appearance="plain"
                href="https://www.nabucasa.com/config/webhooks"
                target="_blank"
                rel="noreferrer"
              >
                ${this.hass!.localize(
                  "ui.panel.config.cloud.account.webhooks.link_learn_more"
                )}
              </ha-button>
            </div>
          </ha-card>

          ${this._mobileHooks && this._mobileHooks.length
            ? html`
                <ha-card outlined header="Companion app webhooks">
                  <div class="card-content">
                    <p>
                      The Home Assistant app creates one of these automatically
                      for each device you connect. With your cloud subscription
                      they become cloudhooks, so your phone can send location
                      and sensor updates home from anywhere.
                    </p>
                    ${this._mobileHooks.map((entry) =>
                      this._renderHookRow(entry)
                    )}
                  </div>
                </ha-card>
              `
            : nothing}

          <ha-card outlined header="What you can do with webhooks">
            <div class="card-content">
              <p>
                Let an outside service send data into Home Assistant to trigger
                an automation. Each gets its own secret URL, with no open ports.
              </p>
              <ul class="examples">
                <li>
                  A Netatmo camera spots motion and Home Assistant reacts
                  instantly. The integration sets up its own webhook
                  automatically.
                </li>
                <li>
                  A location app like OwnTracks reports you are home and runs
                  your arrival automation.
                </li>
                <li>
                  An IFTTT applet or Node-RED flow triggers a scene or device.
                </li>
                <li>
                  Tapping an NFC tag or running a phone shortcut fires an
                  automation.
                </li>
                <li>An incoming SMS through Twilio kicks off an automation.</li>
              </ul>
              <p class="note">
                Treat webhook URLs like passwords, and avoid wiring them to
                anything risky like unlocking a door.
              </p>
            </div>
          </ha-card>
        </div>
      </hass-subpage>
    `;
  }

  protected updated(changedProps: PropertyValues<this>) {
    super.updated(changedProps);
    if (changedProps.has("cloudStatus") && this.cloudStatus) {
      this._cloudHooks = this.cloudStatus.prefs.cloudhooks || {};
    }
  }

  private _renderHookRow(entry: Webhook) {
    return html`
      <ha-row-item .entry=${entry}>
        <span slot="headline"
          >${entry.name}
          ${entry.domain !== entry.name.toLowerCase()
            ? ` (${entry.domain})`
            : ""}</span
        >
        <span slot="supporting-text">${entry.webhook_id}</span>
        ${this._progress.includes(entry.webhook_id)
          ? html`
              <div class="progress" slot="end">
                <ha-spinner></ha-spinner>
              </div>
            `
          : this._cloudHooks?.[entry.webhook_id]
            ? html`
                <ha-button
                  slot="end"
                  appearance="plain"
                  size="small"
                  @click=${this._handleManageButton}
                >
                  ${this.hass!.localize(
                    "ui.panel.config.cloud.account.webhooks.manage"
                  )}
                </ha-button>
              `
            : html`<ha-switch
                slot="end"
                @click=${this._enableWebhook}
              ></ha-switch>`}
      </ha-row-item>
    `;
  }

  private _showDialog(webhookId: string) {
    const webhook = [
      ...(this._localHooks ?? []),
      ...(this._mobileHooks ?? []),
    ].find((ent) => ent.webhook_id === webhookId)!;
    const cloudhook = this._cloudHooks![webhookId];
    showManageCloudhookDialog(this, {
      webhook,
      cloudhook,
      disableHook: () => this._disableWebhook(webhookId),
    });
  }

  private _handleManageButton(ev: MouseEvent) {
    const entry = (ev.currentTarget as any).parentElement.entry as Webhook;
    this._showDialog(entry.webhook_id);
  }

  private async _enableWebhook(ev: MouseEvent) {
    const entry = (ev.currentTarget as any).parentElement!.entry as Webhook;
    this._progress = [...this._progress, entry.webhook_id];
    let updatedWebhook;

    try {
      updatedWebhook = await createCloudhook(this.hass!, entry.webhook_id);
    } catch (err: any) {
      alert((err as WebhookError).message);
      return;
    } finally {
      this._progress = this._progress.filter((wid) => wid !== entry.webhook_id);
    }

    this._cloudHooks = {
      ...this._cloudHooks,
      [entry.webhook_id]: updatedWebhook,
    };

    // Only open dialog if we're not also enabling others, otherwise it's confusing
    if (this._progress.length === 0) {
      this._showDialog(entry.webhook_id);
    }
  }

  private async _disableWebhook(webhookId: string) {
    this._progress = [...this._progress, webhookId];
    try {
      await deleteCloudhook(this.hass!, webhookId!);
    } catch (err: any) {
      alert(
        `${this.hass!.localize(
          "ui.panel.config.cloud.account.webhooks.disable_hook_error_msg"
        )} ${(err as WebhookError).message}`
      );
      return;
    } finally {
      this._progress = this._progress.filter((wid) => wid !== webhookId);
    }

    // Remove cloud related parts from entry.
    const { [webhookId]: disabledHook, ...newHooks } = this._cloudHooks!;
    this._cloudHooks = newHooks;
  }

  private async _fetchData() {
    if (!isComponentLoaded(this.hass!.config, "webhook")) {
      this._localHooks = [];
      this._mobileHooks = [];
      return;
    }
    const hooks = await fetchWebhooks(this.hass!);
    const relevant = hooks.filter(
      (hook) =>
        // Only hooks that are not limited to local requests are relevant
        !hook.local_only &&
        // Deleted mobile app webhooks -> nobody cares :)
        (hook.domain !== "mobile_app" || hook.name !== "Deleted Webhook")
    );
    // Mobile app webhooks are created automatically and shown in their own card.
    this._localHooks = relevant.filter((hook) => hook.domain !== "mobile_app");
    this._mobileHooks = relevant.filter((hook) => hook.domain === "mobile_app");
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      css`
        .content {
          padding: 28px 20px 0;
          max-width: 1040px;
          margin: 0 auto;
        }
        ha-card {
          display: block;
          max-width: 600px;
          margin: 0 auto;
          margin-bottom: var(--ha-space-6);
        }
        .card-content p {
          color: var(--secondary-text-color);
        }
        .body-text {
          padding: var(--ha-space-2) 0;
        }
        .body-text a {
          color: var(--primary-color);
        }
        .examples {
          color: var(--secondary-text-color);
          padding-inline-start: var(--ha-space-5);
        }
        .examples li {
          margin-bottom: var(--ha-space-1);
        }
        .note {
          font-size: var(--ha-font-size-s);
        }
        .progress {
          margin-right: var(--ha-space-4);
          margin-inline-end: var(--ha-space-4);
          margin-inline-start: initial;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .card-actions {
          display: flex;
          justify-content: flex-end;
        }
        ha-row-item {
          --ha-row-item-padding-inline: 0;
        }
        ha-row-item::part(headline),
        ha-row-item::part(supporting-text) {
          white-space: wrap;
          word-break: break-all;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-webhooks": CloudWebhooks;
  }
}
