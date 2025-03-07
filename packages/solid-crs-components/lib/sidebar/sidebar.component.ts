import { css, html, property, unsafeCSS } from 'lit-element';
import { Translator, Logger } from '@netwerk-digitaal-erfgoed/solid-crs-core';
import { RxLitElement } from 'rx-lit';
import { Theme } from '@netwerk-digitaal-erfgoed/solid-crs-theme';

/**
 * A component which represents a sidebar.
 */
export class SidebarComponent extends RxLitElement {

  /**
   * The component's translator.
   */
  @property({ type: Translator })
  public translator: Translator;

  /**
   * The component's translator.
   */
  @property({ type: Logger })
  public logger: Logger;

  /**
   * Display inverted colors
   */
  @property({ type: Boolean })
  public inverse = false;

  /**
   * Renders the component as HTML.
   *
   * @returns The rendered HTML of the component.
   */
  render() {

    return html`
    <div class="sidebar${this.inverse ? ' inverse' : ''} primary">
      <slot></slot>
    </div>
  `;

  }

  /**
   * The styles associated with the component.
   */
  static get styles() {

    return [
      unsafeCSS(Theme),
      css`
        :host {
          width: var(--size-sidebar);
        }
        .sidebar {
          flex: 1 0;
        }
        .sidebar.primary slot {
          height: 100%;
          max-height: inherit;
          display: flex;
          flex-direction: column;
          gap: var(--gap-normal);
          background-color: var(--colors-foreground-inverse);
          color: var(--colors-primary-dark);
        }
        .sidebar.inverse slot {
          background-color: var(--colors-primary-dark);
          color: var(--colors-foreground-inverse);
        }
      `,
    ];

  }

}
