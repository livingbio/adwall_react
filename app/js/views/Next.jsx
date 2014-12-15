/**
 *
 */
var actions = require('../actions/AppActionCreator');

/**
 * 
 */
var Next = React.createClass({


  /**
   *
   */
	render: function() {

		return <div  className="next" onClick={this.props.onClick}></div>;
	}

});

module.exports = Next;
