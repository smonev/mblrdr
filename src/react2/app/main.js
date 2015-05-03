'use strict';

let React = require('react/addons');
let jquery = require('jquery');
window.jQuery = jquery;
window.$ = jquery;

let Velocity = require('velocity-animate');
let bla = require('velocity-animate/velocity.ui');
window.Velocity = Velocity;

let App = require('./App.js');
let FoldersList = require('./components/FoldersList.js');
let FeedsList = require('./components/FeedsList.js');
let ArticlesList = require('./components/ArticlesList.js');
let NotFound = require('./components/NotFound.js');

let AppUtils = require('./AppUtils.js');
let Animations = require('./Animations.js');

let ReactRouter = require('react-router');
let Router = ReactRouter;
let Route = ReactRouter.Route;

let DefaultRoute = ReactRouter.DefaultRoute;
let NotFoundRoute = ReactRouter.NotFoundRoute;

let i18n = {
    locales: ['en-US']
};

let routes = (
    <Route name='home' path='/' handler={App}>
        <Route name='folderFeeds' path='/:folderName' handler={FeedsList}></Route>
        <Route name='feedItems' path='/:folderName/:feedUrl' handler={ArticlesList}></Route>
        <DefaultRoute name='root' handler={FoldersList} />
        <NotFoundRoute handler={NotFound}/>
    </Route>
);

Router.run(routes, function (Handler) {
    React.render(<Handler locales={i18n.locales} />, document.body);
});

