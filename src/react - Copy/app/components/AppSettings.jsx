var React = require('react/addons');
var ReactRouter = require('react-router');
var EventEmitter = require('events').EventEmitter;
var cx = React.addons.classSet;
var PubSub = require('pubsub-js');
var AppUtils = require('./../AppUtils.js');

var MarkReadSetting = React.createClass({

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
            <li className="setting markReadSetting">
                <div className="settingTypeContainer">
                    <span className="settingType">mark as read: </span>
                </div>

                <a className="markReadOption" onClick={this.markAsReadClick}>all</a>
            </li>
        )
    }

});

var HeaderSetting = React.createClass({

    render: function() {
        return (
            <li className="settingHeader">
                <input className="settingsTitle" readOnly value={this.props.title}></input>
                <span className="fa fa-check"></span>
            </li>
        )
    }

});

var ShowHideSetting = React.createClass({

    showHideClick: function (e) {
        var showRead = e.target.classList.contains('showAll');

        if ((this.props.view.length === 1) && (this.props.view[0].name === 'root')) { //root
            this.props.userSettings.showRead = showRead;
        } else if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) { //folder
            if (typeof this.props.userSettings[this.props.view[0].name] === "undefined") {
                this.props.userSettings[this.props.view[0].name] = {};
            }

            this.props.userSettings[this.props.view[0].name].showRead = showRead;
        } else { //feed
            if (typeof this.props.userSettings[this.props.view[0].name] === "undefined") {
                this.props.userSettings[this.props.view[0].name] = {};
            }

            if (typeof this.props.userSettings[this.props.view[0].name][this.props.view[1].name] === "undefined") {
                this.props.userSettings[this.props.view[0].name][this.props.view[1].name] = {};
            }

            this.props.userSettings[this.props.view[0].name][this.props.view[1].name].showRead = showRead;
        }

        this.props.saveSettings(this.props.userSettings);
        PubSub.publish('SHOWREAD_CHANGE', {
            'showRead': showRead,
            'view': this.props.view
        });

        this.props.hideSettings.call();
    },

    resolveShowRead: function () {
        var showAll;

        if ((this.props.view.length === 1) && (this.props.view[0].name === 'root')) { //root
            showAll =
                (typeof this.props.userSettings.showRead !== "undefined") ? this.props.userSettings.showRead: true;
        } else if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) { //folder
            showAll =
                this.props.userSettings[this.props.view[0].name] &&
                (typeof this.props.userSettings[this.props.view[0].name].showRead !== "undefined") ? this.props.userSettings[this.props.view[0].name].showRead: true;
        } else { //feed
            showAll =
                this.props.userSettings[this.props.view[0].name] &&
                this.props.userSettings[this.props.view[0].name][this.props.view[1].name] &&
                (typeof this.props.userSettings[this.props.view[0].name][this.props.view[1].name].showRead !== "undefined") ? this.props.userSettings[this.props.view[0].name][this.props.view[1].name].showRead: true;
        }
        return showAll;
    },

    render: function () {
        var showRead = this.resolveShowRead();

        var showHideFirstClasses = cx({
            "showHideOption": true,
            'showAll': true,
            'first': true,
            'selected': showRead
        });

        var showHideSecondClasses = cx({
            "showHideOption": true,
            'showUnreadOnly': true,
            'second': true,
            'selected': !showRead
        });

        return (
                <li className="setting visibilitySetting">
                    <div className="settingTypeContainer">
                        <span className="settingType">show: </span>
                    </div>

                    <a className={showHideFirstClasses} onClick={this.showHideClick}></a>
                    <a className={showHideSecondClasses} onClick={this.showHideClick}></a>
                </li>
        )
    }
});

var NightModeSetting = React.createClass({

    nightModeClick: function(e) {
        PubSub.publish('NIGHT_MODE_CHANGE', e.target.classList.contains('dayMode'));
        this.props.hideSettings.call();
    },

    render: function() {
        // nigthmode
        var nightmodeFirstClasses = cx({
            'nightmodeOption': true,
            'dayMode': true,
            'nightMode': false,
            'selected': this.props.nightmode === 1
        });
        var nightmodeSecondClasses = cx({
            'nightmodeOption': true,
            'dayMode': false,
            'nightMode': true,
            'selected': this.props.nightmode === 2
        });

        return (
            <li className="setting nightmodeSetting">
                <div className="settingTypeContainer">
                    <span className="settingType">night mode: </span>
                </div>

                <a className={nightmodeFirstClasses} onClick={this.nightModeClick}>off</a>
                <a className={nightmodeSecondClasses} onClick={this.nightModeClick}>on</a>
            </li>
        )
    }
});

var ChangeFolderSetting = React.createClass({
    mixins: [ ReactRouter.State, ReactRouter.Navigation ],

    folderChange:function(e) {
        //confirm
        var fromFolder = this.props.view[0].name;
        var toFolder = e.target.value;
        var feed = this.props.view[1].name;

        AppUtils.changeFeedFolder(fromFolder, toFolder, feed);
    },

    componentDidMount: function() {
        this.feedFolderChanged = PubSub.subscribe('FEED_FOLDER_CHANGED', function( msg, data ) {
            var url = "/" + encodeURIComponent(data.toFolder) + '/' + encodeURIComponent(data.feed);
            this.transitionTo(url);
            this.props.hideSettings.call();
        }.bind(this));
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.feedFolderChanged );
    },

    render: function() {

        if (this.props.view.length < 2) {
            return (<div />)
        }

        var foldersList2 = Object.keys(this.props.bloglist).map(function(folder, index) {
            return (
                <option key={folder} value={folder}>
                    {folder}
                </option>
            );
        });

        return (
            <li className="setting changeFolderSetting">
                <div className="settingTypeContainer">
                    <span className="settingType">change folder:</span>
                </div>

                <select onChange={this.folderChange} value={this.props.view[0].name} >
                    {foldersList2}
                </select>
            </li>
        )
    }
});

var AddFeedSetting = React.createClass({
    getInitialState: function() {
        return {
            view: 1,
            opmlFileName: '',
            upload_url: document.body.attributes['data-uploadurl'].value
        }
    },

    handleOPMLChange: function(e) {
        //AppUtils.generateUploadUrlHandler(function(upload_url){
        //    upload_url = upload_url.replace('http://8.fdjsfkdsfhkjdshfkjsdhfkjsdhkj.appspot.com', 'http://mblrdr.com');
            //this.setState({
            //    upload_url: upload_url
            //});
        //}.bind(this));

        var fileName = this.refs.opmlInput.getDOMNode().value;
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
        var folder = this.props.view[0].name;
        AppUtils.addNewFeed(folder, this.refs.newFeed.getDOMNode().value);
    },

    addFolder: function(e) {
        AppUtils.addNewFolder(this.refs.newFolder.getDOMNode().value);
    },

    render: function() {
        var addFeedClasses = cx({
            'displayNone': this.state.view !== 1
        });

        var addFolderClasses = cx({
            'displayNone': this.state.view !== 2
        });

        var addOPMLClasses = cx({
            'omplImportForm': true,
            'displayNone': this.state.view !== 3
        });

        var addFeedClassesNav = cx({
            'inputType': true,
            'selected': this.state.view === 1
        });

        var addFolderClassesNav = cx({
            'inputType': true,
            'middle': true,
            'selected': this.state.view === 2
        });

        var addOPMLClassesNav = cx({
            'inputType': true,
            'selected': this.state.view === 3
        });

        var submitOPMLButtonClasses = cx({
            "fa": true,
            "fa-check": true,
            "addOpml": true,
        });

        var opmlInputControlsDisplay = {
            "display": ((this.state.view === 3) && (this.state.opmlFileName !== '')) ? "inline": "none"
        };

        return(
            <li className="setting addFeedSetting">
                <div className="settingTypeContainer">
                    <span className={addFeedClassesNav} onClick={this.setView.bind(this, 1)}>add feed</span>
                    <span className={addFolderClassesNav} onClick={this.setView.bind(this, 2)}>add folder</span>
                    <span className={addOPMLClassesNav} onClick={this.setView.bind(this, 3)}>ompl</span>
                </div>

                <div className={addFeedClasses}>
                    <input type="text" className="feedUrl" placeholder="Add Feed" ref="newFeed" />
                    <span className="fa fa-check addFeedUrl" onClick={this.addFeed}></span>
                </div>

                <div className={addFolderClasses}>
                    <input type="text" className="folderName" placeholder="Add Folder" ref="newFolder"/>
                    <span className="fa fa-check addFolder" onClick={this.addFolder}></span>
                </div>

                <form action={this.state.upload_url} ref="opmlForm" method="POST" encType="multipart/form-data" className={addOPMLClasses}>
                    <input type="file" name="file" className="opmlFile" ref="opmlInput" onChange={this.handleOPMLChange} placeholder="Upload OPML file" />
                    <span className="opmlFilePath" style={opmlInputControlsDisplay}>{this.state.opmlFileName}</span>
                    <span className={submitOPMLButtonClasses} style={opmlInputControlsDisplay} onClick={this.formSubmitClick}></span>
                </form>
            </li>
        )
    }
});

var DeleteFolderSettings = React.createClass( {
    mixins: [ ReactRouter.State, ReactRouter.Navigation ],

    deleteClick: function() {
        if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) {
            AppUtils.deleteFolder(this.props.view[0].name);
            this.transitionTo("/");
        } else {
            AppUtils.unsubscribeFeed(this.props.view[0].name, this.props.view[1].name);
            this.transitionTo("/" + decodeURIComponent(this.props.view[0].name ));
        }

        this.props.hideSettings.call();
    },

    render: function() {
        var caption;
        if ((this.props.view.length === 1) && (this.props.view[0].name === 'root')) { //root
            return(<div></div>)
        } else if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) {
            caption = 'delete folder';
        } else {
            caption = 'unsubscribe';
        }

        return(
            <li className="setting deleteFolder">
                <a className="feedUnsubscribe" onClick={this.deleteClick}>
                    <span className="fa fa-times"></span> {caption}
                </a>
            </li>
         )
    }

});

var AppSettings = React.createClass({
    mixins: [ ReactRouter.State, ReactRouter.Navigation ],

    getInitialState: function() {
        return {
            userSettings: this.props.userSettings
        }
    },

    hideSettings: function () {
        this.props.hideSettings.call();
    },

    saveAndCloseSettings: function () {
        //todo and pass around
    },

    componentWillMount: function() {
        this.newFolderAdded = PubSub.subscribe('NEW_FOLDER_ADDED', function( msg, data ) {
            this.transitionTo('/' + data);
            this.hideSettings();
        }.bind(this));

        this.newFeedAdded = PubSub.subscribe('NEW_FEED_ADDED', function( msg, data ) {
            var url = "/" + encodeURIComponent(data.folder) + '/' + encodeURIComponent(data.feed) + '?new=1';
            this.transitionTo(url);
            this.hideSettings();
        }.bind(this));
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe( this.newFolderAdded );
        PubSub.unsubscribe( this.newFeedAdded );
    },

    getView: function() {
        var view;

        if (this.getParams().feedUrl) {
            title = this.props.currentFeedName;
            view = [{
                name: this.getParams().folderName
            }, {
                name: this.getParams().feedUrl
            }];
        } else if (this.getParams().folderName) {
            title = this.getParams().folderName;
            view = [{
                name: this.getParams().folderName
            }];
        } else {
            title = '';
            view = [{
                name: 'root'
            }];
        };

        return view;
    },

    render: function() {
        if (!this.props.visible) {
            return (<div />)
        }

        var styles = {
            display: this.props.visible ? 'block': 'none'
        }

        var view = this.getView();

        return (
            <ul className="feedSettings" style={styles}>
                <li className="setting closeButton">
                    <a className="close" onClick={this.hideSettings}>
                        <span>CLOSE</span>
                        <span className="fa fa-times"></span>
                    </a>
                </li>

                <HeaderSetting title={title}/>

                <MarkReadSetting
                    view={view} hideSettings={this.props.hideSettings} />

                <ShowHideSetting
                    view={view} userSettings={this.props.userSettings} saveSettings={this.props.saveSettings} hideSettings={this.props.hideSettings} />

                <NightModeSetting
                    nightmode={this.props.userSettings.nightmode} hideSettings={this.props.hideSettings} />

                <ChangeFolderSetting
                    view={view} bloglist={this.props.bloglist} hideSettings={this.props.hideSettings} />

                <AddFeedSetting
                    view={view} />

                <DeleteFolderSettings
                    view={view} hideSettings={this.props.hideSettings} />

            </ul>
        );
    }
});

module.exports = AppSettings;
