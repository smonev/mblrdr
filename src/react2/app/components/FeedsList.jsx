'use strict';

var React = require('react');
var ReactRouter = require('react-router');
var Link = ReactRouter.Link;
var cx = React.addons.classSet;

var PubSub = require('pubsub-js');

var AppStore = require('../AppStore.js');

var FeedsList = React.createClass({
    mixins: [ ReactRouter.State ],

    getInitialState: function() {
        return {
            folderUnreadCounts: {}
        };
    },

    componentDidMount: function() {
        this.feedReadCountChanged = PubSub.subscribe('FEED_READ_COUNT_CHANGED', function( msg, data ) {
            if (data.folder === this.getParams().folderName) {
                this.setState({
                    bla: Math.random()
                });
            }
        }.bind(this));
        Velocity(this.getDOMNode(), 'callout.pulseSide');
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.feedReadCountChanged );
    },

    resolveShowRead: function() {
        var folderName = this.getParams().folderName;

        return this.props.userSettings && this.props.userSettings[folderName] && (typeof this.props.userSettings[folderName].showRead !== 'undefined') ?
                this.props.userSettings[folderName].showRead : true;
    },

    feedTitleClick: function(e) {
        //Velocity(e.target, 'callout.top', function() {
        //});
    },

    render: function() {
        var feeds, currentFolder = this.getParams().folderName ? this.getParams().folderName : 'root';

        if ((!this.props.userData) || (!this.props.userData.bloglist[currentFolder])) {
            return (<div/>);
        }

        var showRead = this.resolveShowRead();

        feeds = this.props.userData.bloglist[currentFolder];
        feeds = feeds
            .map(function (feed) {
                var url = '/' + encodeURIComponent(currentFolder) + '/' + encodeURIComponent(feed.url);

                var feedUnreadCount = 0;

                if (AppStore.readData && AppStore.readData[feed.url]) {
                    feedUnreadCount = AppStore.readData[feed.url].totalCount - AppStore.readData[feed.url].readCount;
                }

                var feedClasses = cx({
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
