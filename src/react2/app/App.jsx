'use strict';

var React = require('react');
var ReactRouter = require('react-router');
var Router = ReactRouter;
var RouteHandler = Router.RouteHandler;

var jQuery = require('jquery');
var FastClick = require('fastclick');
var PubSub = require('pubsub-js');

var AppHeader = require('./components/AppHeader.jsx');
var AppSettings = require('./components/AppSettings.jsx');
var FeedsList = require('./components/FeedsList.jsx');
var FoldersList = require('./components/FoldersList.jsx');
var PageLoader = require('./components/PageLoader.jsx');
var AppStore = require('./AppStore.js');
var AppUtils = require('./AppUtils.js');
var AppMess = require('./AppMess.js');
var AppMessages = require('./Const.js');

AppMess.init();

var App = React.createClass({

    mixins: [ ReactRouter.State ],

    getInitialState: function() {
        return {
            settingsVisible: false,
            folders: [],
            feeds: [],
            articles: [],
            userSettings: {},
            bloglist: {},
            username: '',
            nightmode: false,
            title: ''
        };
    },

    componentDidMount: function() {
        AppUtils.getUserFeeds(this.props.source ? this.props.source : '/GetUserFeeds', function(result) {
            if (this.isMounted()) {
                AppUtils.getReadData('/GetUserReadData', this.getParams().folderName);
                this.setState({
                    userSettings: result.userSettings,
                    bloglist: result.bloglist,
                    username: result.username,
                    userData: result
                });

                if (result.userSettings.nightmode === 2) {
                    document.body.classList.add('nightmode');
                }
            }
        }.bind(this));

        this.dayOrNigthModeEvent = PubSub.subscribe(AppMessages.NIGHT_MODE_CHANGE, function( msg, daymode ) {
            if (daymode) {
                this.state.userSettings.nightmode = 1;
                document.body.classList.remove('nightmode');
            } else {
                this.state.userSettings.nightmode = 2;
                document.body.classList.add('nightmode');
            }

            this.saveSettings(this.state.userSettings);
        }.bind(this));
    },

    componentDidUnmount: function() {
        PubSub.unsubscribe( this.dayOrNigthModeEvent );
    },

    showSettings: function() {
        this.setState({
            settingsVisible: true
        });
    },

    hideSettings: function() {
        this.setState({
            settingsVisible: false
        });
    },

    saveSettings: function(userSettings) {
        this.setState({
            userSettings: userSettings
        });
        AppUtils.saveSettings();
    },

    setTitle: function(title) {
        this.setState({
            title: title
        });
    },

    setCurrentFeedName: function(currentFeedName) {
        this.setState({
            currentFeedName: currentFeedName
        });
    },

    markAsRead: function(data) {
        console.log('mark me as read');
    },

    showLoader: function() {
        this.refs.pageLoader.animate();
    },

    render: function() {
        var cx = React.addons.classSet;
        var nightmode = cx({
            'nightmode': this.state.userSettings && this.state.userSettings.nightmode && this.state.userSettings.nightmode === 2
        });
        var view = [{name: 'root'}];

        return (
            <div>
                <PageLoader ref="pageLoader"/>

                <div className='menu'>
                    <AppHeader
                        title={this.state.title}
                        showSettings={this.showSettings} />

                    <RouteHandler
                        isRoot='True'
                        userData={this.state.userData}
                        userSettings={this.state.userSettings}
                        setTitle={this.setTitle}
                        showLoader={this.showLoader}
                        setCurrentFeedName={this.setCurrentFeedName} />
                </div>

                <AppSettings
                    currentFeedName={this.state.currentFeedName}
                    visible={this.state.settingsVisible}
                    bloglist={this.state.bloglist}
                    userSettings={this.state.userSettings}
                    saveSettings={this.saveSettings}
                    hideSettings={this.hideSettings}
                    showHideRead={this.showHideRead}
                    markAsRead={this.markAsRead}
                    />
            </div>
        );
    }
});

FastClick(document.body);
React.initializeTouchEvents(true);

module.exports = App;
