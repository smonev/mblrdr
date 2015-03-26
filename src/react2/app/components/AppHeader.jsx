'use strict';

var React = require('react');
var ReactRouter = require('react-router');
var Navigation = ReactRouter.Navigation;
var Headroom = require('react-headroom');
var classNames = require('classNames');

var AppHeader = React.createClass({

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
        var homeIconClassName = classNames({
            'fa': true,
            'fa-home': !this.context.router.getCurrentParams().folderName,
            'fa-long-arrow-left': this.context.router.getCurrentParams().folderName
        });

        var title = '';

        if (this.context.router.getCurrentParams().feedUrl) {
            title = this.props.title;
        } else if (this.context.router.getCurrentParams().folderName) {
            title = this.context.router.getCurrentParams().folderName;
        } else {
            title = 'Home';
        }

        return (

            <Headroom>
                <a className='feedSettingsAction'>
                    <span className='fa fa-bars' onClick={this.settingsClick}></span>
                </a>

                <span className='headerCaption' onClick={this.onUpClick}>{title}</span>

                <a className={homeIconClassName} onClick={this.onUpClick}></a>
            </Headroom>

        );
    }
});

module.exports = AppHeader;
