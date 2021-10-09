import { useEffect, useRef, useMemo, useState } from 'react';

import { DuplexConnector, EventSystemParams } from '@osnova/events';
import { RequestEvent, UnwrapRequestEvent } from '@osnova/events/EventRequest';
import { AnyResponseEventMap } from '@osnova/events/EventResponse';

import { NullableSystemConnector, RequestType, OnType } from './types';
import { makeUseDataEvent, UseDataEventHook } from './useDataEvent';

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
): { isReady: boolean; useDataEvent: UseDataEventHook } & NullableSystemConnector<
  OutReqEvents,
  InReqEvents,
  OutResponseEventMap,
  InResponseEventMap
> {
  const [isReady, setIsReady] = useState(false);
  const request = useRef<RequestType<OutReqEvents, InResponseEventMap> | null>(null);
  const on = useRef<OnType<InReqEvents, InResponseEventMap> | null>(null);

  const sourceReadyResolve = useRef<any>(null);
  const sourceReadyPromise = useMemo(() => {
    return new Promise<any>((resolve) => {
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

  return { ...systemInterface, useDataEvent, isReady };
}

export type UsedWebWorkerConnector = ReturnType<typeof useWebWorker>;
