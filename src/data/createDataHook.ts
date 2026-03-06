import { useEffect, useState } from "react";

export const createDataHook = <T extends unknown>(
  url: string,
  defaultData: T,
) => {
  return () => {
    const [data, setData] = useState(defaultData);

    useEffect(() => {
      (async () => {
        const res = await fetch(url);

        setData(await res.json());
      })();
    }, []);

    return data;
  };
};
