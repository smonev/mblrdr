var React = require('react');
var Navigation = require('react-router').Navigation;
var ReactRouter = require('react-router');
var cx = React.addons.classSet;

var AppHeader = React.createClass({
    mixins: [Navigation, ReactRouter.State],

    settingsClick: function() {
        this.props.showSettings.call();
    },

    onUpClick: function() {
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

    render: function() {
        var homeIconClassName = cx({
            'fa': true,
            'fa-home': !this.getParams().folderName,
            'fa-long-arrow-left': this.getParams().folderName
        });

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
                <span className="headerCaption">{title}</span>
                <a className="up" onClick={this.onUpClick}><span className={homeIconClassName}></span></a>
                <br />
            </header>
        );
    }
});

module.exports = AppHeader;
