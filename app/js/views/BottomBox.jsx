/**
 *
 */
var actions = require('../actions/AppActionCreator');

var More = React.createFactory( require('./More.jsx') );
var Prev = React.createFactory( require('./Prev.jsx') );
var Next = React.createFactory( require('./Next.jsx') );
var ItemList = React.createFactory( require('./ItemList.jsx') );
/**
 * 
 */
var BottomBox = React.createClass({


  /**
   *
   */
  render: function() {

    return (
        <div className="bottom-box">    
            <div id="row_1" className="even">
                <More link={this.props.truth.response.itemList.row_1.ad[0].extra.link1}/>
                <Prev onClick={this.handleLeftArrowClick.bind(this, "row_1", this.props.truth.response.itemList.row_1.ad)}/>
                <ItemList truth={this.props.truth.response.itemList.row_1} />
                <Next onClick={this.handleRightArrowClick.bind(this, "row_1", this.props.truth.response.itemList.row_1.ad)}/>
            </div>
            <div id="row_2" className="even">
                <More link={this.props.truth.response.itemList.row_2.ad[0].extra.link1}/>
                <Prev onClick={this.handleLeftArrowClick.bind(this, "row_2", this.props.truth.response.itemList.row_2.ad)}/>
                <ItemList truth={this.props.truth.response.itemList.row_2} />
                <Next onClick={this.handleRightArrowClick.bind(this, "row_2", this.props.truth.response.itemList.row_2.ad)}/>
            </div>
            <div id="row_3" className="even">
                <More link={this.props.truth.response.itemList.row_3.ad[0].extra.link1}/>
                <ItemList truth={this.props.truth.response.itemList.row_3} />
            </div>
        </div>
  	);
  },
  handleLeftArrowClick: function(key, itemList) {//其實不用傳itemList,因為有key了
    actions.ShiftLeft(key, itemList);
  },
  handleRightArrowClick: function(key, itemList) {//其實不用傳itemList,因為有key了
    actions.ShiftRight(key, itemList);
  }


});

module.exports = BottomBox;
