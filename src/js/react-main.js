/** @jsx React.DOM */

var Gist = React.createClass({

  handleClick: function (e) {
    this.props.openClicked(e, $(this.getDOMNode()));
  },  

  render: function() {
    return (
      <div className="comment" onClick={this.handleClick}>
        <h2 className="commentAuthor">
          {this.props.id}
        </h2>
      </div>
    );
  }
});

var GistDetails = React.createClass({

  handleClick: function (e) {
    this.props.publicClicked(e);
  },  

  render: function() {
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.id}
        </h2>
        
        <h1>
          {this.props.children}
        </h1>

        <h3>
        Public:<a onClick={this.handleClick}> {this.props.public ? 'True': 'False'}</a>
        </h3>
      </div>
    );
  }
});

var UserGist = React.createClass({
    getDefaultProps: function() {
      return {
        gists: []
      };
    },  


  getInitialState: function() {
    return {
      gists: []
    };
  },

  componentDidMount: function() {
    $.get(this.props.source, function(result) {
      this.setState({
        gists: result
      });
    }.bind(this));
  },

  publicClicked: function(item,a) {
    item.public = !item.public;
    this.setState(item);
  },

  openClicked: function(item, x, $clicked) {
    if ($clicked.next().css('display')  === 'none') {
        $clicked.next().css('display', 'initial');
    } else {
        $clicked.next().css('display', 'none');
    }
    
  },

  render: function() {
    return (
        <ul>
          {this.state.gists.map(function(item, i) {
              return (
                <li key={item.id} >
                   <Gist openClicked={this.openClicked.bind(this, item)} id={item.id} >{item.url}</Gist>
                   <GistDetails public={item.public} publicClicked={this.publicClicked.bind(this, item)} >{item.url}</GistDetails>
                </li>
              );
          }, this)}
        </ul>
    );
  }
});


var AppHeader = React.createClass({
    handleClick: function() {
        this.setState({settingsAreHidden  : 'no'});
    },
    render: function() {
        return (
            <div className="menu">
                <header>
                    <a className="feedSettingsAction" onClick={this.props.menuButtonClick}>
                        <span className="fa fa-bars"></span>
                    </a>
                    <span className="headerCaption">{this.props.folderName}</span>
                    <a className="up">
                        <span className="fa fa-home"></span>
                    </a>
                </header>
                <ul className="menuList">
                </ul>
            </div>
        );
    }
});

var Application = React.createClass({
    getInitialState: function() {
        return {
            settingsAreHidden: 'yes',
            currentFolder: 'root',
            currentFeed: '',
            nightmode: 1
        }
    },

    componentDidMount: function() {
        var str = '/GetUserFeeds', that = this;

        $.getJSON(str, function(data) {
            MblRdr.bloglist = data.bloglist;
            MblRdr.username = data.username;
            that.loadUrlStateOrDefault();

            if (typeof data.userSettings !== "undefined") {
                MblRdr.userSettings = data.userSettings;
                MblRdr.userSettings.nightmode = data.userSettings.nightmode ? data.userSettings.nightmode: 1;
            } else {
                MblRdr.userSettings = {};
                MblRdr.userSettings.nightmode = 1;
            }

            if (MblRdr.userSettings.nightmode === 2) {
                $('body').addClass('nightmode');
            } else {
                $('body').removeClass('nightmode');
            }
        });
    },

    loadUrlStateOrDefault: function() {

        function getURLParameter(name) {
            return decodeURI(
                (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
            );
        }
        var folderName = getURLParameter('folderName'), feedUrl = getURLParameter('feedUrl'), state = {}, historyState = History.getState();

        debugger;

        if ((folderName !== "null") && (feedUrl !== "null")) {
            currentFeed = feedUrl;
            currentFolder = folderName;
        } else if (folderName !== "null") {
            currentFeed = '';
            currentFolder = folderName;
        } else {
            currentFeed = '';
            currentFolder = 'root';
        }

        this.setState({
            currentFeed: currentFeed,
            currentFolder: currentFolder
        });
    },

    menuButtonClick: function () {
        debugger;
        this.setState({settingsAreHidden: this.state.settingsAreHidden === 'yes' ? 'no': 'yes'});
    },

    render: function() {
        return (
            <div>
                <AppHeader folderName={this.state.currentFolder} menuButtonClick={this.menuButtonClick} source="https://api.github.com/users/octocat/gists" />
                <AppMenu hidden={this.state.settingsAreHidden} menuButtonClick={this.menuButtonClick} source="https://api.github.com/users/octocat/gists" />
            </div>
        );
    }
});

React.renderComponent(
    <Application />, document.body
);

                //  <UserGist source="https://api.github.com/users/octocat/gists" />
