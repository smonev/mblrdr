var React = require('react');
var ReactRouter = require('react-router');
var Link = ReactRouter.Link;
var PubSub = require('pubsub-js');
var cx = React.addons.classSet;
var AppStore = require('../AppStore.js')


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
                    bla: Math.random(312312)
                });
            }
        }.bind(this));
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.feedReadCountChanged );
    },

    render: function() {
        var feeds, currentFolder = this.getParams().folderName ? this.getParams().folderName : 'root';

        if ((!this.props.userData) || (!this.props.userData.bloglist[currentFolder])) {
            return (<div/>);
        }

        feeds = this.props.userData.bloglist[currentFolder];
        feeds = feeds
            .map(function (feed) {
                var url = "/" + encodeURIComponent(currentFolder) + '/' + encodeURIComponent(feed.url);

                var feedUnreadCount = 0;

                if (AppStore.readData && AppStore.readData[feed.url]) {
                    feedUnreadCount = AppStore.readData[feed.url].totalCount - AppStore.readData[feed.url].readCount;

                    if (feedUnreadCount <= 0) {
                        feedUnreadCount = 0;
                    } else if (feedUnreadCount > 99) {
                        feedUnreadCount = '99+'
                    }
                }

                var feedClasses = cx({
                    feed: true,
                    unread: feedUnreadCount > 0
                });

                return (
                    <li className={feedClasses} key={feed.url} data-url={feed.url}>
                        <Link to={url} data-url={feed.url}>
                            <span className="unreadHandle"></span>
                            <span className="fa fa-file"></span>
                            <span className="feedTitle">{feed.title}</span>
                            <span className="unreadCount">{feedUnreadCount !== 0 ? feedUnreadCount: ''}</span>
                        </Link>
                    </li>
                );
            });

        return (
            <ul className="menuList">
                {feeds}
            </ul>
        );
    }
});

module.exports = FeedsList;
