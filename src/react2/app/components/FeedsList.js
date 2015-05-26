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
            closedFeeds: []
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

        document.addEventListener('keyup', this.keyUp);
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.feedReadCountChanged );
        PubSub.unsubscribe( this.folderUnreadCountChanged );
        document.removeEventListener('keyup', this.keyUp);
    },

    resolveShowRead: function() {
        let folderName = this.context.router.getCurrentParams().folderName;

        return this.props.userSettings && this.props.userSettings[folderName] && (typeof this.props.userSettings[folderName].showRead !== 'undefined') ?
                this.props.userSettings[folderName].showRead : true;
    },

    keyUp: function(e) {
        let ref;

        if (e.keyCode === 74) { //j
            ref = 'article' + (this.state.currentActive + 1);
            if (this.refs[ref]) {
                this.refs[ref].openArticle.call();
            }
        } else if (e.keyCode === 75) { //k
            ref = 'article' + (this.state.currentActive - 1);
            if (this.refs[ref]) {
                this.refs[ref].openArticle.call();
            }
        } else if (e.keyCode === 78) { //n
            ref = 'article' + (this.state.currentActive + 1);
            //this.refs[ref].movetoArticle.call();
        } else if (e.keyCode === 80) { //p
            ref = 'article' + (this.state.currentActive - 1);
            //this.refs[ref].movetoArticle.call();
        } else if ((e.keyCode === 79) || (e.keyCode === 13)) { //o, enter
            ref = 'article' + (this.state.currentActive);
            this.refs[ref].openArticle.call();
        } else if (e.keyCode === 189) { //-
            ref = 'article' + (this.state.currentActive);
            this.refs[ref].zoomContent(-1);
        } else if (e.keyCode === 187) { //=
            ref = 'article' + (this.state.currentActive);
            this.refs[ref].zoomContent(1);
        } if (e.keyCode === 48) { //=
            ref = 'article' + (this.state.currentActive);
            this.refs[ref].zoomContent(0);
        } else if (e.keyCode === 83) { //s
            ref = 'article' + (this.state.currentActive);
            this.refs[ref].toggleArticleStar();
        } else if (e.keyCode === 86) { //v
            //todo openCurrentArticleInNewWindow();
        } else if (e.keyCode === 77) { //m
            //todo toggleCurrentArticleRead();
        } else if (e.keyCode === 191) { //?
            //todo show help (controls)
        }
    },

    feedTitleClick: function(e) {
        AppUtils.morphElementToHeader(e);
    },

    showMultipleArticlesClick: function(feed) {
        let closedFeeds = this.state.closedFeeds;

        if (typeof closedFeeds[feed] === 'undefined') {
            closedFeeds[feed] = false;
        }
        closedFeeds[feed] = !closedFeeds[feed]  ;

        this.setState({
            closedFeeds: closedFeeds
        });
    },

    render: function() {
        let feeds, currentFolder = this.context.router.getCurrentParams().folderName ? this.context.router.getCurrentParams().folderName : 'root';

        if ((!this.props.userData) || (!this.props.userData.bloglist[currentFolder])) {
            return (<div/>);
        }

        let showRead = this.resolveShowRead();
        let multipleFeedsView = typeof this.props.multipleFeedsView !== 'undefined' ? this.props.multipleFeedsView : true;

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

                let articlesList = '';
                let articlesHeader;
                if (multipleFeedsView) {
                    let encodedFeedUrl = encodeURIComponent(feed.url);
                    if (this.state.closedFeeds && this.state.closedFeeds[encodedFeedUrl]) {
                        articlesList = '';
                    } else {
                        articlesList = <ArticlesList feedUrl={encodedFeedUrl} multipleFeedsView={multipleFeedsView}></ArticlesList>;
                    }

                    let unreadCountClassName = classNames({
                        unreadCountMultipleView: true,
                        hasFeeds: feedUnreadCount !== 0 && (!(this.state.closedFeeds && this.state.closedFeeds[encodedFeedUrl]))
                    });

                    articlesHeader =
                        <div>
                            <span className={unreadCountClassName} onClick={this.showMultipleArticlesClick.bind(this, (encodedFeedUrl))} >
                                {feedUnreadCount !== 0 ? feedUnreadCount : ''}
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
                    </li>
                );
            }.bind(this));

        let menuListClasses = classNames({
            'menuList': true,
            'multipleFeeds': multipleFeedsView
        });

        return (
            <ul className={menuListClasses}>
                {feeds}
            </ul>
        );
    }
});

module.exports = FeedsList;