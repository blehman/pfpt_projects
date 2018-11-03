function GradientLegend(stateFunc){
  var legend
    , svg
    , totalSteps = d3.selectAll('.step').size()
    , gradientLegendContainer
    , legendBarHeight = 10
    , gColorScale
    , gArray
    , gPercentScale
    , outerRingDiameter
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
      drawGradientLegend()

      function redrawLegend(){
        setAttr()
        drawBars()
        drawAxis()
        gradientText()
        gUpdate()
      }
      function setAttr(){
        var adj = (stateFunc.data.adjY - stateFunc.data.outerRingRadius)/4
          /*
          , squareWidth = 2*stateFunc.data.simSetup.nodeRadius
          , outerMargin = 20
          , leftStartPoint = (-1*(stateFunc.data.adjX-outerMargin))
          , rightStartPoint = (stateFunc.data.adjX-outerMargin)
          , innerMargin = 20
          , baseWidth = stateFunc.data.adjX-outerMargin-innerMargin
          , baseCount = Math.floor(baseWidth/(squareWidth));
          */

        outerRingDiameter = 2*stateFunc.data.outerRingRadius;
        gContainer.attr("transform","translate(0,0)")
        gContainer.attr("transform","translate("+(stateFunc.data.adjX-stateFunc.data.outerRingRadius)+","+(stateFunc.data.adjY-stateFunc.data.outerRingRadius-adj)+")")
        gColorScale = stateFunc.data.intelColorScale.copy()
        gColorScale.domain([0,outerRingDiameter])
        gArray = d3.range(outerRingDiameter)
        gPercentScale = d3.scaleLinear()
          .domain([0, 1])
          .range([0,gArray.length - 1]);
      }
      function drawGradientLegend(){
        svg = d3.select("#viz-svg")

        gContainer = svg.append("g").attr("id","gradient-legend-container").style("opacity",0);
        setAttr()
        drawBars()
        drawAxis()
        gradientText()
        gUpdate()

        stateFunc.data.dispatch.on("update-legend",gUpdate)
        stateFunc.data.dispatch.on("redraw-legend",redrawLegend)
      }
      function drawBars(){
        d3.selectAll("#gradient-bars").remove()
        var bars = gContainer.append("g")
          .attr("id","gradient-bars")
          .selectAll(".bars")
            .data(gArray, function(d) { return d; })
          .enter().append("rect")
            .attr("class", "bars")
            .attr("x", function(d, i) { return i})//return gArray.length-i-1; })
            .attr("y", 0+"px")
            .attr("height", legendBarHeight)
            .attr("width", 1+"px") .style("fill", function(d, i ) {
              return gColorScale(d);
            })
      }
      function gradientText(){

        d3.selectAll("#gradient-text").remove();

        var gText = gContainer.append("g")
          .attr("id","gradient-text")
         .append("text")
          .classed("small-size-font general-font-family general-color-font",true)
          .text("Percent Confidence")
          .attr("x",(gArray.length/2)+"px")
          .attr("y",(-5)+"px")
          //.style("fill","#bdbdc1")
          .style("text-anchor","middle");

      }
      function drawAxis(){
        var gAxis = d3.axisBottom(gPercentScale).ticks(5, "%").tickPadding(6);
        d3.select("#gradient-axis").remove()
        gContainer.append("g")
          .attr("id","gradient-axis")
          .attr("class","axis")
          .classed("small-size-font general-font-family general-color-font",true)
          .call(gAxis);
      }
      function gUpdate(){
        var opacity = (stateFunc.data.step < 3)? 0:1;
        d3.select("#gradient-legend-container")
          .transition()
          .duration(1000)
          .style("opacity",opacity)
      }
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
    })// selection.each()
  }// chart()
  chart.step = function(s) {
    if (!arguments.length) { return step; }
    step = s;
    return chart;
  };
  return chart
}
