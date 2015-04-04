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
            title: '',
            currentParams: context.router.getCurrentParams()
        };
    }

    settingsClick() {
        this.props.showSettings.call();
    }

    onUpClick() {
        if (this.state.currentParams.feedUrl) {
            if (this.state.currentParams.folderName !== 'root') {
                this.context.router.transitionTo(decodeURIComponent('/' + this.context.router.getCurrentParams().folderName));
            } else {
                this.context.router.transitionTo('/');
            }
        } else if (this.state.currentParams.folderName) {
            this.context.router.transitionTo('/');
        }
    }

    render() {
        let homeIconClassName = classNames({
            'fa': true,
            'fa-home': false, //!this.state.currentParams.folderName,
            'fa-long-arrow-left': this.state.currentParams.folderName
        });

        let headerCaptionClassname = classNames({
            'headerCaption': true,
            'home': !this.state.currentParams.folderName
        });

        let title = '';
        if (this.state.currentParams.feedUrl) {
            title = this.props.title;
        } else if (this.state.currentParams.folderName) {
            title = this.state.currentParams.folderName;
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
