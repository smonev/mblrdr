'use strict';

var React = require('react');

var classNames = require('classNames');
var ReactIntl = require('react-intl');
var IntlMixin = ReactIntl.IntlMixin;
var FormattedMessage = ReactIntl.FormattedMessage;
var FormattedRelative = ReactIntl.FormattedRelative;


var hammer = require('hammerjs');
window.Hammer = hammer;

var AppUtils = require('../AppUtils');

var ArticleHeader = React.createClass({
    props: {
        isRead: React.PropTypes.bool.isRequired,
        toggleArticleStar: React.PropTypes.func.isRequired,
        title: React.PropTypes.string.isRequired,
        url: React.PropTypes.string.isRequired,
        date: React.PropTypes.string.isRequired,
        author: React.PropTypes.string.isRequired
    },

    mixins: [IntlMixin],

    componentDidMount: function() {
        Velocity(this.getDOMNode(), 'callout.pulseDown');
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
        var starClass = classNames({
            'fa': true,
            'fa-star': this.props.isStar,
            'fa-star-o': !this.props.isStar
        });

        return (
            <div>
                <a href={this.props.url} target='_blank' className='headerAuthorAndDate'>
                    {this.props.author}
                    {this.props.author && this.props.date ? '\u00A0 \u00b7 \u00A0 ' : ''}
                    <FormattedRelative value={this.props.date} />

                </a>

                <div className='bla'>
                    <a className='star' onClick={this.toggleArticleStar}>
                        <span className={starClass}></span>
                    </a>

                    <a onClick={this.toggleArticleOpen} href={this.props.url} className='title'>{this.props.title}</a>
                </div>
            </div>
        );
    }
});

var ArticleContent = React.createClass({

    props: {
        isOpen: React.PropTypes.bool.isRequired,
        isRead: React.PropTypes.bool.isRequired,
        isStar: React.PropTypes.bool.isRequired,
        title: React.PropTypes.string.isRequired,
        url: React.PropTypes.string.isRequired,
        date: React.PropTypes.string.isRequired,
        author: React.PropTypes.string.isRequired,
        content: React.PropTypes.string.isRequired,
        goToNextArticle: React.PropTypes.func.isRequired,
        zoomContent: React.PropTypes.func.isRequired,
        zoomLevel: React.PropTypes.number.isRequired
    },

    mixins: [IntlMixin],

    getInitialState: function() {
        return {
            initialZoom: {}
        };
    },

    componentDidMount: function() {
        this.setState({
            initialZoom: this.getCurrentZoomFromWindow()
        });

        // swiping is not that functional
        // this.hammertime = new Hammer( this.getDOMNode() );
        // this.hammertime.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL }));
        // this.hammertime.on('panend', this.panend);
    },

    componentWillUnmount: function() {
        // if (this.hammertime) {
        //     this.hammertime.destroy();
        // }
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
        };
    },

    render: function() {
        var mainSectionClasses = classNames({
            'contentHeader': true,
            'displayNone': !this.props.isOpen
        });

        var contentSectionClasses = classNames({
            'content': true,
            'displayNone': !this.props.isOpen
        });

        var zoomStyle = {
            fontSize: this.state.initialZoom.fontSize + (this.props.zoomLevel * 3) + 'px',
            lineHeight: this.state.initialZoom.lineHeight  + (this.props.zoomLevel * 3) + 'px'
        };

        return (
            <div>
                <section className={mainSectionClasses}>
                    <span className='title'>{this.props.title}</span>
                    <span className='fa fa-angle-double-right' onClick={this.goToNextArticle}></span>
                    <span className='fa fa-angle-double-left' onClick={this.goToPrevArticle}></span>
                    <span className='fa fa-angle-double-up displayNone'></span>
                    <span className='fa fa-share displayNone'></span>
                    <span className='fa fa-twitter displayNone'></span>
                    <span className='fa fa-facebook displayNone'></span>
                    <span className='fa fa-google-plus displayNone'></span>
                    <div className='contentSubHeader'>
                        <a href={this.props.url} target='_blank'>
                            <span className='date'>
                                {this.props.author}
                                {this.props.author && this.props.date ? '\u00A0 \u00b7 \u00A0 ' : ''}
                                <FormattedRelative value={this.props.date} />
                            </span>
                            <span className='fa fa-external-link'></span>
                        </a>
                    </div>
                    <div className='fontSizeContainer'>
                        <span className='fa fa-minus' onClick={this.zoomContent.bind(this, -1)}></span>
                        <span className='fa fa-font' onClick={this.zoomContent.bind(this, 0)}></span>
                        <span className='fa fa-plus' onClick={this.zoomContent.bind(this, 1)}></span>
                    </div>
                </section>
                <section className={contentSectionClasses} style={zoomStyle} dangerouslySetInnerHTML={{__html: this.props.content}} />
            </div>
        );
    }
});

var Article = React.createClass({

    mixins: [IntlMixin],

    props: {
        showRead: React.PropTypes.bool.isRequired,
        componentCounter: React.PropTypes.number.isRequired,
        currentActive: React.PropTypes.number.isRequired,
        article: React.PropTypes.object.isRequired,
        isRead: React.PropTypes.bool.isRequired,
        isStar: React.PropTypes.bool.isRequired,
        toggleArticleStar: React.PropTypes.func.isRequired,
        toggleArticleOpen: React.PropTypes.func.isRequired,
        goToNextArticleMain: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            isOpen: false,
            wasOpenedThisSession: false,
            zoomLevel: 0
        };
    },

    openArticle: function() {
        this.setState({
            isOpen: true,
            wasOpenedThisSession: true
        });

        AppUtils.scrollTo($(this.getDOMNode()).offset().top + 78, 300);

        this.props.toggleArticleOpen.apply(this, [this.props.article.id, this.props.componentCounter]);
    },

    zoomContent: function(out) {
        var zoomLevel = out === 0 ? 0 : this.state.zoomLevel + out;

        this.setState( {
            zoomLevel: zoomLevel
        });
    },

    toggleArticleOpen: function() {
        if (!this.state.isOpen) {
            this.openArticle();
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

    render: function() {
        var articleClasses = classNames({
            'article': true,
            'unread': !this.props.isRead,
            'articleOpen': this.state.isOpen,
            'articleActive': this.state.isOpen

        });

        if ((!this.state.wasOpenedThisSession) && ((!this.state.isOpen) && (this.props.isRead) && (!this.props.showRead))) {
            return (<div />);
        }

        return (

            <li className={articleClasses}>
                <section className='header'>


                    <ArticleHeader
                        isRead={this.props.isRead} isStar={this.props.isStar}
                        toggleArticleStar={this.toggleArticleStar} toggleArticleOpen={this.toggleArticleOpen}
                        title={this.props.article.title}
                        url={this.props.article.link}
                        date={this.props.article.published}
                        author={this.props.article.author} />

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
        );
    }
});

module.exports = Article;
