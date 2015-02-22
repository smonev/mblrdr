'use strict';

var React = require('react');
var ReactRouter = require('react-router');
var Link = ReactRouter.Link;


var NotFound = React.createClass({
    render: function() {
        var style = {
            textAlign: 'center ',
            margin: '70px',
            fontSize: '2em'
        };

        return (
            <div style={style}> Nothing here, go <Link to={"/"}>HOME</Link>

            </div>
        );
    }
});

module.exports = NotFound;
