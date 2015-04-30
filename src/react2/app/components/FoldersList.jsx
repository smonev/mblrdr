'use strict';

let React = require('react');
let ReactRouter = require('react-router');
let Link = ReactRouter.Link;

let PubSub = require('pubsub-js');

let FeedsList = require('../components/FeedsList.jsx');
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
        let folders = this.getDOMNode().querySelectorAll('.folder');

        if (folders.length > 0) {
            let i = 0;
        }
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
            return (
                <li className='folder' key={folder} >
                    <Link to={linkToFolder} onClick={this.folderClick}>
                        <span className='fa fa-folder'>
                            <span className='unreadCount'>{folderUnreadCount}</span>
                        </span>
                        <span className='feedTitle'>{folder}</span>
                    </Link>
                </li>
            );
        }.bind(this));

        if (this.props.isRoot === 'True') {
            feeds = <FeedsList userData={this.props.userData} />;
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

