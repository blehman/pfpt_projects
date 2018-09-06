function State(){
  var self = this;
  const varToString = varObj => Object.keys(varObj)[0]
  var myState
    , svg
    , iDispatach
    , simSetup
    , rScale
    , rScaleLinear
    , rScaleLog
    , rScaleLinearColor
    , rScaleLogColor
    , colorScale = d3.scaleOrdinal()
      .domain([4, 3, 5, 2, 1])
      .range(['#edf8fb', '#66c2a4','#2ca25f','#5df500','#5df500'])
      //.range(['#edf8fb', '#66c2a4','#2ca25f','#006d2c','#5df500'])

    , simulation
    , outerRadius = 5
    , innerRadius
    ;

  function chart(selection){
    // note: selection is passed in from the .call(iChartType), which is the same as myHeatmap(d3.select('.stuff')) -- ??
    // using d3 for convenience
    selection.each(function(dataObject){
      console.log(dataObject)
      console.log(outerRadius)
      myState = {
        svg
        , iDispatach
        , simSetup
        , rScale
        , rScaleLinear
        , rScaleLog
        , rScaleLinearColor
        , rScaleLogColor
        , colorScale
        , simulation
        , outerRadius
        , innerRadius
      }
    })// selection.each()
  }// chart()
  chart.updateVar = function(key){
    //stateFunct.setter({key:value})
  }
  chart.outerRadius = function(r) {
    if (!arguments.length) { return outerRadius; }
    outerRadius = r;
    return chart;
  };
  return chart
}
