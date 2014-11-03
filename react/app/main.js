/** @jsx React.DOM */
var React = require('react');
var App = require('./App.js');
var jquery = require('jquery');
var underscore = require('underscore');
var backbone = require('backbone');

window.jQuery = jquery;
window.$ = jquery;
window._ = underscore;
window.Backbone = backbone;
window.Backbone.$ = jquery;

//React.renderComponent(<App source="http://www.mblrdr.com/GetUserFeeds"/>, document.body);

var FooComponent = React.createClass({
  render : function() {
    return <App source="http://www.mblrdr.com/GetUserFeeds" />;
  }
});

var BarComponent = React.createClass({
  render : function() {
    return <div>bar</div>;
  }
});

var InterfaceComponent = React.createClass({
  componentWillMount : function() {
    this.routeChanged = (function() {
      this.forceUpdate();
    }).bind(this);

    this.props.router.on("route", this.routeChanged);
  },
  componentWillUnmount : function() {
    this.props.router.off("route", this.routeChanged);
  },
  render : function() {
    if (this.props.router.current == "foo") {
      return <FooComponent />;
    }
    if (this.props.router.current == "bar") {
      return <BarComponent />;
    }
    return <div />;
  }
});

var Router = Backbone.Router.extend({
  routes : {
    "index": "",
    "foo" : "foo",
    "bar" : "bar"
  },
  foo : function() {
    debugger;
    this.current = "foo";
  },
  bar : function() {
    debugger;
    this.current = "bar";
  }
});

var router = new Router();

React.renderComponent(
  <InterfaceComponent router={router} />,
  document.body
);

Backbone.history.start();
