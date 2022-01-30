import { RequestEvent, UnwrapRequestEvent } from '@osnova/events/EventRequest';
import { AnyResponseEventMap, ResponseTypeFromRequestType } from '@osnova/events/EventResponse';

import { Unsubscribe } from '@osnova/events/lib/Unsubscribe';
import { EventListener } from '@osnova/events/Events';

import { UseDataEventHook } from './useDataEvent';

export type UnwrapPromise<T> = T extends Promise<infer P> ? P : never;

export type RequestType<OutReqEvents extends RequestEvent, InResponseEventMap extends AnyResponseEventMap> = <
  E extends UnwrapRequestEvent<OutReqEvents>
>(
  event: E
) => Promise<InResponseEventMap[ResponseTypeFromRequestType<E['type']>]['payload']>;

export type OnType<InReqEvents extends RequestEvent, InResponseEventMap extends AnyResponseEventMap> = <
  E extends (InReqEvents | InResponseEventMap[keyof InResponseEventMap])['type']
>(
  eventType: E | '*',
  listener: EventListener<InReqEvents | InResponseEventMap[keyof InResponseEventMap], E>
) => Unsubscribe;

export interface NullableSystemConnector<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  InResponseEventMap extends AnyResponseEventMap
> {
  request: RequestType<OutReqEvents, InResponseEventMap>;
  on: OnType<InReqEvents, InResponseEventMap> | null;

  useDataEvent: UseDataEventHook;

  isReady: boolean;
  onReady: Promise<{
    request: RequestType<OutReqEvents, InResponseEventMap>;
    on: OnType<InReqEvents, InResponseEventMap>;
  }>;
}

export type UseConnectorInitializerResult<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  InResponseEventMap extends AnyResponseEventMap,
  External extends Record<string, any> = Record<string, never>
> = {
  external: External;
  connector: NullableSystemConnector<OutReqEvents, InReqEvents, InResponseEventMap>;
};
