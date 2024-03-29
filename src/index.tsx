import React from 'react';
import ReactDOM from 'react-dom';
import GithubCorner from 'react-github-corner';
import { App } from './App';
import './index.css';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <>
    <GithubCorner
      href='https://github.com/mezzode/summit'
      bannerColor='#9b4dca'
    />
    <App />
  </>,
  document.getElementById('root'),
);

/* If you want your app to work offline and load faster, you can change
unregister() to register() below. Note this comes with some pitfalls.
Learn more about service workers: http://bit.ly/CRA-PWA */
serviceWorker.register();
