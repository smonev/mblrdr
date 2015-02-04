var React = require('react');
var Navigation = require('react-router').Navigation;
var ReactRouter = require('react-router');
var cx = React.addons.classSet;

var AppHeader = React.createClass({
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
        //Velocity(this.upButton, "callout.pulseSide");

        if (this.getParams().feedUrl) {
            if (this.getParams().folderName !== 'root') {
                this.transitionTo(decodeURIComponent('/' + this.getParams().folderName));
            } else {
                this.transitionTo('/');
            }

        } else if (this.getParams().folderName) {
            this.transitionTo('/');
        };
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

        title = '';

        if (this.getParams().feedUrl) {
            title = this.props.title;
        } else if (this.getParams().folderName) {
            title = this.getParams().folderName
        } else {
            title = 'Home';
        }

        return (
            <header>
                <a className="feedSettingsAction">
                    <span className="fa fa-bars" onClick={this.settingsClick}></span>
                </a>

                <a className="up" onClick={this.onUpClick}>
                    <span className={homeIconClassName}></span>
                    <span className="headerCaption">{title}</span>
                </a>
            </header>
        );
    }
});

module.exports = AppHeader;