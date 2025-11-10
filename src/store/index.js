/**
 * Redux Store Configuration
 * Configures the Redux store with all slices
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import plantReducer from './slices/plantSlice';
import deviceReducer from './slices/deviceSlice';
import usersReducer from './slices/usersSlice';
import alarmsReducer from './slices/alarmsSlice';
import tagsReducer from './slices/tagsSlice';
import templatesReducer from './slices/templatesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    plants: plantReducer,
    devices: deviceReducer,
    users: usersReducer,
    alarms: alarmsReducer,
    tags: tagsReducer,
    templates: templatesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
