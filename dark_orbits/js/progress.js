function Progress(){
  var svg
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
    ;

  function chart(selection){
    // note: selection is passed in from the .call(iChartType), which is the same as myHeatmap(d3.select('.stuff')) -- ??
    // using d3 for convenience
    selection.each(function(dataObject){
      console.log(dataObject)
      // get [min,max] message counts
      messageExtent = d3.extent(dataObject.client,d=>d.message_count)

      iDispatch.on("step-progress",function(currentStep, currentProgress){
        console.log("TESTING")
      })
/*
      stepHandler = {
        "step0":blackhole
        , "step1":blackholeLabel
        , "step2":center
        , "step3":coronaLinear
        , "step4":coronaLog
        , "step5":coronaSPF
        , "step6":coronaSender
        , "step7":coronaIP
        , "step8":coronaUnknown
        , "step9":coronaClear
        , "step10":blackholeLimited
        //, "step9":noise
      }
*/

      })// selection.each()
  }// chart()
  chart.iDispatch = function(d) {
    if (!arguments.length) { return iDispatch; }
    iDispatch = d;
    return chart;
  };
  chart.simSetup = function(s) {
    if (!arguments.length) { return simSetup; }
    simSetup = s;
    return chart;
  };
  chart.client = function(c) {
    if (!arguments.length) { return client; }
    client = c;
    return chart;
  };
  chart.rScale = function(r) {
    if (!arguments.length) { return rScale; }
    rScale = r;
    return chart;
  };
  chart.rScaleLinear = function(r) {
    if (!arguments.length) { return rScaleLinear; }
    rScaleLinear = r;
    return chart;
  };
  chart.rScaleLog = function(r) {
    if (!arguments.length) { return rScaleLog; }
    rScaleLog = r;
    return chart;
  };
  return chart
}
