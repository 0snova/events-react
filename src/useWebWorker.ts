import { useEffect, useRef, useState, useCallback } from 'react';

import { DuplexConnector, EventSystemParams } from '@osnova/events';
import { RequestEvent, UnwrapRequestEvent } from '@osnova/events/EventRequest';
import { AnyResponseEventMap } from '@osnova/events/EventResponse';

import { UnwrapPromise } from './types';

export type DuplexConnectorInitializer<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
> = () => Promise<{ connector: DuplexConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap> }>;

export function useWebWorker<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
>(
  initializer: DuplexConnectorInitializer<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>,
  params: EventSystemParams<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>
) {
  type RequestType = (
    event: UnwrapRequestEvent<OutReqEvents>
  ) => Promise<InResponseEventMap[`${UnwrapRequestEvent<OutReqEvents>['type']}::response`]>;

  type ConnectorOnType = UnwrapPromise<ReturnType<typeof initializer>>['connector']['on'];

  const request = useRef<RequestType | null>(null);
  const onRef = useRef<ConnectorOnType | null>(null);
  const [error, setError] = useState<any>(null);

  const requestDecorator = useCallback(async (event: UnwrapRequestEvent<OutReqEvents>) => {
    if (!request.current) {
      throw new Error(`Unabled to execute request: no request function is provided from `);
    }

    const response = await request.current(event);

    return response;
  }, []);

  useEffect(() => {
    async function doInit() {
      const { connector } = await initializer();
      request.current = connector.request.bind(connector) as RequestType;
      onRef.current = connector.on.bind(connector);

      if (params.onBoot) {
        params.onBoot({ request: requestDecorator, on: onRef.current });
      }
    }

    doInit();
  }, []);

  return { request: requestDecorator, error, on: onRef.current };
}
