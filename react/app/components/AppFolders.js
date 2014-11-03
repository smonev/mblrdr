/** @jsx React.DOM */
var React = require('react');

var AppFolders = React.createClass({
    render: function() {
        var folders = '';
        if (this.props.folders.length > 0) {
            folders = this.props.folders
                .filter(function(element){
                    return element !== 'root';
                })
                .map(function (folder) {
                    return (
                        <li className="folder" key={folder}>
                            <a>
                                <span className="fa fa-folder"></span>
                                <span className="feedTitle">{folder}</span>
                                <span className="unreadCount"></span>
                            </a>
                        </li>
                    );
                });
        }

        var feeds = '';
        if (this.props.feeds.length > 0) {
            feeds = this.props.feeds
                .map(function (feed) {
                    return (
                        <li className="feed unread" key={feed.url}>
                            <a>
                                <span className="unreadHandle"></span>
                                <span className="fa fa-file"></span>
                                <span className="feedTitle">{feed.title}</span>
                                <span className="unreadCount"></span>
                            </a>
                        </li>
                    );
                });
        }

        return (
            <ul className="menuList">
                {folders}
                {feeds}
            </ul>
        );
    }
});

module.exports = AppFolders;
