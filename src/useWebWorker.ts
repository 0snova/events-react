import { useEffect, useRef, useState, useCallback } from 'react';

import { DuplexConnector } from '@osnova/events';
import { RequestEvent, UnwrapRequestEvent } from '@osnova/events/EventRequest';
import { AnyResponseEventMap } from '@osnova/events/EventResponse';

// export interface System<
//   OutReqEvents extends RequestEvent,
//   InReqEvents extends RequestEvent,
//   OutResponseEventMap extends AnyResponseEventMap,
//   InResponseEventMap extends AnyResponseEventMap
// > {
//   request: any;
//   response: any;
// }

export interface FederatedSystemParams<
  OutReqEvents extends RequestEvent,
  InReqEvents extends RequestEvent,
  OutResponseEventMap extends AnyResponseEventMap,
  InResponseEventMap extends AnyResponseEventMap
> {
  onBoot(
    system: Pick<
      DuplexConnector<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>,
      'request' | 'response'
    >
  ): void;
}

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
  params: FederatedSystemParams<OutReqEvents, InReqEvents, OutResponseEventMap, InResponseEventMap>
) {
  type RequestType = (
    event: UnwrapRequestEvent<OutReqEvents>
  ) => Promise<InResponseEventMap[`${UnwrapRequestEvent<OutReqEvents>['type']}::response`]>;

  const request = useRef<RequestType | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const requestDecorator = useCallback(async (event: UnwrapRequestEvent<OutReqEvents>) => {
    if (!request.current) {
      throw new Error(`Unabled to execute request: no request function is provided from `);
    }

    try {
      const response = await request.current(event);
      setResponse(response);

      return response;
    } catch (e) {
      setError(e);
    }
  }, []);

  useEffect(() => {
    async function doInit() {
      const { connector } = await initializer();
      request.current = connector.request.bind(connector) as RequestType;

      if (params.onBoot) {
        params.onBoot({ request: requestDecorator, response });
      }
    }

    doInit();
  }, []);

  return { request: requestDecorator, response, error };
}
