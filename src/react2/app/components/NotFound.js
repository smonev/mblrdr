'use strict';

let React = require('react');
let ReactRouter = require('react-router');
let Link = ReactRouter.Link;


let NotFound = React.createClass({
    render: function() {
        let style = {
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
