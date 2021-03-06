'use strict';

let React = require('react');

let classNames = require('classNames');

let ReactIntl;
let FormattedRelative;

try {
    ReactIntl = require('react-intl');
    FormattedRelative = ReactIntl.FormattedRelative;
} catch (err) {
    // react-intl does not support some mobile borowsers
    FormattedRelative = React.createClass({
        render: function() {
            return (
                <span>
                    {this.props.value}
                </span>
            );
        }
    });
}

//let hammer = require('hammerjs');
//window.Hammer = hammer;

let AppUtils = require('../AppUtils');

let ArticleHeader = React.createClass({
    props: {
        isRead: React.PropTypes.bool.isRequired,
        toggleArticleStar: React.PropTypes.func.isRequired,
        title: React.PropTypes.string.isRequired,
        url: React.PropTypes.string.isRequired,
        date: React.PropTypes.string.isRequired,
        author: React.PropTypes.string.isRequired
    },

    componentDidMount: function() {
        //Velocity(this.getDOMNode(), 'callout.pulseDown');
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
        let starClass = classNames({
            'fa': true,
            'fa-star': this.props.isStar,
            'fa-star-o': !this.props.isStar
        });

        return (
            <div className='articleHeader'>
                <a href={this.props.url} target='_blank' className='headerAuthorAndDate'>
                    {this.props.author}
                    {this.props.author && this.props.date ? '\u00A0 \u00b7 \u00A0 ' : ''}
                    <FormattedRelative value={this.props.date} />

                </a>

                <div>
                    <a className='star' onClick={this.toggleArticleStar}>
                        <span className={starClass}></span>
                    </a>

                    <a onClick={this.toggleArticleOpen} href={this.props.url} className='title'>{this.props.title}</a>
                </div>
            </div>
        );
    }
});

let ArticleContent = React.createClass({

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

        this.initializeImageZoom();
    },

    componentWillUnmount: function() {
        // if (this.hammertime) {
        //     this.hammertime.destroy();
        // }

        this.removeZoomEvents();
    },

    componentDidUpdate: function(prevProps, prevState) {
        //this.initializeImageZoom();
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

    clickOnZoomableImage: function(e) {
        e.preventDefault();

        let img = e.target;

        if (img.classList.contains('fullScreenImage') ) {
            img.classList.remove('fullScreenImage');

            $(img).velocity(
                {scale:1},
                {
                    duration: 200
                });

            img.classList.add('zooInImage');
            img.classList.remove('zooOutImage');
        } else {
            img.classList.add('fullScreenImage');

            //let scalePercent = window.innerWidth / ($(img).width() + 100);
            let scalePercent = window.innerWidth / ($(img).width());
            scalePercent = scalePercent * 0.95; //5% padding, change it in css too if changed here
            $(img).velocity(
                {scale: scalePercent},
                {
                    duration: 200
                });

            img.classList.remove('zooInImage');
            img.classList.add('zooOutImage');
        }
        return false;
    },

    initializeImageZoom: function () {
        $(this.getDOMNode()).find('img').map(function(i, img) {
            if (img.naturalWidth > 800) {

                img.classList.add('zooInImage');
                img.classList.remove('zooOutImage');

                img.addEventListener('click', this.clickOnZoomableImage);
            }
        });
    },

    removeZoomEvents: function() {
        $(this.getDOMNode()).find('img').map(function(i, img) {
            img.removeEventListener('click', this.clickOnZoomableImage);
        });
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
        let fontSize = parseInt(window.getComputedStyle(this.getDOMNode().querySelectorAll('.content')[0], null).getPropertyValue('font-size'));
        let lineHeight = parseInt(window.getComputedStyle(this.getDOMNode().querySelectorAll('.content')[0], null).getPropertyValue('line-height'));

        return {
            fontSize: fontSize,
            lineHeight: lineHeight
        };
    },

    render: function() {
        let mainSectionClasses = classNames({
            'contentHeader': true,
            'displayNone': !this.props.isOpen
        });

        let contentSectionClasses = classNames({
            'content': true,
            'displayNone': !this.props.isOpen
        });

        let zoomStyle = {
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

let Article = React.createClass({
    //mixins: [React.addons.PureRenderMixin],

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

        let el = $(this.getDOMNode());
        let pos = el.find('.articleHeader').offset().top + el.find('.articleHeader').height();
        AppUtils.scrollTo(pos, 300);

        this.props.toggleArticleOpen.apply(this, [this.props.article.id, this.props.componentCounter]);
    },

    zoomContent: function(out) {
        let zoomLevel = out === 0 ? 0 : this.state.zoomLevel + out;

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
        let articleClasses = classNames({
            'article': true,
            'unreadArticle': !this.props.isRead,
            'articleOpen': this.state.isOpen,
            'articleActive': this.state.isOpen

        });

        if (
                (!this.state.wasOpenedThisSession) &&
                (!this.props.wasOpenedThisSession) &&
                ((!this.state.isOpen) && (this.props.isRead) && (!this.props.showRead))
            ) {
            return false;
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
