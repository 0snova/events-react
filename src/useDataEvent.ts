import { useEffect, useState } from 'react';

import { ClosedConnector, DataEvent, RequestEvent } from '@osnova/events';
import { AnyResponseEventMap } from '@osnova/events/EventResponse';

import { EventListener } from '@osnova/events/Events';
import { Unsubscribe } from '@osnova/events/lib/Unsubscribe';

import { UsedWebWorkerConnector } from './useWebWorker';
import { NullableSystemConnector } from './types';

export interface UseDataEventParams<
  Event extends DataEvent
  // OutReqEvents extends RequestEvent,
  // InReqEvents extends RequestEvent,
  // OutResponseEventMap extends AnyResponseEventMap,
  // InResponseEventMap extends AnyResponseEventMap
> {
  // source: NullableSystemConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>;
  // on: (<E extends Event['type']>(eventType: E, listener: EventListener<Event, E>) => Unsubscribe) | null;
  eventName: Event['type'];
  initialValue: Event['payload']['value'];
  onNewValue?: (v: Event['payload']['value']) => void;
}

export type UseDataEventHook = <Event extends DataEvent>(
  params: UseDataEventParams<Event>
) => Event['payload']['value'];

export function makeUseDataEvent<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
>(source: NullableSystemConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap> | null) {
  return function useDataEvent<E extends DataEvent>({ eventName, initialValue, onNewValue }: UseDataEventParams<E>) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
      if (source && source.on) {
        const listener = source.on(eventName, (event) => {
          const newValue = event.payload.value;
          setValue(newValue);
          onNewValue?.(newValue);
        });

        return () => listener();
      }
    }, [eventName, source?.on, onNewValue]);

    return value;
  };
}
