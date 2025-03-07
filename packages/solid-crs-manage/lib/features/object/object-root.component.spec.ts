import { ComponentMetadata } from '@digita-ai/semcom-core';
import { Alert } from '@netwerk-digitaal-erfgoed/solid-crs-components';
import { ArgumentError, CollectionObjectMemoryStore, ConsoleLogger, LoggerLevel, MemoryTranslator, Collection, CollectionObject, CollectionMemoryStore } from '@netwerk-digitaal-erfgoed/solid-crs-core';
import { ObjectImageryComponent } from '@netwerk-digitaal-erfgoed/solid-crs-semcom-components';
import { interpret, Interpreter } from 'xstate';
import { AppEvents, DismissAlertEvent } from '../../app.events';
import { appMachine } from '../../app.machine';
import { SolidMockService } from '../../common/solid/solid-mock.service';
import { ObjectRootComponent } from './object-root.component';
import { ObjectEvents } from './object.events';
import { ObjectContext, objectMachine, ObjectStates } from './object.machine';

describe('ObjectRootComponent', () => {

  let component: ObjectRootComponent;
  let machine: Interpreter<ObjectContext>;

  const collection1: Collection = {
    uri: 'object-uri-1',
    name: 'Object 1',
    description: 'This is object 1',
    objectsUri: null,
    distribution: null,
  };

  const collection2: Collection = {
    uri: 'object-uri-2',
    name: 'Object 2',
    description: 'This is object 2',
    objectsUri: null,
    distribution: null,
  };

  const object1: CollectionObject = {
    uri: 'object-uri-1',
    name: 'Object 1',
    description: 'This is object 1',
    image: null,
    subject: null,
    type: null,
    updated: '0',
    collection: 'collection-uri-1',
  };

  beforeEach(() => {

    const collectionStore = new CollectionMemoryStore([ collection1, collection2 ]);

    const objectStore = new CollectionObjectMemoryStore([
      object1,
    ]);

    machine = interpret(objectMachine(objectStore)
      .withContext({
        object: object1,
        collections: [ collection1, collection2 ],
      }));

    machine.parent = interpret(appMachine(
      new SolidMockService(new ConsoleLogger(LoggerLevel.silly, LoggerLevel.silly)),
      collectionStore,
      objectStore,
      { ...collection1 },
      { ...object1 },
    ).withContext({
      collections: [ collection1, collection2 ],
      alerts: [],
    }));

    component = window.document.createElement('nde-object-root') as ObjectRootComponent;

    component.actor = machine;

    component.translator = new MemoryTranslator([], 'nl-NL');

    component.object = object1;

    component.collections = [ collection1, collection2 ];

  });

  afterEach(() => {

    document.getElementsByTagName('html')[0].innerHTML = '';

  });

  it('should be correctly instantiated', () => {

    expect(component).toBeTruthy();

  });

  it('should not throw when running updated with null', () => {

    expect(() => component.updated(null)).not.toThrow();

  });

  it('should show alerts when set', async () => {

    component.alerts = [ {
      type: 'success',
      message: 'Foo',
    } ];

    window.document.body.appendChild(component);
    await component.updateComplete;

    const alerts = window.document.body.getElementsByTagName('nde-object-root')[0].shadowRoot.querySelectorAll('nde-alert');

    expect(alerts).toBeTruthy();
    expect(alerts.length).toBe(1);

  });

  it('should not show alerts when unset', async () => {

    component.alerts = null;

    window.document.body.appendChild(component);
    await component.updateComplete;

    const alerts = window.document.body.getElementsByTagName('nde-object-root')[0].shadowRoot.querySelectorAll('nde-alert');

    expect(alerts).toBeTruthy();
    expect(alerts.length).toBe(0);

  });

  it('should send event when delete is clicked', async () => {

    machine.start();
    machine.send(ObjectEvents.SELECTED_OBJECT, { object: collection1 });

    window.document.body.appendChild(component);
    await component.updateComplete;

    machine.onTransition((state) => {

      machine.send = jest.fn();

      if(state.matches(ObjectStates.IDLE) && state.context?.object) {

        const button = window.document.body.getElementsByTagName('nde-object-root')[0].shadowRoot.querySelector('.delete') as HTMLElement;

        if(button) {

          button.click();

          expect(machine.send).toHaveBeenCalledTimes(1);

        }

      }

    });

  });

  it('should send event when create is clicked', async () => {

    machine.start();
    machine.send(ObjectEvents.SELECTED_OBJECT, { object: collection1 });

    window.document.body.appendChild(component);
    await component.updateComplete;

    machine.onTransition((state) => {

      machine.send = jest.fn();

      if(state.matches(ObjectStates.IDLE) && state.context?.object) {

        const button = window.document.body.getElementsByTagName('nde-object-root')[0].shadowRoot.querySelector('.create') as HTMLElement;

        if(button) {

          button.click();

          expect(machine.send).toHaveBeenCalledTimes(1);

        }

      }

    });

  });

  it('should only show save and cancel buttons when form is dirty', async () => {

    machine.start();

    window.document.body.appendChild(component);
    await component.updateComplete;

    const save = window.document.body.getElementsByTagName('nde-object-root')[0].shadowRoot.querySelector('.save') as HTMLElement;
    const cancel = window.document.body.getElementsByTagName('nde-object-root')[0].shadowRoot.querySelector('.cancel') as HTMLElement;

    expect(save).toBeFalsy();
    expect(cancel).toBeFalsy();

  });

  it('should select sidebar item when content is scrolled', async () => {

    window.document.body.appendChild(component);
    await component.updateComplete;

    const div = document.createElement('div');
    div.id = 'nde.features.object.sidebar.image';

    component.formCards = [ div ];

    const content = window.document.body.getElementsByTagName('nde-object-root')[0].shadowRoot.querySelector('.content') as HTMLElement;
    content.dispatchEvent(new CustomEvent('scroll'));
    await component.updateComplete;

    expect(component.visibleCard).toBeTruthy();

  });

  describe('updateSelected()', () => {

    it('should set this.visibleCard to the currently visible card', async () => {

      window.document.body.appendChild(component);
      await component.updateComplete;

      const div = document.createElement('div');
      div.id = 'nde.features.object.sidebar.image';

      component.formCards = [ div ];

      component.updateSelected();
      await component.updateComplete;

      expect(component.visibleCard).toBeTruthy();
      expect(component.visibleCard).toEqual(component.formCards[0].id);

    });

  });

  describe('handleDismiss', () => {

    const alert: Alert = { message: 'foo', type: 'success' };

    it('should throw error when event is null', async () => {

      window.document.body.appendChild(component);
      await component.updateComplete;

      expect(() => component.handleDismiss(null)).toThrow(ArgumentError);

    });

    it('should throw error when actor is null', async () => {

      component.actor = null;

      window.document.body.appendChild(component);
      await component.updateComplete;

      expect(() => component.handleDismiss({ detail: alert } as CustomEvent<Alert>)).toThrow(ArgumentError);

    });

    it('should send dismiss alert event to parent', async (done) => {

      machine.start();
      machine.parent.start();

      window.document.body.appendChild(component);
      await component.updateComplete;

      machine.parent.onEvent((event) => {

        if(event && event.type === AppEvents.DISMISS_ALERT) {

          expect((event as DismissAlertEvent).alert).toEqual(alert);
          done();

        }

      });

      component.handleDismiss({ detail: alert } as CustomEvent<Alert>);

    });

  });

  it('should update subscription when formActor is updated', async () => {

    machine.start();

    window.document.body.appendChild(component);
    await component.updateComplete;

    component.subscribe = jest.fn();

    const div = document.createElement('div');
    div.id = 'nde.features.object.sidebar.image';

    component.formCards = [ div ];

    const map = new Map<string, string>();
    map.set('actor', 'bla');
    map.set('formActor', 'bla');

    await component.updated(map);

    expect(component.subscribe).toHaveBeenCalledTimes(11);

  });

  it('should set formCard attributes when updated is called', async () => {

    machine.start();

    window.document.body.appendChild(component);
    await component.updateComplete;

    customElements.define('nde-object-imagery', ObjectImageryComponent);
    const div = document.createElement('nde-object-imagery') as ObjectImageryComponent;
    div.id = 'nde.features.object.sidebar.image';

    component.formCards = [ div ];

    const map = new Map<string, string>();
    map.set('actor', 'bla');
    map.set('formActor', 'bla');

    await component.updated(map);

    expect(div.object).toBeTruthy();

  });

  it('should create customElements for this.components', async () => {

    window.eval = jest.fn(() => ObjectImageryComponent);
    customElements.define = jest.fn((tag, module) => ObjectImageryComponent);

    machine.start();

    window.document.body.appendChild(component);
    await component.updateComplete;

    component.components = [
      {
        description: 'Digita SemCom component voor beeldmateriaal informatie.',
        label: 'Erfgoedobject Beeldmateriaal',
        uri: 'http://localhost:3004/object-imagery.component.js',
        shapes: [ 'http://xmlns.com/foaf/0.1/PersonalProfileDocument' ],
        author: 'https://digita.ai',
        tag: 'nde-object-imagery',
        version: '0.1.0',
        latest: true,
      },
      {
        description: 'Digita SemCom component voor identificatie informatie.',
        label: 'Erfgoedobject Identificatie',
        uri: 'http://localhost:3004/object-identification.component.js',
        shapes: [ 'http://xmlns.com/foaf/0.1/PersonalProfileDocument' ],
        author: 'https://digita.ai',
        tag: 'nde-object-identification',
        version: '0.1.0',
        latest: true,
      },
      {
        description: 'Digita SemCom component voor vervaardiging informatie.',
        label: 'Erfgoedobject Vervaardiging',
        uri: 'http://localhost:3004/object-creation.component.js',
        shapes: [ 'http://xmlns.com/foaf/0.1/PersonalProfileDocument' ],
        author: 'https://digita.ai',
        tag: 'nde-object-creation',
        version: '0.1.0',
        latest: true,
      },
      {
        description: 'Digita SemCom component voor voorstellingsinformatie.',
        label: 'Erfgoedobject Voorstelling',
        uri: 'http://localhost:3004/object-representation.component.js',
        shapes: [ 'http://digita.ai/voc/input#input' ],
        author: 'https://digita.ai',
        tag: 'nde-object-representation',
        version: '0.1.0',
        latest: true,
      },
      {
        description: 'Digita SemCom component voor afmeting informatie.',
        label: 'Erfgoedobject Afmetingen',
        uri: 'http://localhost:3004/object-dimensions.component.js',
        shapes: [ 'http://digita.ai/voc/payslip#payslip' ],
        author: 'https://digita.ai',
        tag: 'nde-object-dimensions',
        version: '0.1.0',
        latest: true,
      },
    ];

    const map = new Map<string, string>();
    map.set('actor', 'bla');
    map.set('formActor', 'bla');

    await component.updated(map);

  });

});
