import { Alert } from '@netwerk-digitaal-erfgoed/solid-crs-components';
import { ConsoleLogger, LoggerLevel, CollectionObjectMemoryStore, CollectionObject, Collection, CollectionMemoryStore } from '@netwerk-digitaal-erfgoed/solid-crs-core';
import { interpret, Interpreter } from 'xstate';
import { AppEvents, LoggedInEvent } from './app.events';
import { AppContext, AppFeatureStates, appMachine, AppRootStates } from './app.machine';
import { SolidMockService } from './common/solid/solid-mock.service';
import { CollectionEvents } from './features/collection/collection.events';
import { SearchEvents, SearchUpdatedEvent } from './features/search/search.events';

describe('AppMachine', () => {

  const collection1: Collection = {
    uri: 'collection-uri-1',
    name: 'Collection 1',
    description: 'This is collection 1',
    objectsUri: '',
    distribution: '',
  };

  const collection2: Collection = {
    uri: 'collection-uri-2',
    name: 'Collection 2',
    description: 'This is collection 2',
    objectsUri: '',
    distribution: '',
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

  let machine: Interpreter<AppContext>;

  beforeEach(() => {

    machine = interpret(
      appMachine(
        new SolidMockService(new ConsoleLogger(LoggerLevel.silly, LoggerLevel.silly)),
        new CollectionMemoryStore([ collection1, collection2 ]),
        new CollectionObjectMemoryStore([ object1 ]),
        collection1,
        object1
      )
        .withContext({
          alerts: [],
        }),
    );

  });

  it('should be correctly instantiated', () => {

    expect(machine).toBeTruthy();

  });

  it('should add alert to context when sending addAlert', () => {

    const alert = { type: 'success', message: 'foo' };
    machine.start();
    machine.send(AppEvents.ADD_ALERT, { alert });

    expect(machine.state.context.alerts).toBeTruthy();
    expect(machine.state.context.alerts.length).toBe(1);
    expect(machine.state.context.alerts[0]).toEqual(alert);

  });

  it('should not add duplicate alert to context when sending addAlert', () => {

    const alert: Alert = { type: 'success', message: 'foo' };

    machine = interpret<AppContext>(
      appMachine(
        new SolidMockService(new ConsoleLogger(LoggerLevel.silly, LoggerLevel.silly)),
        new CollectionMemoryStore([ collection1, collection2 ]),
        new CollectionObjectMemoryStore([ object1 ]),
        collection1,
        object1
      )
        .withContext({
          alerts: [ alert ],
        }),
    );

    machine.start();
    machine.send(AppEvents.ADD_ALERT, { alert });

    expect(machine.state.context.alerts).toBeTruthy();
    expect(machine.state.context.alerts.length).toBe(1);
    expect(machine.state.context.alerts[0]).toEqual(alert);

  });

  it('should send error event when sending addAlert without payload', async (done) => {

    machine.start();

    machine.onEvent(((event) => {

      if(event.type === AppEvents.ERROR) {

        done();

      }

    }));

    machine.send(AppEvents.ADD_ALERT, {});

  });

  it('should dismiss alert in context when sending dismissAlert', () => {

    const alert: Alert = { type: 'success', message: 'foo' };

    machine = interpret<AppContext>(
      appMachine(
        new SolidMockService(new ConsoleLogger(LoggerLevel.silly, LoggerLevel.silly)),
        new CollectionMemoryStore([ collection1, collection2 ]),
        new CollectionObjectMemoryStore([ object1 ]),
        collection1,
        object1
      )
        .withContext({
          alerts: [ alert ],
        }),
    );

    machine.start();
    expect(machine.state.context.alerts.length).toBe(1);
    machine.send(AppEvents.DISMISS_ALERT, { alert });
    expect(machine.state.context.alerts.length).toBe(0);

  });

  it('should not dismiss non-existing alert in context when sending dismissAlert', () => {

    const alert: Alert = { type: 'success', message: 'foo' };
    machine.start();
    expect(machine.state.context.alerts.length).toBe(0);
    machine.send(AppEvents.DISMISS_ALERT, { alert });
    expect(machine.state.context.alerts.length).toBe(0);

  });

  it('should send error event when sending dismissAlert without payload', async (done) => {

    machine.start();

    machine.onEvent(((event) => {

      if(event.type === AppEvents.ERROR) {

        done();

      }

    }));

    machine.send(AppEvents.DISMISS_ALERT, {});

  });

  it('should send add alert event when error event is sent', async (done) => {

    machine.start();

    machine.onEvent(((event) => {

      if(event.type === AppEvents.ADD_ALERT) {

        done();

      }

    }));

    machine.send(AppEvents.ERROR);

  });

  it('should assign session when logged in', async (done) => {

    machine.onChange((context) => {

      if(context.session?.webId === 'lorem') {

        done();

      }

    });

    machine.start();

    machine.send({ type: AppEvents.LOGGED_IN, session: { webId: 'lorem' } } as LoggedInEvent);

  });

  it('should remove session when logged out', async (done) => {

    const solid = new SolidMockService(new ConsoleLogger(LoggerLevel.silly, LoggerLevel.silly));

    machine = interpret<AppContext>(
      appMachine(
        new SolidMockService(new ConsoleLogger(LoggerLevel.silly, LoggerLevel.silly)),
        new CollectionMemoryStore([ collection1, collection2 ]),
        new CollectionObjectMemoryStore([ object1 ]),
        collection1,
        object1
      )
        .withContext({
          alerts: [ alert ],
          session: { webId: 'lorem' },
        }),
    );

    machine.onChange((context) => {

      if(!context.session) {

        done();

      }

    });

    machine.start();

    machine.send(AppEvents.LOGGED_IN, { session: { webId: 'foo' } });
    machine.send(AppEvents.LOGGING_OUT);

  });

  it('should send logged in when authenticate machine is done', async (done) => {

    const solid = new SolidMockService(new ConsoleLogger(LoggerLevel.silly, LoggerLevel.silly));
    solid.getSession = jest.fn(async () => ({ webId: 'lorem' }));

    machine = interpret<AppContext>(
      appMachine(solid,
        new CollectionMemoryStore([ collection1, collection2 ]),
        new CollectionObjectMemoryStore([ object1 ]),
        collection1,
        object1).withContext({
        alerts: [],
      }),
    );

    machine.onEvent((event) => {

      if(event.type === AppEvents.LOGGED_IN && (event as LoggedInEvent).session?.webId === 'lorem') {

        done();

      }

    });

    machine.start();

  });

  it('should emit selected collection after login', async (done) => {

    machine.onEvent((event) => {

      if(event.type === CollectionEvents.SELECTED_COLLECTION) {

        done();

      }

    });

    machine.start();

    machine.send(AppEvents.LOGGED_IN, { session: { webId: 'foo' } });

  });

  it('should transition to SEARCH when SEARCH_UPDATED is fired', (done) => {

    machine.onTransition((state) => {

      if(state.matches({ [AppRootStates.FEATURE]: AppFeatureStates.COLLECTION })) {

        machine.send({ type: SearchEvents.SEARCH_UPDATED, searchTerm: 'test' } as SearchUpdatedEvent);

      }

      if(state.matches({ [AppRootStates.FEATURE]: AppFeatureStates.SEARCH })) {

        done();

      }

    });

    machine.start();

    machine.send(AppEvents.LOGGED_IN, { session: { webId: 'foo' } });

  });

});
