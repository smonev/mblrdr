'use strict';

var React = require('react/addons');
var jquery = require('jquery');
window.jQuery = jquery;
window.$ = jquery;

var Velocity = require('velocity-animate');
var bla = require('velocity-animate/velocity.ui');
window.Velocity = Velocity;

var App = require('./App.jsx');
var FoldersList = require('./components/FoldersList.jsx');
var FeedsList = require('./components/FeedsList.jsx');
var ArticlesList = require('./components/ArticlesList.jsx');
var NotFound = require('./components/NotFound.jsx');

var ReactRouter = require('react-router');
var Router = ReactRouter;
var Route = ReactRouter.Route;

var DefaultRoute = ReactRouter.DefaultRoute;
var NotFoundRoute = ReactRouter.NotFoundRoute;

var i18n = {
    locales: ['en-US']
};

var routes = (
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
