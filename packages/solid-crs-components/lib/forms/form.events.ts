import { Action, assign } from 'xstate';
import { Event } from '../state/event';
import { FormValidatorResult } from './form-validator-result';
import { FormContext } from './form.machine';

/**
 * Event references for the form machine, with readable log format.
 */
export enum FormEvents {
  FORM_UPDATED = '[FormEvent: Updated element]',
  FORM_SUBMITTED = '[FormEvent: Submitted]',
  FORM_VALIDATED = '[FormEvent: Validated]',
}

/**
 * Event interfaces for the form machine, with their payloads.
 */

/**
 * Event dispatched when a form element was updated.
 */
export interface FormUpdatedEvent extends Event<FormEvents> {
  type: FormEvents.FORM_UPDATED;
  field: string; value: string|string[];
}

/**
 * Event dispatched when a form was submitted.
 */
export interface FormSubmittedEvent extends Event<FormEvents> {
  type: FormEvents.FORM_SUBMITTED;
}

/**
 * Event dispatched when a form was validated.
 */
export interface FormValidatedEvent extends Event<FormEvents> {
  type: FormEvents.FORM_VALIDATED;
  results: FormValidatorResult[];
}

/**
 * Union type for all form events.
 */
export type FormEvent = FormUpdatedEvent | FormSubmittedEvent | FormValidatedEvent;

/**
 * Actions for the form component.
 */

/**
 * Updates the data in context.
 */
export const update = assign<FormContext<unknown>, FormUpdatedEvent>({
  data: (context: FormContext<unknown>, event: FormUpdatedEvent) =>
    (typeof context.data === 'object' ? { ...context.data ? context.data : {}, [event.field]: event.value } : event.value),
});

/**
 * Adds validation data to context.
 */
export const addValidationResults = assign<FormContext<unknown>, FormValidatedEvent>({
  validation: (context, event: FormValidatedEvent) => [ ...event.results ],
});
