import { createContext, Context, useContext } from 'react';
import { RequestEvent } from '@osnova/events';
import { AnyResponseEventMap } from '@osnova/events/EventResponse';

import { NullableSystemConnector } from './types';

export const createConnectorContext = <
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
>() =>
  createContext<NullableSystemConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>>({} as any);

export function createUseConnectorContext<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
>(
  connectorContext: Context<NullableSystemConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>>
) {
  return function useConnectorContext() {
    const context = useContext(connectorContext);
    if (!context) {
      throw new Error(`No connector context was provided.`);
    }

    return context;
  };
}
