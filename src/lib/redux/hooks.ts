import { useDispatch, useSelector, useStore } from "react-redux";

import type { AppDispatchType, AppStoreType, RootStateType } from "@/lib/redux/store";

export const useAppDispatch = useDispatch.withTypes<AppDispatchType>();
export const useAppSelector = useSelector.withTypes<RootStateType>();
export const useAppStore = useStore.withTypes<AppStoreType>();
