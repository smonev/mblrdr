'use strict';

let React = require('react');
let ReactRouter = require('react-router');
let Navigation = ReactRouter.Navigation;
let Headroom = require('react-headroom');
let classNames = require('classNames');

let AppHeader = React.createClass({

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            title: ''
        };
    },

    settingsClick: function() {
        this.props.showSettings.call();
    },

    onUpClick: function() {
        if (this.context.router.getCurrentParams().feedUrl) {
            if (this.context.router.getCurrentParams().folderName !== 'root') {
                this.context.router.transitionTo(decodeURIComponent('/' + this.context.router.getCurrentParams().folderName));
            } else {
                this.context.router.transitionTo('/');
            }
        } else if (this.context.router.getCurrentParams().folderName) {
            this.context.router.transitionTo('/');
        }
    },

    render: function() {
        let routerParams = this.context.router.getCurrentParams();

        let homeIconClassName = classNames({
            'fa': true,
            'fa-home': false, //!routerParams.folderName,
            'fa-long-arrow-left': routerParams.folderName
        });

        let headerCaptionClassname = classNames({
            'headerCaption': true,
            'home': !routerParams.folderName
        });

        let title = '';

        if (routerParams.feedUrl) {
            title = this.props.title;
        } else if (routerParams.folderName) {
            title = routerParams.folderName;
        } else {
            title = 'Home';
        }

        return (
            <Headroom>
                <a className='feedSettingsAction'>
                    <span className='fa fa-bars' onClick={this.settingsClick}></span>
                </a>

                <span className={headerCaptionClassname} onClick={this.onUpClick}>{title}</span>

                <a className={homeIconClassName} onClick={this.onUpClick}></a>
            </Headroom>

        );
    }
});

module.exports = AppHeader;
