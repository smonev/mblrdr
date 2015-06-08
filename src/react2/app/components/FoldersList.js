'use strict';

let React = require('react');
let ReactRouter = require('react-router');
let Link = ReactRouter.Link;

let PubSub = require('pubsub-js');

let FeedsList = require('../components/FeedsList.js');
let AppStore = require('../AppStore.js');
let AppUtils = require('../AppUtils.js');
let AppMessages = require('./../AppMessages.js');

let FoldersList = React.createClass({
    getInitialState: function() {
        return {
            foldersUnreadCount: AppStore.foldersUnreadCount ? AppStore.foldersUnreadCount : {}
        };
    },

    componentDidMount: function() {
        this.folderUnreadCountChanged = PubSub.subscribe(AppMessages.FOLDERS_UNREAD_COUNT_CHANGED, function( msg, data ) {
            this.setState({
                foldersUnreadCount: AppStore.foldersUnreadCount
            });
        }.bind(this));
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.folderUnreadCountChanged );
    },

    folderClick: function(e) {
        AppUtils.morphElementToHeader(e);
    },

    render: function() {
        let feeds, folders;

        if (!this.props.userData) {
            return (<div/>);
        }

        folders = Object.keys(this.props.userData.bloglist);
        folders = folders.filter(function(element){
            return element !== 'root';
        }).map(function (folder) {
            let linkToFolder = '/' + folder;
            let folderUnreadCount;
            if (this.state.foldersUnreadCount && this.state.foldersUnreadCount[folder]) {
                folderUnreadCount = this.state.foldersUnreadCount[folder];

                if (folderUnreadCount <= 0) {
                    folderUnreadCount = '';
                } else if (folderUnreadCount > 999) {
                    folderUnreadCount = '999';
                }
            }

            // get all folder feeds
            let unreadFeeds = this.props.userData.bloglist[folder];

            // get unread
            unreadFeeds = unreadFeeds.filter(function(feed, i) {
                let unreadData, unreadCount;
                unreadData = AppStore.readData[feed.url];
                if (typeof unreadData !== 'undefined') {
                    unreadCount = AppStore.readData[feed.url].totalCount - AppStore.readData[feed.url].readCount;
                    if (unreadCount > 0) {
                        feed.unreadCount = unreadCount;
                        return feed;
                    }
                }
            });

            // get first 5, todo sort them before
            unreadFeeds = unreadFeeds.slice(0, 5).map(function(feed) {
                let url = linkToFolder + '/' + encodeURIComponent(feed.url);
                return  <li key={url}>
                            <Link to={url} onClick={this.folderClick} >
                                <span className="title" title={feed.title}>{feed.title}</span>
                                <span className="sunreadCount">({feed.unreadCount})</span>
                            </Link>
                        </li>;
            }.bind(this));

            let unreadFeedsString = '';
            if (unreadFeeds.length > 0) {
                unreadFeedsString = <ul className="someFeeds">{unreadFeeds}</ul>;
            }

            return (
                <li className='folder' key={folder} >
                    <Link to={linkToFolder} onClick={this.folderClick} >
                        <span className='fa fa-circle'>
                            <span className='unreadCount'>{folderUnreadCount}</span>
                        </span>
                        <span>
                            {folder}
                        </span>
                    </Link>
                    {unreadFeedsString}
                </li>
            );
        }.bind(this));

        if (this.props.isRoot === 'True') {
            feeds = <FeedsList userData={this.props.userData} multipleFeedsView={false}/>;
        }

        return (
            <ul className='menuList'>
                {folders}
                {feeds}
            </ul>
        );
    }
});

module.exports = FoldersList;

