var React = require("react");
var Article = require('../components/Article.jsx');
var ReactRouter = require('react-router');
var AppUtils = require('../AppUtils.js');
var AppStore = require('../AppStore.js');

var PubSub = require('pubsub-js');

//var f = v => v*v;
//alert(f(2));
//alert('mark feed as read');
//alert('import opml');
//alert('fixed position, scroll direction');

var ArticlesList = React.createClass({
    mixins: [ ReactRouter.State, ReactRouter.Navigation ],

    getInitialState: function() {
        return {
            articles: [],
            read: [],
            star: [],
            componentCounter: 0,
            nextcount: -1,
            allArticlesAreRead: false,
            noMoreArticles: false
        };
    },

    getFeedDataSuccess: function (result) {
        if (this.isMounted()) {
            this.state.articles.push.apply(this.state.articles, JSON.parse(result.feed ? result.feed : "[]"));
            this.state.read.push.apply(this.state.read, result.read.split(","));
            this.state.star.push.apply(this.state.star, result.star.split(","));

            this.setState({
                articles: this.state.articles,
                readCount: result.readCount,
                read: this.state.read,
                star: this.state.star,
                nextcount: result.nextcount
            });

            if (this.state.articles.length > 0) {
                this.props.setCurrentFeedName(this.state.articles[0].feedTitle);
                this.props.setTitle(this.state.articles[0].feedTitle);

                AppUtils.updateFeedTitleIfNeeded(this.getParams().folderName, this.getParams().feedUrl,this.state.articles[0].feedTitle);
            }

            this.moreLinkAppearSetup();
        }
    },

    moreLinkAppearSetup: function() {
        var that = this;
        appear({
            elements: function elements(){
                return document.getElementsByClassName("moreLink2");
            },
            appear: function appear(){
                that.moreClick.call();
            },
            bounds: 200,
            reappear: true
        });
    },

    moreClick: function() {
        var serviceUrl = this.getParams().feedUrl + "?count=" + this.state.nextcount + "&newFeed=0&v=" + Math.random();
        var decodedFeedUrl =  decodeURIComponent(this.getParams().feedUrl)

        var showRead = this.resolveShowRead();
        if ((showRead) || ((!showRead) && (AppStore.readData[decodedFeedUrl].totalCount > AppStore.readData[decodedFeedUrl].readCount))) {
            AppUtils.getFeedData(serviceUrl, this.getFeedDataSuccess);
        } else {
            this.setState({
                noMoreArticles: true
            });
        }
    },

    resolveShowRead: function() {
        var view = this.getView(), showRead = true;
        if (
            (this.props.userSettings[view[0].name]) &&
            (this.props.userSettings[view[0].name][view[1].name]) &&
            (typeof this.props.userSettings[view[0].name][view[1].name].showRead !== "undefined")
        ) {
            showRead =  this.props.userSettings[view[0].name][view[1].name].showRead;
        };

        return showRead;
    },

    handleAddNewFeedProcess: function() {
        if (this.getQuery().new === "1") {
            this.timeoutToClear = setTimeout(function() {
                clearTimeout(this.timeoutToClear);
                var url = "/" + this.getParams().folderName + '/' + this.getParams().feedUrl;
                this.transitionTo(url);
            }.bind(this), 7000);
        }
    },

    componentDidMount: function() {
        var feedUrl = this.getParams().feedUrl + "?count=-1&newFeed=0&v=" + Math.random();
        AppUtils.getFeedData(feedUrl, this.getFeedDataSuccess);

        this.resolveShowRead();
        document.addEventListener("keyup", this.keyUp);

        this.markReadFeedEvent = PubSub.subscribe('MARK_READ_FEED', function( msg, data ) {
            this.markFeedAsRead(data);
        }.bind(this));

        this.showReadChangeEvent = PubSub.subscribe('SHOWREAD_CHANGE', function( msg, data ) {
            this.render();
            //this.setState({
            //    i: Math.random()
            //});
        }.bind(this));


        this.handleAddNewFeedProcess();
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.markReadFolderEvent );
        PubSub.unsubscribe( this.markReadFeedEvent );
        PubSub.unsubscribe( this.showReadChangeEvent );

        document.removeEventListener("keyup", this.keyUp);
        this.props.setTitle('');
    },

    goToNextArticleMain: function(direction, currentActive) {
        this.setState({
            currentActive: currentActive
        });
        var ref = "article" + (currentActive + direction);
        if (this.refs[ref]) {
            this.refs[ref].openArticle.call();
            this.props.showLoader.call();
        }
    },

    markFeedAsRead: function(data) {
        this.setState({
            allArticlesAreRead: true,
            i: Math.random()
        });
    },

    getView: function() {
        var view;

        if (this.getParams().feedUrl) {
            title = this.props.currentFeedName;
            view = [{
                name: this.getParams().folderName
            }, {
                name: this.getParams().feedUrl
            }];
        } else if (this.getParams().folderName) {
            title = this.getParams().folderName;
            view = [{
                name: this.getParams().folderName
            }];
        } else {
            title = '';
            view = [{
                name: 'root'
            }];
        };

        return view;
    },

    keyUp: function(e) {
        var ref;

        if (e.keyCode === 74) { //j
            ref = "article" + (this.state.currentActive + 1);
            this.refs[ref].openArticle.call();
        } else if (e.keyCode === 75) { //k
            ref = "article" + (this.state.currentActive - 1);
            this.refs[ref].openArticle.call();
        } else if (e.keyCode === 78) { //n
            ref = "article" + (this.state.currentActive + 1);
            //this.refs[ref].movetoArticle.call();
        } else if (e.keyCode === 80) { //p
            ref = "article" + (this.state.currentActive - 1);
            //this.refs[ref].movetoArticle.call();
        } else if ((e.keyCode === 79) || (e.keyCode === 13)) { //o, enter
            ref = "article" + (this.state.currentActive);
            this.refs[ref].openArticle.call();
        } else if (e.keyCode === 189) { //-
            ref = "article" + (this.state.currentActive);
            this.refs[ref].zoomContent(-1);
        } else if (e.keyCode === 187) { //=
            ref = "article" + (this.state.currentActive);
            this.refs[ref].zoomContent(1);
        } if (e.keyCode === 48) { //=
            ref = "article" + (this.state.currentActive);
            this.refs[ref].zoomContent(0);
        } else if (e.keyCode === 83) { //s
            ref = "article" + (this.state.currentActive);
            this.refs[ref].toggleArticleStar();
        } else if (e.keyCode === 86) { //v
            //openCurrentArticleInNewWindow();
        } else if (e.keyCode === 77) { //m
            //toggleCurrentArticleRead();
        } else if (e.keyCode === 191) { //?
            //
        }
    },

    toggleArticleOpen: function(id, currentActive) {
        if (this.state.read.indexOf(id) === -1) {
            this.state.read.push(id);

            AppUtils.markArticleAsRead({
                folder: this.getParams().folderName,
                url: this.getParams().feedUrl,
                id: id
            });
        };

        this.setState({
            read: this.state.read,
            currentActive: currentActive
        });
    },

    toggleArticleStar: function(id) {
        if (this.state.star.indexOf(id) === -1) {
            this.state.star.push(id);
            starState = 1;
        } else {
            this.state.star.pop(id);
            starState = 0;
        };

        AppUtils.starArticle({
            feed: decodeURIComponent(this.getParams().feedUrl),
            state: starState,
            id: id
        });

        this.setState({
            star: this.state.star
        });
        //todo persist
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        //console.log(nextProps);
        //console.log(nextState.nextcount);
        //console.log(this.state.nextcount);

        return true; //nextProps.componentCounter === nextProps.currentActive;
    },

    render: function() {
        if (this.getQuery().new === "1") {
            var styles = {
                width: "100%",
                textAlign: "center"
            };

            return (
                <div className="loader" style={styles}>
                    Loading ...
                    <i className="fa fa-refresh fa-spin"></i>
                </div>
            )
        }

        if (this.state.articles.length === 0) {
            return (<div></div>);
        }

        var showRead = this.resolveShowRead();

        this.state.componentCounter = 0;
        var articles = this.state.articles.map(function (article) {
            this.state.componentCounter = this.state.componentCounter + 1;
            var isRead = this.state.allArticlesAreRead || this.state.read.indexOf(article.id) > -1;
            var isStar = this.state.star.indexOf(article.id) > -1;
            var refName = "article" + this.state.componentCounter;
            //var refName = "article" + (article.id * article.id);

            return (
                //bla
                <Article key={refName} ref={refName} showRead={showRead}
                    componentCounter={this.state.componentCounter}
                    currentActive={this.state.currentActive}
                    article={article} isRead={isRead} isStar={isStar}
                    toggleArticleStar={this.toggleArticleStar}
                    toggleArticleOpen={this.toggleArticleOpen}
                    goToNextArticleMain={this.goToNextArticleMain} />
            );
        }.bind(this));

        var moreIconClasses = React.addons.classSet({
            'fa': true,
            'fa-long-arrow-down': true,
            'displayNone': this.state.noMoreArticles
        });

        return (
            <div>
                <ul className="articlesList" ref="feedContainer" onKeyPress={this.keyPress}>
                    {articles}
                </ul>
                <a className="moreLink2" onClick={this.moreClick} nextcount={this.state.nextcount}>
                    {this.state.noMoreArticles ? 'no more articles': 'load more'}
                    <i className={moreIconClasses}></i>
                </a>
            </div>
        );
    }
});

module.exports = ArticlesList;
