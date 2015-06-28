'use strict';

let React = require('react/addons');
let ReactRouter = require('react-router');
let classNames = require('classNames');

let PubSub = require('pubsub-js');

let AppUtils = require('./../AppUtils.js');
let AppMessages = require('./../AppMessages.js');

let MarkReadSetting = React.createClass({

    markAsReadClick: function(e) {
        if ((this.props.view.length === 1) && (this.props.view[0].name === 'root')) { //root
            AppUtils.markAllFoldersAsRead();
        } else if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) { //folder
            AppUtils.markFolderAsRead(this.props.view[0].name);
        } else {
            AppUtils.markFeedAsRead(this.props.view[0].name, this.props.view[1].name);
        }

        this.props.hideSettings.call();
    },


    render: function() {
        return (
            <li className='setting markReadSetting'>
                <div className='settingTypeContainer'>
                    <span className='settingType'>mark as read: </span>
                </div>

                <a className='markReadOption' onClick={this.markAsReadClick}>all</a>
            </li>
        );
    }

});

let HeaderSetting = React.createClass({

    render: function() {
        var title = this.props.title;
        if (this.props.view.length === 2) {
            title = this.props.view[this.props.view.length - 1].name;
            title = decodeURIComponent(title);
        }

        return (
            <li className='settingHeader'>
                <input className='settingsTitle' readOnly value={title}></input>
                <span className='fa fa-check'></span>
            </li>
        );
    }

});

let ShowHideSetting = React.createClass({

    showHideClick: function (e) {
        let showRead = e.target.classList.contains('showAll');

        if ((this.props.view.length === 1) && (this.props.view[0].name === 'root')) { //root
            this.props.userSettings.showRead = showRead;
        } else if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) { //folder
            if (typeof this.props.userSettings[this.props.view[0].name] === 'undefined') {
                this.props.userSettings[this.props.view[0].name] = {};
            }

            this.props.userSettings[this.props.view[0].name].showRead = showRead;
        } else { //feed
            if (typeof this.props.userSettings[this.props.view[0].name] === 'undefined') {
                this.props.userSettings[this.props.view[0].name] = {};
            }

            if (typeof this.props.userSettings[this.props.view[0].name][this.props.view[1].name] === 'undefined') {
                this.props.userSettings[this.props.view[0].name][this.props.view[1].name] = {};
            }

            this.props.userSettings[this.props.view[0].name][this.props.view[1].name].showRead = showRead;
        }

        this.props.saveSettings(this.props.userSettings);
        PubSub.publish(AppMessages.SHOWREAD_CHANGE, {
            'showRead': showRead,
            'view': this.props.view
        });

        this.props.hideSettings.call();
    },

    resolveShowRead: function () {

        let showAll;

        if ((this.props.view.length === 1) && (this.props.view[0].name === 'root')) { //root
            showAll =
                (typeof this.props.userSettings.showRead !== 'undefined') ? this.props.userSettings.showRead : true;
        } else if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) { //folder
            showAll =
                this.props.userSettings[this.props.view[0].name] &&
                (typeof this.props.userSettings[this.props.view[0].name].showRead !== 'undefined') ? this.props.userSettings[this.props.view[0].name].showRead : true;
        } else { //feed
            showAll =
                this.props.userSettings[this.props.view[0].name] &&
                this.props.userSettings[this.props.view[0].name][this.props.view[1].name] &&
                    (typeof this.props.userSettings[this.props.view[0].name][this.props.view[1].name].showRead !== 'undefined') ? this.props.userSettings[this.props.view[0].name][this.props.view[1].name].showRead : true;
        }
        return showAll;
    },

    render: function () {
        let showRead = this.resolveShowRead();

        let showHideFirstClasses = classNames({
            'showHideOption': true,
            'showAll': true,
            'first': true,
            'selected': showRead
        });

        let showHideSecondClasses = classNames({
            'showHideOption': true,
            'showUnreadOnly': true,
            'second': true,
            'selected': !showRead
        });

        return (
                <li className='setting visibilitySetting'>
                    <div className='settingTypeContainer'>
                        <span className='settingType'>show: </span>
                    </div>

                    <a className={showHideFirstClasses} onClick={this.showHideClick}></a>
                    <a className={showHideSecondClasses} onClick={this.showHideClick}></a>
                </li>
        );
    }
});

let NightModeSetting = React.createClass({

    nightModeClick: function(e) {
        PubSub.publish(AppMessages.NIGHT_MODE_CHANGE, e.target.classList.contains('dayMode'));
        this.props.hideSettings.call();
    },

    render: function() {
        // nigthmode
        let nightmodeFirstClasses = classNames({
            'nightmodeOption': true,
            'dayMode': true,
            'nightMode': false,
            'selected': this.props.nightmode === 1
        });
        let nightmodeSecondClasses = classNames({
            'nightmodeOption': true,
            'dayMode': false,
            'nightMode': true,
            'selected': this.props.nightmode === 2
        });

        return (
            <li className='setting nightmodeSetting'>
                <div className='settingTypeContainer'>
                    <span className='settingType'>night mode: </span>
                </div>

                <a className={nightmodeFirstClasses} onClick={this.nightModeClick}>off</a>
                <a className={nightmodeSecondClasses} onClick={this.nightModeClick}>on</a>
            </li>
        );
    }
});

let ChangeFolderSetting = React.createClass({

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

    folderChange:function(e) {
        //confirm
        let fromFolder = this.props.view[0].name;
        let toFolder = e.target.value;
        let feed = this.props.view[1].name;

        AppUtils.changeFeedFolder(fromFolder, toFolder, feed);
    },

    componentDidMount: function() {
        this.feedFolderChanged = PubSub.subscribe(AppMessages.FEED_FOLDER_CHANGED, function( msg, data ) {
            let url = '/' + encodeURIComponent(data.toFolder) + '/' + encodeURIComponent(data.feed);
            this.context.router.transitionTo(url);
            this.props.hideSettings.call();
        }.bind(this));
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.feedFolderChanged );
    },

    render: function() {

        if (this.props.view.length < 2) {
            return (<div />);
        }

        let foldersList2 = Object.keys(this.props.bloglist).map(function(folder, index) {
            return (
                <option key={folder} value={folder}>
                    {folder}
                </option>
            );
        });

        return (
            <li className='setting changeFolderSetting'>
                <div className='settingTypeContainer'>
                    <span className='settingType'>change folder:</span>
                </div>

                <select onChange={this.folderChange} value={this.props.view[0].name} >
                    {foldersList2}
                </select>
            </li>
        );
    }
});

let AddFeedSetting = React.createClass({
    getInitialState: function() {
        return {
            view: 1,
            opmlFileName: '',
            uploadUrl: document.body.attributes['data-uploadurl'].value
            };
    },

    handleOPMLChange: function(e) {

        let fileName = this.refs.opmlInput.getDOMNode().value;
        fileName = fileName.match(/[^\/\\]+$/);

        if (fileName.length > 0) {
            this.setState({
                opmlFileName: fileName[0]
            });
        }
    },

    formSubmitClick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.refs.opmlForm.getDOMNode().submit();

        //return false;
    },

    setView: function(view) {
        this.setState({
            view: view
        });
    },

    addFeed: function(e) {
        let folder = this.props.view[0].name;
        AppUtils.addNewFeed(folder, this.refs.newFeed.getDOMNode().value);
    },

    addFolder: function(e) {
        AppUtils.addNewFolder(this.refs.newFolder.getDOMNode().value);
    },

    render: function() {
        let addFeedClasses = classNames({
            'displayNone': this.state.view !== 1
        });

        let addFolderClasses = classNames({
            'displayNone': this.state.view !== 2
        });

        let addOPMLClasses = classNames({
            'omplImportForm': true,
            'displayNone': this.state.view !== 3
        });

        let addFeedClassesNav = classNames({
            'inputType': true,
            'selected': this.state.view === 1
        });

        let addFolderClassesNav = classNames({
            'inputType': true,
            'middle': true,
            'selected': this.state.view === 2
        });

        let addOPMLClassesNav = classNames({
            'inputType': true,
            'selected': this.state.view === 3
        });

        let submitOPMLButtonClasses = classNames({
            'fa': true,
            'fa-check': true,
            'addOpml': true
        });

        let opmlInputControlsDisplay = {
            'display': ((this.state.view === 3) && (this.state.opmlFileName !== '')) ? 'inline' : 'none'
        };

        return (
            <li className='setting addFeedSetting'>
                <div className='settingTypeContainer'>
                    <span className={addFeedClassesNav} onClick={this.setView.bind(this, 1)}>add feed</span>
                    <span className={addFolderClassesNav} onClick={this.setView.bind(this, 2)}>add folder</span>
                    <span className={addOPMLClassesNav} onClick={this.setView.bind(this, 3)}>ompl</span>
                </div>

                <div className={addFeedClasses}>
                    <input type='text' className='feedUrl' placeholder='Add Feed' ref='newFeed' />
                    <span className='fa fa-check addFeedUrl' onClick={this.addFeed}></span>
                </div>

                <div className={addFolderClasses}>
                    <input type='text' className='folderName' placeholder='Add Folder' ref='newFolder'/>
                    <span className='fa fa-check addFolder' onClick={this.addFolder}></span>
                </div>

                <form action={this.state.uploadUrl} ref='opmlForm' method='POST' encType='multipart/form-data' className={addOPMLClasses}>
                    <input type='file' name='file' className='opmlFile' ref='opmlInput' onChange={this.handleOPMLChange} placeholder='Upload OPML file' />
                    <span className='opmlFilePath' style={opmlInputControlsDisplay}>{this.state.opmlFileName}</span>
                    <span className={submitOPMLButtonClasses} style={opmlInputControlsDisplay} onClick={this.formSubmitClick}></span>
                </form>
            </li>
        );
    }
});

let DeleteFolderSettings = React.createClass( {

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },



    deleteClick: function() {
        if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) {
            AppUtils.deleteFolder(this.props.view[0].name);
            this.context.router.transitionTo('/');
        } else {
            AppUtils.unsubscribeFeed(this.props.view[0].name, this.props.view[1].name);
            this.context.router.transitionTo('/' + decodeURIComponent(this.props.view[0].name ));
        }

        this.props.hideSettings.call();
    },

    render: function() {
        let caption;
        if ((this.props.view.length === 1) && (this.props.view[0].name === 'root')) { //root
            return (<div></div>);
        } else if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) {
            caption = 'delete folder';
        } else {
            caption = 'unsubscribe';
        }

        return (
            <li className='setting deleteFolder'>
                <a className='feedUnsubscribe' onClick={this.deleteClick}>
                    <span className='fa fa-times'></span> {caption}
                </a>
            </li>
         );
    }

});

let AppSettings = React.createClass({

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            userSettings: this.props.userSettings
        };
    },

    hideSettings: function () {
        this.props.hideSettings.call();
    },

    saveAndCloseSettings: function () {
        //todo and pass around
    },

    componentWillMount: function() {
        this.newFolderAdded = PubSub.subscribe(AppMessages.NEW_FOLDER_ADDED, function( msg, data ) {
            this.context.router.transitionTo('/' + data);
            this.hideSettings();
        }.bind(this));

        this.newFeedAdded = PubSub.subscribe(AppMessages.NEW_FEED_ADDED, function( msg, data ) {
            let url = '/' + encodeURIComponent(data.folder) + '/' + encodeURIComponent(data.feed) + '?new=1';
            this.context.router.transitionTo(url);
            this.hideSettings();
        }.bind(this));
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.newFolderAdded );
        PubSub.unsubscribe( this.newFeedAdded );
    },

    componentDidUpdate: function(prevProps, prevState) {
        //Velocity(this.getDOMNode(), 'callout.settings8');
    },

    getView: function() {
        let view, title;
        let urlParams = this.context.router.getCurrentParams();

        if (urlParams.feedUrl) {
            title = AppUtils.getFeedTitle(
                this.context.router.getCurrentParams().folderName,
                this.context.router.getCurrentParams().feedUrl
            );

            view = [{
                name: urlParams.folderName
            }, {
                name: urlParams.feedUrl
            }];
        } else if (urlParams.folderName) {
            title = urlParams.folderName;
            view = [{
                name: urlParams.folderName
            }];
        } else {
            title = '';
            view = [{
                name: 'root'
            }];
        }

        return {
            view: view,
            title: title
        };
    },

    render: function() {
        if (!this.props.visible) {
            return (<div />);
        }

        let styles = {
            display: this.props.visible ? 'block' : 'none'
        };

        let view = this.getView();
        let settings;
        if (this.props.settingsType === 1) {
            settings = <div>
                    <MarkReadSetting
                        view={view.view} hideSettings={this.props.hideSettings} />

                    <ShowHideSetting
                        view={view.view} userSettings={this.props.userSettings} saveSettings={this.props.saveSettings} hideSettings={this.props.hideSettings} />

                    <NightModeSetting
                        nightmode={this.props.userSettings.nightmode} hideSettings={this.props.hideSettings} />
                </div>;
        } else {
            settings = <div>
                    <ChangeFolderSetting
                        view={view.view} bloglist={this.props.bloglist} hideSettings={this.props.hideSettings} />

                    <AddFeedSetting
                        view={view.view} />

                    <DeleteFolderSettings
                        view={view.view} hideSettings={this.props.hideSettings} />
                </div>;
        }

        return (
            <ul className='feedSettings' style={styles}>
                <li className='setting closeButton'>
                    <a className='close' onClick={this.hideSettings}>
                        <span>CLOSE</span>
                        <span className='fa fa-times'></span>
                    </a>
                </li>

                <HeaderSetting title={view.title} view={view.view}/>

                {settings}
            </ul>
        );
    }
});

module.exports = AppSettings;
