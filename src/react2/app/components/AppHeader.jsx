'use strict';

var React = require('react');
var ReactRouter = require('react-router');
var Navigation = ReactRouter.Navigation;

var cx = React.addons.classSet;

var AppHeader = React.createClass({
    propTypes: {
        showSettings: React.PropTypes.func.isRequired
    },

    mixins: [Navigation, ReactRouter.State],


    getInitialState: function() {
        return {
            title: ''
        };
    },

    settingsClick: function() {
        this.props.showSettings.call();
    },

    onUpClick: function() {
        //Velocity(this.upButton, 'callout.pulseSide');

        if (this.getParams().feedUrl) {
            if (this.getParams().folderName !== 'root') {
                this.transitionTo(decodeURIComponent('/' + this.getParams().folderName));
            } else {
                this.transitionTo('/');
            }
        } else if (this.getParams().folderName) {
            this.transitionTo('/');
        }
    },

    componentDidMount: function() {
        this.upButton = document.querySelectorAll('.up')[0];
    },

    render: function() {
        var homeIconClassName = cx({
            'fa': true,
            'fa-home': !this.getParams().folderName,
            'fa-long-arrow-left': this.getParams().folderName
        });

        var title = '';

        if (this.getParams().feedUrl) {
            title = this.props.title;
        } else if (this.getParams().folderName) {
            title = this.getParams().folderName;
        } else {
            title = 'Home';
        }

        return (

            <header>
                <a className='feedSettingsAction'>
                    <span className='fa fa-bars' onClick={this.settingsClick}></span>
                </a>

                <span className='headerCaption' onClick={this.onUpClick}>{title}</span>

                <a className={homeIconClassName} onClick={this.onUpClick}></a>
            </header>

        );
    }
});

module.exports = AppHeader;
