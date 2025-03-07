import { CSSResult, html, internalProperty, property, PropertyValues, TemplateResult, unsafeCSS } from 'lit-element';
import { ArgumentError, Collection, MemoryTranslator, Translator } from '@netwerk-digitaal-erfgoed/solid-crs-core';
import { interpret, Interpreter } from 'xstate';
import { RxLitElement } from 'rx-lit';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dropdown, Login, Search, Theme } from '@netwerk-digitaal-erfgoed/solid-crs-theme';
import { unsafeSVG } from 'lit-html/directives/unsafe-svg';
import { FormCleanlinessStates, FormContext, formMachine, FormRootStates, FormSubmissionStates, FormValidationStates } from '../forms/form.machine';
import { FormEvents } from '../forms/form.events';
import { FormValidator } from '../forms/form-validator';
import { FormSubmitter } from '../forms/form-submitter';

/**
 * Validates the form and returns its results.
 *
 * @param context The form machine state's context.
 * @param event The event which triggered the validation.
 * @returns Results of the validation.
 */
export const validator: FormValidator<Collection> = async (context) => ([
  ...context.data && context.data.name ? [] : [ { field: 'name', message: 'demo-form.name.required' } ],
  ...context.data && context.data.uri ? [] : [ { field: 'uri', message: 'demo-form.uri.required' } ],
]);

/**
 * A submitter which resolves after two seconds.
 *
 * @param context The form machine state's context.
 * @param event The event which triggered the validation.
 * @returns Returns a promise.
 */
export const submitter: FormSubmitter<Collection> = () => new Promise((resolve) => {

  setTimeout(resolve, 2000);

});

/**
 * A component which shows the details of a single collection.
 */
export class DemoFormComponent extends RxLitElement {

  /**
   * The component's translator.
   */
  @property({ type: Object })
  public translator: Translator = new MemoryTranslator([
    {
      key: 'demo-form.name.required',
      locale: 'nl-NL',
      value: 'Name is required.',
    },
    {
      key: 'demo-form.uri.required',
      locale: 'nl-NL',
      value: 'URI is required.',
    },
    {
      key: 'nde.common.form.click-to-select',
      locale: 'nl-NL',
      value: 'Klik om te selecteren',
    },
  ], 'nl-NL');

  /**
   * The actor controlling this component.
   */
  @property({ type: Object })
  public actor: Interpreter<FormContext<Partial<Collection>>>;

  /**
   * Enables or disables the submit button.
   */
  @internalProperty()
  enableSubmit = false;

  /**
   * The constructor of the application root component,
   * which starts the root machine actor.
   */
  constructor() {

    super();

    this.actor = interpret(
      formMachine<Partial<unknown>>(validator, submitter).withContext({
        data: { uri: '', name: 'Test', description: 'Test desc', vehicle: [ 'Car' ] },
        original: { uri: '', name: 'Test', description: 'Test desc', vehicle: [ 'Car' ] },
      }),
    );

    this.actor.start();

  }

  /**
   * Hook called on first update after connection to the DOM.
   * It subscribes to the actor and pipes state to the properties.
   */
  firstUpdated(changed: PropertyValues): void {

    super.firstUpdated(changed);

    if (!this.actor) {

      throw new ArgumentError('Argument this.actor should be set.', this.actor);

    }

    this.subscribe('enableSubmit', from(this.actor).pipe(
      map((state) => state.matches({
        [FormSubmissionStates.NOT_SUBMITTED]:{
          [FormRootStates.CLEANLINESS]: FormCleanlinessStates.DIRTY,
          [FormRootStates.VALIDATION]: FormValidationStates.VALID,
        },
      })),
    ));

  }

  /**
   * The styles associated with the component.
   */
  static get styles(): CSSResult[] {

    return [
      unsafeCSS(Theme),
    ];

  }

  /**
   * Renders the component as HTML.
   *
   * @returns The rendered HTML of the component.
   */
  render(): TemplateResult {

    return html`
    <form>
      <nde-form-element .actor="${this.actor}" .translator="${this.translator}" field="uri">
        <label slot="label" for="example">URI</label>
        <div slot="icon">${ unsafeSVG(Search) }</div>
        <input type="text" slot="input" name="example" placeholder="Foo" />
        <button slot="action">${ unsafeSVG(Login) }</button>
        <div slot="help">This isn't helpful</div>
      </nde-form-element>
      <nde-form-element .actor="${this.actor}" .translator="${this.translator}" field="name">
        <label slot="label" for="example">Name</label>
        <div slot="icon">${ unsafeSVG(Search) }</div>
        <input type="text" slot="input" name="example" placeholder="Foo" />
        <div slot="help">This isn't helpful either</div>
      </nde-form-element>
      <nde-form-element .actor="${this.actor}" .translator="${this.translator}" field="vehicle">
        <label slot="label">Vehicle</label>
        <div slot="icon">${ unsafeSVG(Dropdown) }</div>
        <ul slot="input" >
          <li>
            <label for="title"></label>
          </li>
          <li>
            <input type="checkbox" id="Plane" name="Plane" value="Car">
            <label for="Plane">Plane</label>
          </li>
          <li>
            <input type="checkbox" id="Car" name="Car" value="Plane">
            <label for="Car">Car</label>
          </li>
          <li>
            <input type="checkbox" id="Boat" name="Boat" value="Boat">
            <label for="vehicle3">Boat</label>
          </li>
        </ul>
        <div slot="help">This still isn't helpful</div>
      </nde-form-element>

      <button ?disabled="${!this.enableSubmit}" @click="${() => this.actor.send(FormEvents.FORM_SUBMITTED)}">Save changes</button>
    </form>
  `;

  }

}

export default DemoFormComponent;
