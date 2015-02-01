var React = require('react');
var AppUtils = require('../AppUtils');
var cx = React.addons.classSet;
var ReactIntlMixin = require('react-intl');
var hammer = require('hammerjs')
window.Hammer = hammer;

var ArticleHeader = React.createClass({
    mixins: [ReactIntlMixin],

    componentDidMount: function() {
        Velocity(this.getDOMNode(), "callout.pulseDown");
    },

    toggleArticleOpen: function(e) {
        e.preventDefault();
        this.props.toggleArticleOpen.call();
    },

    toggleArticleStar: function(e) {
        e.preventDefault();
        this.props.toggleArticleStar.call();
    },

    render: function() {
        var starClass = cx({
            "fa": true,
            "fa-star": this.props.isStar,
            "fa-star-o": !this.props.isStar,
        });


        var articleDate;
        try {
            articleDate = this.props.date ? this.formatRelative(this.props.date): '';
        } catch (err) {
            articleDate = this.props.date;
        }

        return(
            <div>
                <a href={this.props.url} target="_blank" className="headerAuthorAndDate">
                    {this.props.author}
                    {this.props.author && articleDate ? '\u00A0 \u00b7 \u00A0 ': ''}
                    {articleDate}
                </a>

                <div class="bla">
                    <span className="unreadHandle"></span>
                    <a className="star" onClick={this.toggleArticleStar}>
                        <span className={starClass}></span>
                    </a>

                    <a onClick={this.toggleArticleOpen} href={this.props.url} className="title">{this.props.title}</a>
                </div>
            </div>

        )

    }
});

var ArticleContent = React.createClass({
    mixins: [ReactIntlMixin],
    getInitialState: function() {
        return {
            initialZoom: {}
        }
    },

    panend: function(e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            if (e.deltaX > 100) {
                this.props.goToNextArticle.apply(this, [1]);
            } else if (e.deltaX < -100) {
                this.props.goToNextArticle.apply(this, [-1]);
            }
        }
    },

    componentDidMount: function() {
        this.setState({
            initialZoom: this.getCurrentZoomFromWindow()
        });

        this.hammertime = new Hammer( this.getDOMNode() );
        this.hammertime.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL }));
        this.hammertime.on('panend', this.panend);
    },

    componentWillUnmount: function() {
        if (this.hammertime) {
            this.hammertime.destroy();
        }
    },

    goToNextArticle: function (e) {
        e.preventDefault();
        this.props.goToNextArticle.apply(this, [1]);
    },

    goToPrevArticle: function (e) {
        e.preventDefault();
        this.props.goToNextArticle.apply(this, [-1]);
    },

    zoomContent: function (out) {
        this.props.zoomContent.apply(this, [out]);
    },

    getCurrentZoomFromWindow: function() {
        //close your eyes
        var fontSize = parseInt(window.getComputedStyle(this.getDOMNode().querySelectorAll('.content')[0], null).getPropertyValue('font-size'));
        var lineHeight = parseInt(window.getComputedStyle(this.getDOMNode().querySelectorAll('.content')[0], null).getPropertyValue('line-height'));

        return {
            fontSize: fontSize,
            lineHeight: lineHeight
        }
    },

    render: function() {
        var mainSectionClasses = cx({
            "contentHeader": true,
            "displayNone": !this.props.isOpen,
        });

        var contentSectionClasses = cx({
            "content": true,
            "displayNone": !this.props.isOpen
        });

        var zoomStyle = {
            fontSize: this.state.initialZoom.fontSize + (this.props.zoomLevel * 3) + "px",
            lineHeight: this.state.initialZoom.lineHeight  + (this.props.zoomLevel * 3) + "px"
        };

        var articleDate;
        try {
            //formatRelative might be undefined
            articleDate = this.props.date ? this.formatRelative(this.props.date): '';
        } catch (err) {
            articleDate = this.props.date;
        }


        return(
            <div>
                <section className={mainSectionClasses}>
                    <span className="title">{this.props.title}</span>
                    <span className="fa fa-angle-double-right" onClick={this.goToNextArticle}></span>
                    <span className="fa fa-angle-double-left" onClick={this.goToPrevArticle}></span>
                    <span className="fa fa-angle-double-up displayNone"></span>
                    <span className="fa fa-share displayNone"></span>
                    <span className="fa fa-twitter displayNone"></span>
                    <span className="fa fa-facebook displayNone"></span>
                    <span className="fa fa-google-plus displayNone"></span>
                    <div className="contentSubHeader">
                        <a href={this.props.url} target="_blank">
                            <span className="date">
                                {this.props.author}
                                {this.props.author && articleDate ? '\u00A0 \u00b7 \u00A0 ': ''}
                                {articleDate}
                            </span>
                            <span className="fa fa-external-link"></span>
                        </a>
                    </div>
                    <div className="fontSizeContainer">
                        <span className="fa fa-minus" onClick={this.zoomContent.bind(this, -1)}></span>
                        <span className="fa fa-font" onClick={this.zoomContent.bind(this, 0)}></span>
                        <span className="fa fa-plus" onClick={this.zoomContent.bind(this, 1)}></span>
                    </div>
                </section>
                <section className={contentSectionClasses} style={zoomStyle} dangerouslySetInnerHTML={{__html: this.props.content}} />
            </div>
        )
    }
});

var Article = React.createClass({
    getInitialState: function() {
        return {
            isOpen: false,
            wasOpenedThisSession: false,
            zoomLevel: 0
        }
    },

    openArticle: function() {
        this.setState({
            isOpen: true,
            wasOpenedThisSession: true
        });

        AppUtils.scrollTo($(this.getDOMNode()).offset().top + 70, 300);

        this.props.toggleArticleOpen.apply(this, [this.props.article.id, this.props.componentCounter]);

    },

    zoomContent: function(out) {
        var zoomLevel = out === 0 ? 0: this.state.zoomLevel + out;

        this.setState( {
            zoomLevel: zoomLevel
        });
    },

    toggleArticleOpen: function() {
        if (!this.state.isOpen) {
            this.openArticle();
            //this.setState({
            //    wasOpenedThisSession: true
            //});
        } else {
            this.setState({
                isOpen: !this.state.isOpen
            });

            this.props.toggleArticleOpen.apply(this, [this.props.article.id, this.props.componentCounter]);
        }
    },

    toggleArticleStar: function() {
        this.props.toggleArticleStar.apply(this, [this.props.article.id, this.props.componentCounter]);
    },

    goToNextArticle: function(value) {
        this.props.goToNextArticleMain.apply(this, [value, this.props.componentCounter]);
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        //return nextProps.current !== this.state.count
        return true;
        return (
                    (nextProps.componentCounter === nextProps.currentActive) ||
                    (nextProps.showRead !== this.props.showRead)  ||
                    (nextProps.isStar !== this.props.isStar)
                );
    },

    render: function() {
        //console.log('in Articles');

        var articleClasses = cx({
            "article": true,
            'unread': !this.props.isRead
        });

        if ((!this.state.wasOpenedThisSession) && ((!this.state.isOpen) && (this.props.isRead) && (!this.props.showRead))) {
            return (<div />)
        }

        return(
            <li className={articleClasses}>
                <section className="header">
                    <ArticleHeader
                        isRead={this.props.isRead} isStar={this.props.isStar}
                        toggleArticleStar={this.toggleArticleStar} toggleArticleOpen={this.toggleArticleOpen}
                        title={this.props.article.title}
                        url={this.props.article.link}
                        date={this.props.article.published}
                        author={this.props.article.author}/>

                    <ArticleContent
                        isOpen={this.state.isOpen}
                        isRead={this.props.isRead}
                        isStar={this.props.isStar}
                        title={this.props.article.title}
                        url={this.props.article.link}
                        date={this.props.article.published}
                        author={this.props.article.author}
                        content={this.props.article.content}
                        goToNextArticle={this.goToNextArticle}
                        zoomContent={this.zoomContent}
                        zoomLevel={this.state.zoomLevel}
                        />
                </section>
            </li>
        )
    }
});

module.exports = Article;
