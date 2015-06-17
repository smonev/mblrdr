'use strict';

let React = require('react');
let ReactRouter = require('react-router');
let Link = ReactRouter.Link;

let classNames = require('classNames');
let PubSub = require('pubsub-js');

let AppStore = require('../AppStore.js');
let AppUtils = require('../AppUtils.js');
let AppMessages = require('./../AppMessages.js');
let ArticlesList = require('./ArticlesList.js');

let FeedsList = React.createClass({

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            folderUnreadCounts: {},
            closedFeeds: [],
            currentFeed: '',
            showRead: false
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

    setCurrentFeed: function(feedUrl) {
        this.setState({
            currentFeed: feedUrl
        });
    },

    setCurrentArticleList: function(currentArticleList) {
        this.setState({
            currentArticleList: currentArticleList
        });
    },

    feedTitleClick: function(e) {
        AppUtils.morphElementToHeader(e);
    },

    showMultipleArticlesClick: function(feed) {
        let closedFeeds = this.state.closedFeeds;

        if (typeof closedFeeds[feed] === 'undefined') {
            closedFeeds[feed] = false;
        }
        closedFeeds[feed] = !closedFeeds[feed];

        this.setState({
            closedFeeds: closedFeeds
        });
    },

    goToNextArticleList: function(currentArticleList, direction) {
        let refName = 'articlesList' + (currentArticleList + direction);
        if (this.refs[refName]) {
            PubSub.publish('OPEN_FIRST_ARTICLE', {
                refName: refName,
                direction: direction
            });
        }
    },

    showReadItems: function() {
        this.setState({
            showRead: true
        });
    },

    render: function() {
        let feeds, currentFolder = this.context.router.getCurrentParams().folderName ? this.context.router.getCurrentParams().folderName : 'root';

        if ((!this.props.userData) || (!this.props.userData.bloglist[currentFolder])) {
            return (<div/>);
        }

        let showRead = this.resolveShowRead() || this.state.showRead;
        let multipleFeedsView = typeof this.props.multipleFeedsView !== 'undefined' ? this.props.multipleFeedsView : true;

        feeds = this.props.userData.bloglist[currentFolder];
        let refCounter = 0;
        feeds = feeds
            .map(function (feed) {
                let url = '/' + encodeURIComponent(currentFolder) + '/' + encodeURIComponent(feed.url);
                let encodedFeedUrl = encodeURIComponent(feed.url);
                let feedUnreadCount = 0;

                if (AppStore.readData && AppStore.readData[feed.url]) {
                    feedUnreadCount = AppStore.readData[feed.url].totalCount - AppStore.readData[feed.url].readCount;
                }

                let feedClasses = classNames({
                    feed: true,
                    unread: feedUnreadCount > 0,
                    displayNone: false,
                    hasFeeds: feedUnreadCount !== 0 && (!(this.state.closedFeeds && this.state.closedFeeds[encodedFeedUrl]))
                });

                if (feedUnreadCount < 0) {
                    feedUnreadCount = 0;
                } else if (feedUnreadCount > 99) {
                    feedUnreadCount = 99;
                }

                if (
                    (feedUnreadCount === 0) &&
                    (!showRead) &&
                    (!(this.state.currentFeed === feed.url))
                ) {
                    return false;
                }

                let articlesList = '';
                let articlesHeader;
                let hasFeeds = false;
                if (multipleFeedsView) {
                    if (this.state.closedFeeds && this.state.closedFeeds[encodedFeedUrl]) {
                        articlesList = '';
                    } else {
                        refCounter = refCounter + 1;
                        let refName = 'articlesList' + refCounter;
                        articlesList =
                            <ArticlesList
                                ref={refName}
                                refCounter={refCounter}
                                name={refName}
                                goToNextArticleList={this.goToNextArticleList}
                                feedUrl={encodedFeedUrl}
                                setCurrentFeed = {this.setCurrentFeed}
                                setCurrentArticleList = {this.setCurrentArticleList}
                                multipleFeedsView={true}>
                            </ArticlesList>;
                    }

                    let unreadCountClassName = classNames({
                        unreadCountMultipleView: true
                    });

                    articlesHeader =
                        <div>
                            <span className={unreadCountClassName} onClick={this.showMultipleArticlesClick.bind(this, (encodedFeedUrl))} >
                                {feedUnreadCount !== 0 ? feedUnreadCount : String.fromCharCode(183)}
                            </span>
                            <Link to={url} data-url={feed.url} onClick={this.feedTitleClick}>
                                <span className='feedTitle'>{feed.title ? feed.title : '-'}</span>
                            </Link>
                        </div>;
                } else {
                    articlesHeader =
                        <Link to={url} data-url={feed.url} onClick={this.feedTitleClick}>
                            <span className='fa fa-circle'>
                                <span className='unreadCount'>{feedUnreadCount !== 0 ? feedUnreadCount : ''}</span>
                            </span>
                            <span className='feedTitle'>{feed.title ? feed.title : '-'}</span>
                        </Link>;
                }

                return (
                    <li className={feedClasses} key={feed.url} data-url={feed.url}>
                        {articlesHeader}
                        {articlesList}
                        {/*<span className="fa fa-ellipsis-v"></span>*/ }
                    </li>
                );
            }.bind(this));

        let menuListClasses = classNames({
            'menuList': true,
            'multipleFeeds': multipleFeedsView
        });

        if (multipleFeedsView && (refCounter === 0)) {
            feeds =
                <li className="noUnreadItems">
                    <span>No unread feeds</span>
                    <a onClick={this.showReadItems}>SHOW ALL</a>
                </li>;
        }

        return (
            <ul className={menuListClasses}>
                {feeds}
            </ul>
        );
    }
});

module.exports = FeedsList;
