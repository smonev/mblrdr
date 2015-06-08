'use strict';

let React = require('react');
let ReactRouter = require('react-router');

let classNames = require('classNames');
let PubSub = require('pubsub-js');

let Article = require('../components/Article.js');
let AppUtils = require('../AppUtils.js');
let AppStore = require('../AppStore.js');
let AppMessages = require('./../AppMessages.js');

let ArticlesList = React.createClass({
//    mixins: [React.addons.PureRenderMixin],

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            articles: [],
            read: [],
            star: [],
            componentCounter: 0,
            nextcount: -1,
            allArticlesAreRead: false,
            noMoreArticles: false,
            articlesOpenThisSession: []
        };
    },

    componentDidMount: function() {
        let feedUrl = this.props.feedUrl;
        if (!feedUrl) {
            feedUrl = this.context.router.getCurrentParams().feedUrl;
        }

        feedUrl = feedUrl + '?count=-1';

        AppUtils.getFeedData(feedUrl, this.getFeedDataSuccess);

        this.resolveShowRead();

        if (!this.props.multipleFeedsView) {
            document.addEventListener('keyup', this.keyUp);
        }

        this.handleAddNewFeedProcess();

        this.markReadFeedEvent = PubSub.subscribe(AppMessages.MARK_READ_FEED, function( msg, data ) {
            this.markFeedAsRead(data);
        }.bind(this));

        this.showReadChangeEvent = PubSub.subscribe(AppMessages.SHOWREAD_CHANGE, function( msg, data ) {
            this.render();
        }.bind(this));

        // Velocity(this.getDOMNode(), 'callout.pulseDownblabla');
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.markReadFeedEvent );
        PubSub.unsubscribe( this.showReadChangeEvent );

        document.removeEventListener('keyup', this.keyUp);
    },

    getFeedDataSuccess: function (result) {
        if (this.isMounted()) {
            let articles = this.state.articles;
            articles.push.apply(this.state.articles, JSON.parse(result.feed ? result.feed : '[]'));

            let read = this.state.read;
            read.push.apply(this.state.read, result.read.split(','));

            let star = this.state.star;
            star.push.apply(this.state.star, result.star.split(','));

            // if (this.props.multipleFeedsView) {
            //     // //get only unread
            //     articles = articles.filter(function (article) {
            //         return read.indexOf(article.id) === -1;
            //     });

            //     articles = articles.slice(0, 3);
            // }



            this.setState({
                articles: articles,
                readCount: result.readCount,
                read: read,
                star: star,
                nextcount: result.nextcount
            });

            if (this.state.articles.length > 0) {
                let feedUrl = this.props.feedUrl;
                if (!feedUrl) {
                    feedUrl = this.context.router.getCurrentParams().feedUrl;
                }

                AppUtils.updateFeedTitleIfNeeded(
                    this.context.router.getCurrentParams().folderName,
                    feedUrl,
                    this.state.articles[0].feedTitle
                );

                if (!this.props.multipleFeedsView) {
                    PubSub.publish(AppMessages.TITLE_CHANGE_EVENT, this.state.articles[0].feedTitle);
                }
            }

            if (!this.props.multipleFeedsView) {
                if (!this.moreLinkInitialized) {
                    this.moreLinkInitialized = true;
                    this.moreLinkAppearSetup();
                }
            } else {
                if (this.state.articles.length > 20) {
                    // enough preview
                    return;
                }

                let feedUrl = this.props.feedUrl;
                if (!feedUrl) {
                    feedUrl = this.context.router.getCurrentParams().feedUrl;
                }

                let serviceUrl = feedUrl + '?count=' + this.state.nextcount;
                let decodedFeedUrl =  decodeURIComponent(feedUrl);



                if (this.thereAreMoreUnread(decodedFeedUrl)) {
                    AppUtils.getFeedData(serviceUrl, this.getFeedDataSuccess);
                }
            }
        }
    },

    moreLinkAppearSetup: function() {
        let that = this;
        appear({
            elements: function elements(){
                return document.getElementsByClassName('moreLink2');
            },
            appear: function appear(){
                that.moreClick.call();
            },
            bounds: 100,
            reappear: true
        });
    },

    thereAreMoreUnread: function(decodedFeedUrl) {
        if ( (AppStore.readData) && (AppStore.readData[decodedFeedUrl]) ) {
            return AppStore.readData[decodedFeedUrl].totalCount > AppStore.readData[decodedFeedUrl].readCount;
        } else {
            return true;
        }
    },

    thereAreMore: function (componentCounter, decodedFeedUrl) {
        if ( (AppStore.readData) && (AppStore.readData[decodedFeedUrl]) ) {
            return AppStore.readData[decodedFeedUrl].totalCount !== componentCounter;
        } else {
            return true;
        }
    },

    moreClick: function() {

        let serviceUrl = this.context.router.getCurrentParams().feedUrl + '?count=' + this.state.nextcount;
        let decodedFeedUrl =  decodeURIComponent(this.context.router.getCurrentParams().feedUrl);

        if (!this.thereAreMoreUnread(decodedFeedUrl)) {
            this.setState({
                noMoreArticles: true
            });
        }

        let showRead = this.resolveShowRead();
        if (this.props.multipleFeedsView) {
            showRead = false;
        }

        if (showRead && this.thereAreMore(this.state.componentCounter, decodedFeedUrl)) {
            AppUtils.getFeedData(serviceUrl, this.getFeedDataSuccess);
        } else if ((!showRead) && this.thereAreMoreUnread(decodedFeedUrl)) {
            AppUtils.getFeedData(serviceUrl, this.getFeedDataSuccess);
        } else {
            this.setState({
                noMoreArticles: true
            });
        }
    },

    resolveShowRead: function() {
        let view = this.getView(), showRead = true;
        try {
            showRead = this.props.userSettings[view[0].name][view[1].name].showRead;
        } catch (e) {
        }

        return showRead;
    },

    handleAddNewFeedProcess: function() {
        if (this.context.router.getCurrentQuery().new === '1') {
            this.timeoutToClear = setTimeout(function() {
                clearTimeout(this.timeoutToClear);
                let url = '/' + this.context.router.getCurrentParams().folderName + '/' + this.context.router.getCurrentParams().feedUrl;
                this.context.router.transitionTo(url);
            }.bind(this), 7000);
        }
    },

    goToNextArticleMain: function(direction, currentActive) {
        this.setState({
            currentActive: currentActive
        });
        let ref = 'article' + (currentActive + direction);
        if (this.refs[ref]) {
            this.refs[ref].openArticle.call();
        } else {
            AppUtils.scrollTo(0, 300);
        }
    },

    markFeedAsRead: function(data) {
        this.setState({
            allArticlesAreRead: true,
            i: Math.random()
        });
    },

    getView: function() {
        let view;

        if (this.context.router.getCurrentParams().feedUrl) {
            view = [{
                name: this.context.router.getCurrentParams().folderName
            }, {
                name: this.context.router.getCurrentParams().feedUrl
            }];
        } else if (this.context.router.getCurrentParams().folderName) {
            view = [{
                name: this.context.router.getCurrentParams().folderName
            }];
        } else {
            view = [{
                name: 'root'
            }];
        }

        return view;
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

    toggleArticleOpen: function(id, currentActive) {
        let feedUrl = this.props.feedUrl;
        if (!feedUrl) {
            feedUrl = this.context.router.getCurrentParams().feedUrl;
        }

        if (this.state.read.indexOf(id) === -1) {
            this.state.read.push(id);

            AppUtils.markArticleAsRead({
                folder: this.context.router.getCurrentParams().folderName,
                url: feedUrl,
                id: id
            });
        }

        //PubSub.publish(AppMessages.CURRENT_FEED, feedUrl);
        if (typeof this.props.setCurrentFeed === 'function') {
            this.props.setCurrentFeed.call(this, decodeURIComponent(feedUrl));
        }

        this.state.articlesOpenThisSession.push(id);

        this.setState({
            //read: this.state.read,
            currentActive: currentActive,
            articlesOpenThisSession: this.state.articlesOpenThisSession
        });
    },

    toggleArticleStar: function(id) {
        let stars = this.state.star, starState;
        if (this.state.star.indexOf(id) === -1) {
            this.state.star.push(id);
            starState = 1;
        } else {
            this.state.star = this.state.star.filter(function(star){
                return star !== id;
            });

            starState = 0;
        }

        let feedUrl = this.props.feedUrl;
        if (!feedUrl) {
            feedUrl = this.context.router.getCurrentParams().feedUrl;
        }

        AppUtils.starArticle({
            feed: decodeURIComponent(feedUrl),
            state: starState,
            id: id
        });

        this.setState({
            star: this.state.star
        });
    },

    render: function() {
        if (this.context.router.getCurrentQuery().new === '1') {
            let styles = {
                width: '100%',
                textAlign: 'center'
            };

            return (
                <div className='loader' style={styles}>
                    Loading ...
                    <i className='fa fa-refresh fa-spin'></i>
                </div>
            );
        }

        if (this.state.articles.length === 0) {
            this.state.articles = [];
        }

        let showRead = this.resolveShowRead();
        if (this.props.multipleFeedsView) {
            showRead = false;
        }

        let feedUrl = this.props.feedUrl;
        if (!feedUrl) {
            feedUrl = this.context.router.getCurrentParams().feedUrl;
        }
        feedUrl = decodeURIComponent(feedUrl);

        this.state.componentCounter = 0;
        let articles = this.state.articles.map(function (article) {
            this.state.componentCounter = this.state.componentCounter + 1;
            let isRead = this.state.allArticlesAreRead ||
                        (this.state.read.indexOf(article.id) > -1) ||
                        (AppStore.readData &&
                         AppStore.readData[feedUrl] &&
                         AppStore.readData[feedUrl].localReadData &&
                         AppStore.readData[feedUrl].localReadData.indexOf(article.id) > -1);

            let isStar = this.state.star.indexOf(article.id) > -1;
            let refName = 'article' + this.state.componentCounter;

            return (
                <Article key={refName} ref={refName}
                    showRead={showRead}
                    componentCounter={this.state.componentCounter}
                    currentActive={this.state.currentActive}
                    article={article} isRead={isRead} isStar={isStar}
                    wasOpenedThisSession={this.state.articlesOpenThisSession.indexOf(article.id) > -1}
                    toggleArticleStar={this.toggleArticleStar}
                    toggleArticleOpen={this.toggleArticleOpen}
                    goToNextArticleMain={this.goToNextArticleMain} />
            );
        }.bind(this));

        let moreIconClasses = classNames({
            'fa': true,
            'fa-long-arrow-down': true,
            'displayNone': this.state.noMoreArticles
        });

        let moreButtonClasses = classNames({
            'moreLink2': true,
            'displayNone': this.props.multipleFeedsView
        });

        return (
            <div>
                <ul className='articlesList' ref='feedContainer' onKeyPress={this.keyPress}>
                    {articles}
                </ul>
                <a className={moreButtonClasses} onClick={this.moreClick} nextcount={this.state.nextcount}>
                    {this.state.noMoreArticles ? 'no more articles   ' : 'load more   '}
                    <div id='colorWheel' className='colorWheel displayNone'></div>
                    <i className={moreIconClasses}></i>
                </a>
            </div>
        );
    }
});

module.exports = ArticlesList;
