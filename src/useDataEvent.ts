import { useEffect, useState } from 'react';
import memoize from 'memoize-one';

import { DataEvent, RequestEvent } from '@osnova/events';
import { AnyResponseEventMap } from '@osnova/events/EventResponse';
import { NullableSystemConnector } from './types';

export interface UseDataEventParams<Event extends DataEvent> {
  eventName: Event['type'];
  initialValue: Event['payload']['value'];
  onNewValue?: (v: Event['payload']['value']) => void;
}

export type UseDataEventHook = <Event extends DataEvent>(
  params: UseDataEventParams<Event>
) => Event['payload']['value'];

export function makeUseDataEventRaw<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
>(
  sourcePromise: NullableSystemConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>['onReady']
) {
  const useDataEvent = function useDataEvent<E extends DataEvent>({
    eventName,
    initialValue,
    onNewValue,
  }: UseDataEventParams<E>) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
      let unsub: any = null;

      console.log('effect', sourcePromise);
      sourcePromise.then((source) => {
        console.log('sourcePromise resolved', source);
        if (source.on) {
          console.log('setup llistener');
          const listener = source.on(eventName, (event) => {
            const newValue = event.payload.value;
            setValue(newValue);
            onNewValue?.(newValue);
          });
          unsub = () => {
            listener();
          };
        }
      });

      return () => {
        unsub?.();
      };
    }, [eventName, onNewValue]);

    return value;
  };

  return useDataEvent;
}

export const makeUseDataEvent = memoize(makeUseDataEventRaw);
