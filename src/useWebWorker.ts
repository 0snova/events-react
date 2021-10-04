import { useEffect, useRef, useMemo, useCallback } from 'react';

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
): { useDataEvent: UseDataEventHook } & NullableSystemConnector<
  OutReqEvents,
  InReqEvents,
  OutResponseEventMap,
  InResponseEventMap
> {
  const request = useRef<RequestType<OutReqEvents, InResponseEventMap> | null>(null);
  const onRef = useRef<OnType<InReqEvents, InResponseEventMap> | null>(null);

  const sourceReadyResolve = useRef<any>(null);
  const sourceReadyPromise = useMemo(() => {
    return new Promise<any>((resolve) => {
      sourceReadyResolve.current = resolve;
    });
  }, []);

  const useDataEvent = makeUseDataEvent(sourceReadyPromise);

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
      request.current = connector.request.bind(connector);
      onRef.current = connector.on.bind(connector);
      sourceReadyResolve.current({ request: requestDecorator, on: onRef.current });

      if (params.onBoot) {
        params.onBoot({ request: requestDecorator, on: onRef.current });
      }
    }

    doInit();
  }, []);

  const systemInterface = { request: requestDecorator, on: onRef.current };

  return { ...systemInterface, useDataEvent };
}

export type UsedWebWorkerConnector = ReturnType<typeof useWebWorker>;
