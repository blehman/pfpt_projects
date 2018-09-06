function Legend(stateFunc){
  var legend
    , svg
    , totalSteps = d3.selectAll('.step').size();
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
  , "step9":blackhole
  //, "step9":noise
}
*/
  function chart(selection){
    // note: selection is passed in from the .call(iChartType), which is the same as myHeatmap(d3.select('.stuff')) -- ??
    // using d3 for convenience
    selection.each(function(dataObject){

      drawLegend()
      stateFunc.data.dispatch.on("redraw-legend",redrawLegend)

      iDispatch.on("step-progress", handleLegend)
      //iDispatch.on("step-progress", buildBarGraph)

      function getPercent(){
        var step = "step"+stateFunc.data.step
          , percentProgress = (stateFunc.data.step+stateFunc.data.progress) / totalSteps
          , percentUnknownPerStep = ((stateFunc.data.percentUnknown*(1-stateFunc.data.progress))*100)
          , percentUnknown = stateFunc.data.percentUnknown*100
          //, pText = d3.min([percentUnknownPerStep,percentUnknown])
          , pText = stateFunc.data.percentUnknown*100
          , newText = (pText==100)?"100":pText.toFixed(2)
        return newText;
      }


      function redrawLegend(){
        d3.select("#legend-container").remove();
        drawLegend()
      }//redrawLegend()

      function drawLegend(){
        svg = d3.select("#viz-svg");

        legend = svg.append("g")
          .attr("id","legend-container")
          .attr("transform","translate("+stateFunc.data.adjX+","+stateFunc.data.adjY+")");

        stateFunc.data.dispatch.on("update-legend",handleLegend)
        // kick off initial Legend drawing
        handleLegend()
      }//drawLegend()

      function handleLegend(){
        d3.selectAll(".legend-text").remove()
        if ((stateFunc.data.step>1)&(stateFunc.data.step<11) ) drawUnknownLegend();
        if ((stateFunc.data.step>4)&(stateFunc.data.step<10) ) drawAuthorizedLegend();
        if ((stateFunc.data.step>6)&(stateFunc.data.step<10) ) drawRiskyLegend();
      }//handleLegend()
      function drawUnknownLegend(){
        var newText = getPercent();

        legend.append("text")
          .attr("id","legend-unknown-text")
          .classed("legend-text general-font-family general-color-font",true)
          .attr("x",stateFunc.data.legendMargins.left+stateFunc.data.legendMargins.symbolTextStart)
          //.attr("y",20)
          .attr("y",stateFunc.data.legendMargins.top+0*stateFunc.data.legendMargins.space)
          .text("Unknown IP ("+newText+"%)")
      }
      function drawAuthorizedLegend(){
        legend.append("text")
          .attr("id","legend-unknown-text")
          .classed("legend-text general-font-family general-color-font",true)
          .attr("x",stateFunc.data.legendMargins.left+stateFunc.data.legendMargins.symbolTextStart)
          //.attr("y",20)
          .attr("y",stateFunc.data.legendMargins.top+1*stateFunc.data.legendMargins.space)
          .text("Known Good IP")
      }
      function drawRiskyLegend(){
          legend.append("text")
            .attr("id","legend-unknown-text")
            .classed("legend-text general-font-family general-color-font",true)
            .attr("x",stateFunc.data.legendMargins.left+stateFunc.data.legendMargins.symbolTextStart)
            //.attr("y",20)
            .attr("y",stateFunc.data.legendMargins.top+2*stateFunc.data.legendMargins.space)
            .text("Known Bad IP")
       }

    })// selection.each()
  }// chart()
  chart.step = function(s) {
    if (!arguments.length) { return step; }
    step = s;
    return chart;
  };
  return chart
}
