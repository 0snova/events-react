import { useEffect, useRef, useMemo, useState, useCallback } from 'react';

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
> extends Partial<EventSystemParams<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>> {
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
): NullableSystemConnector<OutReqEvents, InReqEvents, InResponseEventMap> {
  const [isReady, setIsReady] = useState(false);
  const request = useRef<RequestType<OutReqEvents, InResponseEventMap> | null>(null);
  const on = useRef<OnType<InReqEvents, InResponseEventMap> | null>(null);

  const sourceReadyResolve = useRef<any>(null);
  const sourceReadyPromise = useMemo(() => {
    return new Promise<
      UnwrapPromise<NullableSystemConnector<OutReqEvents, InReqEvents, InResponseEventMap>['onReady']>
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

      if (typeof params.onBoot === 'function') {
        params.onBoot({ request: request.current, on: on.current });
      }
    }

    doInit();
  }, []);

  const requestWithTimeout: RequestType<OutReqEvents, InResponseEventMap> = useCallback(
    (event) => {
      const requestTimeout = params.requestTimeout ?? 1000;
      const r = request.current;

      if (!r) {
        return Promise.reject({ error: 'Unavailable', message: `Request is not ready` });
      }

      return Promise.race([
        r(event),
        new Promise((_, reject) =>
          setTimeout(() => {
            reject({ error: `Timeout`, message: `Reached timeout while waiting for response` });
          }, requestTimeout)
        ),
      ]);
    },
    [params.requestTimeout]
  );

  const onReady = useMemo(async () => {
    const { on } = await sourceReadyPromise;

    return { request: requestWithTimeout, on };
  }, [params.requestTimeout]);

  return { request: requestWithTimeout, on: on.current, useDataEvent, isReady, onReady };
}

export type UseConnectorInitializer = ReturnType<typeof useConnectorInitializer>;
