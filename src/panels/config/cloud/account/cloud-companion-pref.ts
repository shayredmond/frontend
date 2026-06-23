import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import "../../../../components/ha-button";
import "../../../../components/ha-card";
import "../../../../layouts/hass-subpage";
import { haStyle } from "../../../../resources/styles";
import type { HomeAssistant } from "../../../../types";

@customElement("cloud-companion-pref")
export class CloudCompanionPref extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public narrow = false;

  protected render() {
    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        header="Companion app"
        back-path="/config/cloud/account"
      >
        <div class="content">
          <ha-card outlined header="Stay connected away from home">
            <div class="card-content">
              <p>
                With Home Assistant Cloud, the Home Assistant app keeps talking
                to your home even when you are away, so the data your
                automations rely on stays current wherever you are.
              </p>
              <ul>
                <li>
                  Up-to-date sensors and location, even when you are away from
                  home.
                </li>
                <li>
                  Presence automations like "I just left home" keep running
                  while you are out.
                </li>
                <li>
                  Alerts that depend on your phone, like "battery low", keep
                  firing on time.
                </li>
                <li>
                  Everything travels over a secure connection, with no port
                  forwarding and nothing on your network exposed.
                </li>
                <li>
                  Push notifications are separate. They are delivered by Apple
                  and Google and reach your phone even without this connection.
                </li>
              </ul>
            </div>
            <div class="card-actions">
              <ha-button
                appearance="plain"
                href="https://companion.home-assistant.io/"
                target="_blank"
                rel="noreferrer"
              >
                Learn more
              </ha-button>
            </div>
          </ha-card>

          <ha-card outlined header="Automatic webhook">
            <div class="card-content">
              <p>
                When you set up the Home Assistant app, it registers a webhook
                automatically. With your cloud subscription that becomes a
                cloudhook, a unique secret URL hosted on Home Assistant Cloud.
              </p>
              <p>
                Your phone uses it to send location and sensor updates back home
                from anywhere, without opening ports or exposing your instance.
                You will see it listed under Webhooks; there is no need to
                manage it yourself.
              </p>
            </div>
          </ha-card>
        </div>
      </hass-subpage>
    `;
  }

  static styles = [
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
      .card-content p,
      .card-content li {
        color: var(--secondary-text-color);
      }
      ul {
        padding-left: var(--ha-space-6);
        padding-inline-start: var(--ha-space-6);
        padding-inline-end: initial;
        margin: 0;
      }
      li {
        margin-bottom: var(--ha-space-2);
      }
      .card-actions {
        display: flex;
        justify-content: flex-end;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-companion-pref": CloudCompanionPref;
  }
}
