import { createContext, Context, useContext } from 'react';
import { RequestEvent } from '@osnova/events';
import { AnyResponseEventMap } from '@osnova/events/EventResponse';

import { NullableSystemConnector } from './types';

export const createConnectorContext = <
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  InResponseEventMap extends AnyResponseEventMap
>() => createContext<NullableSystemConnector<OutReqEvents, InReqEvents, InResponseEventMap>>({} as any);

export function createUseConnectorContext<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  InResponseEventMap extends AnyResponseEventMap
>(connectorContext: Context<NullableSystemConnector<OutReqEvents, InReqEvents, InResponseEventMap>>) {
  return function useConnectorContext() {
    const context = useContext(connectorContext);
    if (!context) {
      throw new Error(`No connector context was provided.`);
    }

    return context;
  };
}
