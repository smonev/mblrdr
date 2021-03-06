'use strict';

let React = require('react');
let ReactRouter = require('react-router');
let Navigation = ReactRouter.Navigation;

let classNames = require('classNames');
let PubSub = require('pubsub-js');

let AppMessages = require('./../AppMessages.js');

class AppHeader extends React.Component {

    // some es6 testing
    constructor(props, context) {
        super(props);
        this.context = context;
        this.state = {
            title: ' '
        };

        this.titleChangeEvent = PubSub.subscribe(AppMessages.TITLE_CHANGE_EVENT, function( msg, title ) {
            this.setState({
                title: title
            });
        }.bind(this));
    }

    destructor() {
        PubSub.unsubscribe( this.titleChangeEvent );
    }

    settingsClick(settingsType) {
        this.props.showSettings.call(this, settingsType);
    }

    onUpClick() {
        let currentParams = this.context.router.getCurrentParams();

        if (currentParams.feedUrl) {
            if (currentParams.folderName !== 'root') {
                this.context.router.transitionTo(decodeURIComponent('/' + this.context.router.getCurrentParams().folderName));
            } else {
                this.context.router.transitionTo('/');
            }
        } else if (currentParams.folderName) {
            this.context.router.transitionTo('/');
        }
    }

    render() {
        let currentParams = this.context.router.getCurrentParams();

        let homeIconClassName = classNames({
            'fa': true,
            'fa-home': false, //!currentParams.folderName,
            'fa-long-arrow-left': currentParams.folderName
        });

        let headerCaptionClassname = classNames({
            'headerCaption': true,
            'home': !currentParams.folderName
        });

        let title = '';
        if (currentParams.feedUrl) {
            title = this.props.title ? this.props.title : this.state.title;
        } else if (currentParams.folderName) {
            title = currentParams.folderName;
        } else {
            title = 'Home';
        }

        if (title === '') {
            title = String.fromCharCode(183);
        }

        return (
            <div className="headerWrapper">
                <a className='feedSettingsAction'>
                    <span className='fa fa-bars' onClick={this.settingsClick.bind(this, 1)}></span>
                </a>
                <a className='feedSettingsAction'>
                    <span className='fa fa-plus' onClick={this.settingsClick.bind(this, 2)}></span>
                </a>

                <span className={headerCaptionClassname} onClick={this.onUpClick.bind(this)}>{title}</span>

                <a className={homeIconClassName} onClick={this.onUpClick.bind(this)}></a>
            </div>
        );
    }
}

AppHeader.contextTypes = {
    router: React.PropTypes.func
};

module.exports = AppHeader;
