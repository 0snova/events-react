import { useEffect, useState } from 'react';

import { ClosedConnector, DataEvent } from '@osnova/events';

export interface UseDataEventParams<E extends DataEvent = DataEvent<any, string>> {
  on: ClosedConnector<E>['on'];
  eventName: E['type'];
  initialValue: E['payload'];
  onNewValue?: (v: E['payload']) => void;
}

export function useDataEvent<E extends DataEvent = DataEvent<any, string>>({
  eventName,
  initialValue,
  on,
  onNewValue,
}: UseDataEventParams<E>) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (on) {
      const listener = on(eventName, (event) => {
        const newValue = event.payload.value;
        setValue(newValue);
        onNewValue?.(newValue);
      });

      return () => listener();
    }
  }, [eventName, on, onNewValue]);

  return [value];
}
