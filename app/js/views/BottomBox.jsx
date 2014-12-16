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

    render: function() {

        var response = this.props.truth.response;

        return (
            <div className="bottom-box">    
                <div id="row_1" className="even">
                    <More link={response.itemList.row_1.ad[0].extra.link1}/>
                    <Prev onClick={this._handleLeftArrowClick.bind(this, "row_1", response.itemList.row_1.ad)}/>
                    <ItemList row={response.itemList.row_1} />
                    <Next onClick={this._handleRightArrowClick.bind(this, "row_1", response.itemList.row_1.ad)}/>
                </div>
                <div id="row_2" className="even">
                    <More link={response.itemList.row_2.ad[0].extra.link1}/>
                    <Prev onClick={this._handleLeftArrowClick.bind(this, "row_2", response.itemList.row_2.ad)}/>
                    <ItemList row={response.itemList.row_2} />
                    <Next onClick={this._handleRightArrowClick.bind(this, "row_2", response.itemList.row_2.ad)}/>
                </div>
                <div id="row_3" className="even">
                    <More link={response.itemList.row_3.ad[0].extra.link1}/>
                    <ItemList row={response.itemList.row_3} />
                </div>
            </div>
        	);
    },
    _handleLeftArrowClick: function(key, itemList) {//其實不用傳itemList,因為有key了
        actions.ShiftLeft(key, itemList);
    },
    _handleRightArrowClick: function(key, itemList) {//其實不用傳itemList,因為有key了
        actions.ShiftRight(key, itemList);
    }


});

module.exports = BottomBox;
