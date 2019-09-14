import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import '../../node_modules/bootstrap/dist/css/bootstrap.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'react-toastify/dist/ReactToastify.css';

import './less/main.less'
import * as serviceWorker from './serviceWorker';
import App from './Components/App';

import { store } from './store';

ReactDOM.render(
    <Provider store={store}>
        {/* <BrowserRouter> */}
        <App />
        {/* </BrowserRouter> */}
    </Provider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
