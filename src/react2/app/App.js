'use strict';

let React = require('react');
let ReactRouter = require('react-router');
let Router = ReactRouter;
let RouteHandler = Router.RouteHandler;

let jQuery = require('jquery');
let FastClick = require('fastclick');
let PubSub = require('pubsub-js');
let classNames = require('classNames');
let FPSStats = require('react-stats').FPSStats;

let AppHeader = require('./components/AppHeader.js');
let AppSettings = require('./components/AppSettings.js');
let FeedsList = require('./components/FeedsList.js');
let FoldersList = require('./components/FoldersList.js');
let PageLoader = require('./components/PageLoader.js');
let AppStore = require('./AppStore.js');
let AppUtils = require('./AppUtils.js');
let AppMess = require('./AppMess.js');
let AppMessages = require('./AppMessages.js');

AppMess.init();

let App = React.createClass({

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

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
                AppUtils.getReadData('/GetUserReadData', this.context.router.getCurrentParams().folderName);
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

    showSettings: function(settingsType) {
        this.setState({
            settingsVisible: true,
            settingsType: settingsType
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
        //this.refs.pageLoader.animate();
    },

    render: function() {

        let nightmode = classNames({
            'nightmode': this.state.userSettings && this.state.userSettings.nightmode && this.state.userSettings.nightmode === 2
        });
        let view = [{name: 'root'}];

        let currentRoutes = this.context.router.getCurrentRoutes();
        let lastRoute = currentRoutes[currentRoutes.length - 1];
        // console.log(lastRoute.name);
        // todo use lastRoute.name to send the right ammount of data to RouteHandler bellow

        return (
            <div>
                <PageLoader ref="pageLoader"/>

                <FPSStats isActive={true} />

                <div className='menu'>
                    <AppHeader
                        routeName={lastRoute.name}
                        title={this.state.title}
                        showSettings={this.showSettings}>
                    </AppHeader>

                    <RouteHandler
                        locales={'en-US'}
                        isRoot='True'
                        userData={this.state.userData}
                        userSettings={this.state.userSettings}
                        setTitle={this.setTitle}
                        showLoader={this.showLoader}
                        setCurrentFeedName={this.setCurrentFeedName} />
                </div>

                <AppSettings
                    settingsType={this.state.settingsType}
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
