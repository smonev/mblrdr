/** @jsx React.DOM */
var React = require('react');
var jQuery = require('jquery')

var AppHeader = require('./components/AppHeader.js');
var AppSettings = require('./components/AppSettings.js');

var AppFolders = require('./components/AppFolders.js');
var FolderFeeds = require('./components/FolderFeeds.js');
var FeedArticles = require('./components/FeedArticles.js');

window.jQuery = jQuery;
window.$ = jQuery;


var App = React.createClass({
    getInitialState: function() {
        return {
            settingsVisible: false,
            folders: [],
            feeds: [],
            articles: [],
            view: [{
                type: 'folder',
                name: 'root'
            }],
            userSettings: {},
            bloglist: {},
            username: '',
            nightmode: false
        }
    },

    componentDidMount: function() {
        $.get(this.props.source, function(result) {
            if (this.isMounted()) {
                this.setState({
                    folders: Object.keys(result.bloglist),
                    feeds: result.bloglist['1'],
                    userSettings: result.userSettings,
                    bloglist: result.bloglist,
                    username: result.username
                });

                console.log(result.bloglist);

                //todo use EventEmmiter
                if (result.userSettings.nightmode === 2) {
                    $('body').addClass('nightmode');
                }
            }
        }.bind(this));
    },

    showSettings: function() {
        this.setState({settingsVisible: true});
    },

    hideSettings: function() {
        this.setState({settingsVisible: false});
    },

    saveSettings: function(userSettings) {
        this.setState({userSettings: userSettings});
    },

    render: function() {
        var foldersAreVisible = this.state.view === 'folder',
        feedsAreVisible = this.state.view === 'feeds',
        feedArticlesAreVisible = this.state.view === 'articles';

        var cx = React.addons.classSet;

        var nightmode = cx({
            'nightmode': this.state.userSettings.nightmode === 2
        });

        return (
            <div>
                <div className='menu'>
                    <AppHeader showSettings={this.showSettings} />

                    <AppFolders visible={foldersAreVisible} folders={this.state.folders} feeds={this.state.feeds} />
                    <FolderFeeds visible={feedsAreVisible} feeds={this.state.feeds} />
                    <FeedArticles visible={feedArticlesAreVisible} articles={this.state.articles}/>
                </div>

                <AppSettings
                    visible={this.state.settingsVisible}
                    view={this.state.view}
                    bloglist={this.state.bloglist}
                    userSettings={this.state.userSettings}
                    saveSettings={this.saveSettings}
                    hideSettings={this.hideSettings} />
            </div>
        );
    }
});

React.initializeTouchEvents(true)

module.exports = App;
