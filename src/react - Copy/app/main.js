/** @jsx React.DOM */

var React = require('react/addons');
var jquery = require('jquery');
window.jQuery = jquery;
window.$ = jquery;

var App = require('./App.jsx');
var FoldersList = require('./components/FoldersList.jsx');
var FeedsList = require('./components/FeedsList.jsx');
var ArticlesList = require('./components/ArticlesList.jsx');
var NotFound = require('./components/NotFound.jsx');

var ReactRouter = require('react-router');
var Router = ReactRouter;
var Route = ReactRouter.Route;
var Routes = ReactRouter.Routes;
var Link = ReactRouter.Link;

var DefaultRoute = ReactRouter.DefaultRoute;
var NotFoundRoute = ReactRouter.NotFoundRoute;

var routes = (
    <Route name="home" path="/" handler={App}>
        <Route name="folderFeeds" path="/:folderName" handler={FeedsList}></Route>
        <Route name="feedItems" path="/:folderName/:feedUrl" handler={ArticlesList}></Route>
        <DefaultRoute name='root' path='/' handler={FoldersList} />
        <NotFoundRoute handler={NotFound}/>
    </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.body);
});

