/** @jsx React.DOM */

var AppMenu = React.createClass({
  handleMarkReadClick: function() {
        var url = $('.articlesList').find('.article:first').data('url'), markReadData = [];

        $('.articlesList').find('.article.unread').removeClass('unread');

        MblRdr.fireMarkArticlesAsRead(markReadData, false, true, function(data) {
            MblRdr.updateFeedReadCount(url, data, false, markReadData, true);
        });

        close();
  },
  
  render: function() {
      debugger;
      var className = this.props.hidden !== 'yes' ? 'feedSettings': 'feedSettings displayNone';

      return (
        <ul className={className}>
            <li className="setting closeButton">
                <a className="close" onClick={this.props.menuButtonClick}>
                    <span>Close</span>
                    <span className="fa fa-times"></span>
                </a>
            </li>

            <li className="settingHeader">
                <input className="settingsTitle"></input>
                <a className="feedTitleOK displayNone">
                    <span className="fa fa-check"></span>
                </a>
            </li>

            <li className="setting markReadSetting">
                <div className="settingTypeContainer">
                    <span className="settingType">mark as read: </span>
                </div>

                <a className="markReadOption" data-val="1" onClick={this.handleMarkReadClick}>all</a>
                </li>

            <li className="setting visibilitySetting">
                <div className="settingTypeContainer">
                    <span className="settingType">show: </span>
                </div>
                
                <a className="showHideOption first" data-val="1"></a>
                <a className="showHideOption second" data-val="2"></a>
            </li>

            <li className="setting nightmodeSetting">
                <div className="settingTypeContainer">
                    <span className="settingType">night mode: </span>
                </div>
                
                <a className="nightmodeOption first" data-val="1">Off</a>
                <a className="nightmodeOption second" data-val="2">On</a>
            </li>

            <li className="setting changeFolderSetting">
                <div className="settingTypeContainer">
                    <span className="settingType">change folder:</span>
                </div>
                
                <select>
                </select>
                <span className="fa fa-check changeFolder"></span>
            </li>

            <li className="setting addFeedSetting">
                <div className="settingTypeContainer">
                    <span className="inputType selected" data-addtype="feed">add feed</span>
                    <span className="inputType" data-addtype="folder">add folder</span>
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
                    <span className="fa fa-times"></span>
                    <span>delete folder</span>
                </a>
            </li>
        </ul>
      );
  }
});
