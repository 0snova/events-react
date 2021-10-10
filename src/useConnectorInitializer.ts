import { useEffect, useRef, useMemo, useState } from 'react';

import { DuplexConnector, EventSystemParams } from '@osnova/events';
import { RequestEvent } from '@osnova/events/EventRequest';
import { AnyResponseEventMap } from '@osnova/events/EventResponse';

import { NullableSystemConnector, RequestType, OnType, UnwrapPromise } from './types';
import { makeUseDataEvent } from './useDataEvent';

export type DuplexConnectorInitializer<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
> = () => Promise<{ connector: DuplexConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap> }>;

export interface ConnectorInitializerParams<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
> extends EventSystemParams<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap> {
  requestTimeout?: number;
}

export function useConnectorInitializer<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
>(
  initializer: DuplexConnectorInitializer<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>,
  params: ConnectorInitializerParams<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>
): NullableSystemConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap> {
  const [isReady, setIsReady] = useState(false);
  const request = useRef<RequestType<OutReqEvents, InResponseEventMap> | null>(null);
  const on = useRef<OnType<InReqEvents, InResponseEventMap> | null>(null);

  const sourceReadyResolve = useRef<any>(null);
  const sourceReadyPromise = useMemo(() => {
    return new Promise<
      UnwrapPromise<
        NullableSystemConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>['onReady']
      >
    >((resolve) => {
      sourceReadyResolve.current = resolve;
    });
  }, []);

  const useDataEvent = makeUseDataEvent(sourceReadyPromise);

  useEffect(() => {
    async function doInit() {
      const { connector } = await initializer();
      request.current = connector.request.bind(connector);
      on.current = connector.on.bind(connector);
      sourceReadyResolve.current({ request: request.current, on: on.current });

      setIsReady(true);

      if (params.onBoot) {
        params.onBoot({ request: request.current, on: on.current });
      }
    }

    doInit();
  }, []);

  const systemInterface = { request: request.current, on: on.current };

  const onReady = useMemo(async () => {
    const requestTimeout = params.requestTimeout ?? 1000;
    const { request, on } = await sourceReadyPromise;

    const requestWithTimeout: RequestType<OutReqEvents, InResponseEventMap> = (event) =>
      Promise.race([
        request(event),
        new Promise((_, reject) =>
          setTimeout(() => {
            reject({ error: `Timeout` });
          }, requestTimeout)
        ),
      ]);

    return { request: requestWithTimeout, on };
  }, [params.requestTimeout]);

  return { ...systemInterface, useDataEvent, isReady, onReady };
}

export type UseConnectorInitializer = ReturnType<typeof useConnectorInitializer>;
