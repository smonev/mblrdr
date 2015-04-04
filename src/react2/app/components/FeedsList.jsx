'use strict';

let React = require('react');
let ReactRouter = require('react-router');
let Link = ReactRouter.Link;

let classNames = require('classNames');
let PubSub = require('pubsub-js');

let AppStore = require('../AppStore.js');
let AppUtils = require('../AppUtils.js');
let AppMessages = require('./../Const.js');

let FeedsList = React.createClass({

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            folderUnreadCounts: {}
        };
    },

    componentDidMount: function() {
        this.feedReadCountChanged = PubSub.subscribe(AppMessages.FEED_READ_COUNT_CHANGED, function( msg, data ) {
            if (data.folder === this.context.router.getCurrentParams().folderName) {
                this.setState({
                    bla: Math.random()
                });
            }
        }.bind(this));
        //Velocity(this.getDOMNode(), 'callout.pulseSide');
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.feedReadCountChanged );
    },

    resolveShowRead: function() {
        let folderName = this.context.router.getCurrentParams().folderName;

        return this.props.userSettings && this.props.userSettings[folderName] && (typeof this.props.userSettings[folderName].showRead !== 'undefined') ?
                this.props.userSettings[folderName].showRead : true;
    },

    feedTitleClick: function(e) {
        AppUtils.morphElementToHeader(e);
    },

    render: function() {
        let feeds, currentFolder = this.context.router.getCurrentParams().folderName ? this.context.router.getCurrentParams().folderName : 'root';

        if ((!this.props.userData) || (!this.props.userData.bloglist[currentFolder])) {
            return (<div/>);
        }

        let showRead = this.resolveShowRead();

        feeds = this.props.userData.bloglist[currentFolder];
        feeds = feeds
            .map(function (feed) {
                let url = '/' + encodeURIComponent(currentFolder) + '/' + encodeURIComponent(feed.url);

                let feedUnreadCount = 0;

                if (AppStore.readData && AppStore.readData[feed.url]) {
                    feedUnreadCount = AppStore.readData[feed.url].totalCount - AppStore.readData[feed.url].readCount;
                }

                let feedClasses = classNames({
                    feed: true,
                    unread: feedUnreadCount > 0,
                    'displayNone': false
                });

                if (feedUnreadCount < 0) {
                    feedUnreadCount = 0;
                } else if (feedUnreadCount > 99) {
                    feedUnreadCount = '99';
                }

                if ((feedUnreadCount === 0) && (!showRead)) {
                    return (<div />);
                }

                return (
                    <li className={feedClasses} key={feed.url} data-url={feed.url}>
                        <Link to={url} data-url={feed.url} onClick={this.feedTitleClick}>
                            <span className='fa fa-file'>
                                <span className='unreadCount'>{feedUnreadCount !== 0 ? feedUnreadCount : ''}</span>
                            </span>
                            <span className='feedTitle'>{feed.title ? feed.title : '-'}</span>
                        </Link>
                    </li>
                );
            }.bind(this));

        return (
            <ul className='menuList'>
                {feeds}
            </ul>
        );
    }
});

module.exports = FeedsList;
