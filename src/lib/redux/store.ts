import { configureStore } from "@reduxjs/toolkit";

import { sessionReducer } from "@/lib/redux/slices/session/sessionSlice";

/**
 * Session store for the current browser tab. The chat list is saved separately.
 */
export function makeStore() {
  return configureStore({
    reducer: {
      session: sessionReducer,
    },
  });
}

export type AppStoreType = ReturnType<typeof makeStore>;
export type RootStateType = ReturnType<AppStoreType["getState"]>;
export type AppDispatchType = AppStoreType["dispatch"];
