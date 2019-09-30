import { createStore, applyMiddleware, Store } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import reducer from './reducers';

export const store: Store = createStore(reducer, composeWithDevTools(applyMiddleware(thunk)));

export const dispatch = store.dispatch;
export const getState = store.getState;