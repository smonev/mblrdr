'use strict';

let React = require('react');
let ReactRouter = require('react-router');
let Navigation = ReactRouter.Navigation;
let Headroom = require('react-headroom');
let classNames = require('classNames');

class AppHeader extends React.Component {

    constructor(props, context) {
        super(props);
        this.context = context;
        this.state = {
            title: ''
        };
    }

    settingsClick() {
        this.props.showSettings.call();
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
            title = this.props.title;
        } else if (currentParams.folderName) {
            title = currentParams.folderName;
        } else {
            title = 'Home';
        }

        return (
            <Headroom>
                <a className='feedSettingsAction'>
                    <span className='fa fa-bars' onClick={this.settingsClick.bind(this)}></span>
                </a>

                <span className={headerCaptionClassname} onClick={this.onUpClick.bind(this)}>{title}</span>

                <a className={homeIconClassName} onClick={this.onUpClick.bind(this)}></a>
            </Headroom>
        );
    }
}

AppHeader.contextTypes = {
  router: React.PropTypes.func
};

module.exports = AppHeader;
