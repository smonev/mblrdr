'use strict';

/** @jsx React.DOM */

var React = require('react');
var ReactRouter = require('react-router');
var Link = ReactRouter.Link;

var PubSub = require('pubsub-js');

var FeedsList = require('../components/FeedsList.jsx');
var AppStore = require('../AppStore.js');
var AppUtils = require('../AppUtils.js');
var AppMessages = require('./../Const.js');

var FoldersList = React.createClass({
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
        var folders = this.getDOMNode().querySelectorAll('.folder');

        if (folders.length > 0) {
            var i = 0;
            //$.each(folders, function(i, el) {
            //    $(el).delay(50 + (i * 10)).velocity('callout.pulseSide');
            //})
            //Velocity(this.getDOMNode(), 'callout.pulseSide');
        }
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.folderUnreadCountChanged );
    },

    folderClick: function(e) {
        AppUtils.morphElementToHeader(e);
    },

    render: function() {
        var feeds, folders;

        if (!this.props.userData) {
            return (<div/>);
        }

        folders = Object.keys(this.props.userData.bloglist);
        folders = folders.filter(function(element){
            return element !== 'root';
        }).map(function (folder) {
            var linkToFolder = '/' + folder;
            var folderUnreadCount;
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
