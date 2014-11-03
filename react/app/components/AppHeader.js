/** @jsx React.DOM */
var React = require('react');

var AppHeader = React.createClass({
    settingsClick: function() {
        this.props.showSettings.call();
    },

    render: function() {
        return (
            <header>
                <a className="feedSettingsAction">
                    <span className="fa fa-bars" onClick={this.settingsClick}></span>
                </a>
                <span className="headerCaption">&nbsp;</span>
                <a className="up"><span className="fa fa-home"></span></a>
            </header>
        );
    }
});

module.exports = AppHeader;
