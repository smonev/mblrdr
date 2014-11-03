/** @jsx React.DOM */
var React = require('react');
var EventEmitter = require('events').EventEmitter;
var globalEvents = new EventEmitter();
var cx = React.addons.classSet;

globalEvents.on('nightModeChange', function(dayMode){
    if (dayMode) {
        $('body').removeClass('nightmode');
    } else {
        $('body').addClass('nightmode');
    }
});

var MarkReadSetting = React.createClass({
    markAsReadClick: function() {

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
                    <input className="settingsTitle" value={this.props.title}></input>
                    <span className="fa fa-check"></span>
                </li>
                )
    }
});

var ShowHideSetting = React.createClass({
    showHideClick: function(e) {
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
        this.props.hideSettings.call();
    },

    resolveShowRead: function() {
        var showAll;

        if ((this.props.view.length === 1) && (this.props.view[0].name === 'root')) { //root
            showAll = this.props.userSettings.showRead;
        } else if ((this.props.view.length === 1) && (this.props.view[0].name !== 'root')) { //folder
            showAll = this.props.userSettings[this.props.view[0].name].showRead = showHideType === 1 ? true : false;
        } else { //feed
            showAll = this.props.userSettings[this.props.view[0].name][this.props.view[1].name].showRead;
        }
        return showAll;
    },

    render: function() {
        //showUnread/showAll
        var showRead = this.resolveShowRead()
        var showHideFirstClasses = cx({
            "showHideOption": true,
            'showAll': true,
            'first': true,
            'selected': showRead
        });
        var showHideSecondClasses = cx({
            "showHideOption": true,
            'showUnreadOnly': true,
            'second': true, //todo remove css dependncy
            'selected': !showRead
        });

        return(
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
        var dayMode = e.target.classList.contains('dayMode');
        globalEvents.emit('nightModeChange', dayMode);

        if (dayMode) {
            this.props.userSettings.nightmode = 1;
        } else {
            this.props.userSettings.nightmode = 2;
        }

        this.props.saveSettings(this.props.userSettings);
        this.props.hideSettings.call();
    },


    render: function() {
        // nigthmode
        var nightmodeFirstClasses = cx({
            'nightmodeOption': true,
            'dayMode': true,
            'selected': this.props.userSettings.nightmode === 1
        });
        var nightmodeSecondClasses = cx({
            'nightmodeOption': true,
            'nightMode': true,
            'selected': this.props.userSettings.nightmode === 2
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
    render: function() {

        // folder list
        var that = this;
        var foldersList2 = Object.keys(this.props.bloglist).map(function(folder, index) {
            var selected = folder === that.props.view[0].name ? 'selected' : ''
            return (
                <option key={folder} className={selected}>
                    {folder}
                </option>
            );
        });

        return (
            <li className="setting changeFolderSetting">
                <div className="settingTypeContainer">
                    <span className="settingType">change folder:</span>
                </div>

                <select>
                    {foldersList2}
                </select>
                <span className="fa fa-check changeFolder"></span>
            </li>
        )
    }
});

var AppSettings = React.createClass({
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

    render: function() {
        if (!this.props.visible) {
            // is this the react way?
            return (<div />)
        }

        var styles = {
            display: this.props.visible ? 'block': 'none'
        }

        // setting title
        var title = this.props.view[this.props.view.length - 1].name;
        if ((this.props.view.length = 1) && (title === 'root')) {
            title = ''
        }

        return (
            <ul className="feedSettings" style={styles}>
                <li className="setting closeButton">
                    <a className="close" onClick={this.hideSettings}>
                        <span>Close</span>
                        <span className="fa fa-times"></span>
                    </a>
                </li>

                <HeaderSetting title={title}/>

                <MarkReadSetting />

                <ShowHideSetting view={this.props.view} userSettings={this.props.userSettings} saveSettings={this.props.saveSettings} hideSettings={this.props.hideSettings} />

                <NightModeSetting view={this.props.view} userSettings={this.props.userSettings} saveSettings={this.props.saveSettings} hideSettings={this.props.hideSettings} />

                <ChangeFolderSetting  view={this.props.view} bloglist={this.props.bloglist} saveSettings={this.props.saveSettings} hideSettings={this.props.hideSettings} />

                <li className="setting addFeedSetting">
                    <div className="settingTypeContainer">
                        <span className="inputType selected" data-addtype="feed">add feed</span>
                        <span className="inputType middle" data-addtype="folder">add folder</span>
                        <span className="inputType" data-addtype="opml">ompl</span>
                    </div>
                    <input type="text" className="feedUrl" />
                    <span className="fa fa-check addFeedUrl"></span>

                    <input type="text" className="folderName displayNone" />
                    <span className="fa fa-check addFolder displayNone"></span>

                    <form action="{{ upload_url }}" method="POST" encType="multipart/form-data" className="omplImportForm displayNone">
                        <input type="file" name="file" className="opmlFile" placeholder="Upload OPML file" />
                        <span className="opmlFilePath"></span>
                        <span className="fa fa-check addOpml"></span>
                    </form>
                </li>

                <li className="setting deleteFolder displayNone">
                    <a className="feedUnsubscribe">
                        <span className="fa fa-times"></span> unsubscribe
                    </a>
                </li>
            </ul>
        );
    }
});

module.exports = AppSettings;
