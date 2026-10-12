"use client";

import { useState } from "react";
import { Provider } from "react-redux";

import { makeStore, type AppStoreType } from "@/lib/redux/store";

/**
 * One Redux store for the lifetime of the browser tab.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStoreType>(() => makeStore());

  return <Provider store={store}>{children}</Provider>;
}
