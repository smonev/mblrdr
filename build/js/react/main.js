(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./app/main.js":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');
var App = require('./App.js');

React.renderComponent(App(null), document.body);

},{"./App.js":"c:\\proj\\mblrdr\\src\\react\\app\\App.js","react":"react"}],"c:\\proj\\mblrdr\\src\\react\\app\\App.js":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');

var AppHeader = require('./components/AppHeader.js');
var AppSettings = require('./components/AppSettings.js');

var AppFolders = require('./components/AppFolders.js');
var FolderFeeds = require('./components/FolderFeeds.js');
var FeedArticles = require('./components/FeedArticles.js');



var App = React.createClass({displayName: 'App',
    getInitialState: function() {
        return {
            settingsVisible: false,
            folders: [{'name': '122'}, {'name': '133'}],
            feeds: [{'name': '222'}, {'name': '233'}],
            articles: [{'name': '322'}, {'name': '333'}],
            view: 'folders'
        }
    },
    render: function() {
        var foldersAreVisible = this.state.view === 'folders',
        feedsAreVisible = this.state.view === 'feeds',
        feedArticlesAreVisible = this.state.view === 'articles';

        return (
            React.DOM.div(null, 
                AppHeader(null), 

                AppFolders({visible: foldersAreVisible, folders: this.state.folders, feeds: this.state.feeds}), 
                FolderFeeds({visible: feedsAreVisible, feeds: this.state.feeds}), 
                FeedArticles({visible: feedArticlesAreVisible, articles: this.state.articles}), 

                AppSettings({visible: this.state.settingsVisible})
            )
        );
    }
});

module.exports = App;

},{"./components/AppFolders.js":"c:\\proj\\mblrdr\\src\\react\\app\\components\\AppFolders.js","./components/AppHeader.js":"c:\\proj\\mblrdr\\src\\react\\app\\components\\AppHeader.js","./components/AppSettings.js":"c:\\proj\\mblrdr\\src\\react\\app\\components\\AppSettings.js","./components/FeedArticles.js":"c:\\proj\\mblrdr\\src\\react\\app\\components\\FeedArticles.js","./components/FolderFeeds.js":"c:\\proj\\mblrdr\\src\\react\\app\\components\\FolderFeeds.js","react":"react"}],"c:\\proj\\mblrdr\\src\\react\\app\\components\\AppFolders.js":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');

var AppFolders = React.createClass({displayName: 'AppFolders',
    render: function() {
        return (
            React.DOM.span(null, 
                "AppFolders"
            )
        );
    }
});

module.exports = AppFolders;

},{"react":"react"}],"c:\\proj\\mblrdr\\src\\react\\app\\components\\AppHeader.js":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');

var AppHeader = React.createClass({displayName: 'AppHeader',
    render: function() {
        return (
            React.DOM.span(null, 
                "header"
            )
        );
    }
});

module.exports = AppHeader;

},{"react":"react"}],"c:\\proj\\mblrdr\\src\\react\\app\\components\\AppSettings.js":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');

var AppSettings = React.createClass({displayName: 'AppSettings',
    render: function() {
        var styles = {
            display: this.props.visible ? 'block': 'none'
        }
        return (
            React.DOM.span({style: styles}, 
                "settigns"
            )
        );
    }
});

module.exports = AppSettings;

},{"react":"react"}],"c:\\proj\\mblrdr\\src\\react\\app\\components\\FeedArticles.js":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');

var FeedArticles = React.createClass({displayName: 'FeedArticles',
    render: function() {
        return (
            React.DOM.span(null, 
                "FeedArticles"
            )
        );
    }
});

module.exports = FeedArticles;

},{"react":"react"}],"c:\\proj\\mblrdr\\src\\react\\app\\components\\FolderFeeds.js":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');

var FolderFeeds = React.createClass({displayName: 'FolderFeeds',
    render: function() {

        var feeds = this.props.feeds.map(function (feed) {
            return (
                React.DOM.li(null, 
                    feed.name
                )
            );
        });

        return (
            React.DOM.ul(null, 
                feeds
            )
        );
    }
});

module.exports = FolderFeeds;

},{"react":"react"}]},{},["./app/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiLi9hcHAvbWFpbi5qcyIsImM6L3Byb2ovbWJscmRyL3NyYy9yZWFjdC9hcHAvQXBwLmpzIiwiYzovcHJvai9tYmxyZHIvc3JjL3JlYWN0L2FwcC9jb21wb25lbnRzL0FwcEZvbGRlcnMuanMiLCJjOi9wcm9qL21ibHJkci9zcmMvcmVhY3QvYXBwL2NvbXBvbmVudHMvQXBwSGVhZGVyLmpzIiwiYzovcHJvai9tYmxyZHIvc3JjL3JlYWN0L2FwcC9jb21wb25lbnRzL0FwcFNldHRpbmdzLmpzIiwiYzovcHJvai9tYmxyZHIvc3JjL3JlYWN0L2FwcC9jb21wb25lbnRzL0ZlZWRBcnRpY2xlcy5qcyIsImM6L3Byb2ovbWJscmRyL3NyYy9yZWFjdC9hcHAvY29tcG9uZW50cy9Gb2xkZXJGZWVkcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIEFwcCA9IHJlcXVpcmUoJy4vQXBwLmpzJyk7XG5cblJlYWN0LnJlbmRlckNvbXBvbmVudChBcHAobnVsbCksIGRvY3VtZW50LmJvZHkpO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgQXBwSGVhZGVyID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0FwcEhlYWRlci5qcycpO1xudmFyIEFwcFNldHRpbmdzID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0FwcFNldHRpbmdzLmpzJyk7XG5cbnZhciBBcHBGb2xkZXJzID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0FwcEZvbGRlcnMuanMnKTtcbnZhciBGb2xkZXJGZWVkcyA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9Gb2xkZXJGZWVkcy5qcycpO1xudmFyIEZlZWRBcnRpY2xlcyA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9GZWVkQXJ0aWNsZXMuanMnKTtcblxuXG5cbnZhciBBcHAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBcHAnLFxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZXR0aW5nc1Zpc2libGU6IGZhbHNlLFxuICAgICAgICAgICAgZm9sZGVyczogW3snbmFtZSc6ICcxMjInfSwgeyduYW1lJzogJzEzMyd9XSxcbiAgICAgICAgICAgIGZlZWRzOiBbeyduYW1lJzogJzIyMid9LCB7J25hbWUnOiAnMjMzJ31dLFxuICAgICAgICAgICAgYXJ0aWNsZXM6IFt7J25hbWUnOiAnMzIyJ30sIHsnbmFtZSc6ICczMzMnfV0sXG4gICAgICAgICAgICB2aWV3OiAnZm9sZGVycydcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZvbGRlcnNBcmVWaXNpYmxlID0gdGhpcy5zdGF0ZS52aWV3ID09PSAnZm9sZGVycycsXG4gICAgICAgIGZlZWRzQXJlVmlzaWJsZSA9IHRoaXMuc3RhdGUudmlldyA9PT0gJ2ZlZWRzJyxcbiAgICAgICAgZmVlZEFydGljbGVzQXJlVmlzaWJsZSA9IHRoaXMuc3RhdGUudmlldyA9PT0gJ2FydGljbGVzJztcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgICAgICAgICBBcHBIZWFkZXIobnVsbCksIFxuXG4gICAgICAgICAgICAgICAgQXBwRm9sZGVycyh7dmlzaWJsZTogZm9sZGVyc0FyZVZpc2libGUsIGZvbGRlcnM6IHRoaXMuc3RhdGUuZm9sZGVycywgZmVlZHM6IHRoaXMuc3RhdGUuZmVlZHN9KSwgXG4gICAgICAgICAgICAgICAgRm9sZGVyRmVlZHMoe3Zpc2libGU6IGZlZWRzQXJlVmlzaWJsZSwgZmVlZHM6IHRoaXMuc3RhdGUuZmVlZHN9KSwgXG4gICAgICAgICAgICAgICAgRmVlZEFydGljbGVzKHt2aXNpYmxlOiBmZWVkQXJ0aWNsZXNBcmVWaXNpYmxlLCBhcnRpY2xlczogdGhpcy5zdGF0ZS5hcnRpY2xlc30pLCBcblxuICAgICAgICAgICAgICAgIEFwcFNldHRpbmdzKHt2aXNpYmxlOiB0aGlzLnN0YXRlLnNldHRpbmdzVmlzaWJsZX0pXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgQXBwRm9sZGVycyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FwcEZvbGRlcnMnLFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcbiAgICAgICAgICAgICAgICBcIkFwcEZvbGRlcnNcIlxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcEZvbGRlcnM7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBBcHBIZWFkZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBcHBIZWFkZXInLFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBSZWFjdC5ET00uc3BhbihudWxsLCBcbiAgICAgICAgICAgICAgICBcImhlYWRlclwiXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwSGVhZGVyO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgQXBwU2V0dGluZ3MgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBcHBTZXR0aW5ncycsXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0eWxlcyA9IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IHRoaXMucHJvcHMudmlzaWJsZSA/ICdibG9jayc6ICdub25lJ1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBSZWFjdC5ET00uc3Bhbih7c3R5bGU6IHN0eWxlc30sIFxuICAgICAgICAgICAgICAgIFwic2V0dGlnbnNcIlxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcFNldHRpbmdzO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgRmVlZEFydGljbGVzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnRmVlZEFydGljbGVzJyxcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4obnVsbCwgXG4gICAgICAgICAgICAgICAgXCJGZWVkQXJ0aWNsZXNcIlxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZlZWRBcnRpY2xlcztcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIEZvbGRlckZlZWRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnRm9sZGVyRmVlZHMnLFxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIGZlZWRzID0gdGhpcy5wcm9wcy5mZWVkcy5tYXAoZnVuY3Rpb24gKGZlZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmxpKG51bGwsIFxuICAgICAgICAgICAgICAgICAgICBmZWVkLm5hbWVcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgUmVhY3QuRE9NLnVsKG51bGwsIFxuICAgICAgICAgICAgICAgIGZlZWRzXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9sZGVyRmVlZHM7XG4iXX0=
