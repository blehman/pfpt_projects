function Counter(stateFunc){
  var simulation
    , iDispatch
    , simSetup
    , svg
    , container
    , progressText
    , progressGraph
    , posBar
    , extraTick
    , outerRadius
    , innerRadius
    , totalSteps = d3.selectAll('.step').size()
    , step2percent = {
        "step3":0
        , "step4":0
        , "step5":1
        , "step6":60
        , "step7":95
    }
    , progSetup = {
      scaleLength: 20
      , radius: 5
    }
    , yProgScale
    , progressAxis
    ;
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
      svg = d3.select("#viz-svg");

      iDispatch.on("step-progress", runUpdate)
      //iDispatch.on("step-progress", buildBarGraph)

      function runUpdate(stepIndex,progress){
        d3.selectAll("#counter-container").remove()
        if ((stateFunc.data.step>4)&(stateFunc.data.step<10)){
          //drawText()
          drawProgressChart()
          //pdateText(stepIndex,progress)
          updateProgressChart(stepIndex,progress)
        }
      }
      function drawText(){
        container = svg.append("g")
          .attr("id","counter-container")
          .attr("transform","translate("+stateFunc.data.adjX+","+stateFunc.data.adjY+")");

        progressText = container.append("text")
          .classed("progress-text general-font-family general-color-font", true)
          //.style("fill",stateFunc.data.simSetup.nodeStrokeColor)
          .attr("x",(stateFunc.data.legendMargins.left+stateFunc.data.legendMargins.symbolTextStart+120))
          //.attr("y",20)
          .attr("y",(stateFunc.data.legendMargins.top+0*stateFunc.data.legendMargins.space))
          //.attr("x",stateFunc.data.width*0.35)
          //.attr("y",stateFunc.data.height*0.45)
          .text("");
      }

      function updateText(stepIndex,progress){
        var step = "step"+stepIndex
          , percentProgress = (stepIndex+progress) / totalSteps
          , percentUnknownPerStep = ((stateFunc.data.percentUnknown*(1-progress))*100)
          , percentUnknown = stateFunc.data.percentUnknown*100
          //, pText = d3.min([percentUnknownPerStep,percentUnknown])
          , pText = stateFunc.data.percentUnknown*100
          , newText = (pText==100)?"100":pText.toFixed(2);
          //console.log(pText)
          progressText.text("("+ newText +"%)") //  progressText.text("("+((1-percentProgress)*100).toFixed(2)+"%)")
      }
      function updateProgressChart(stepIndex,progress){
        var step = "step"+stepIndex
          , percentProgress = (stepIndex+progress) / totalSteps
          , barHeight = yProgScale.range()[0]/2;

        posBar
          .attr("y",-1*(barHeight*stateFunc.data.percentKnown))
          .attr("height",barHeight*(stateFunc.data.percentKnown))

        negBar
          .attr("height",barHeight*(stateFunc.data.percentUnknown*0.93))
        //.attr("height",barHeight*(1-percentProgress))
      }
      function drawProgressChart(){
        progressGraph = container.append("g")
          .attr("id","bar-graph")
          .attr("transform","translate("+stateFunc.data.legendMargins.right+","+(stateFunc.data.legendMargins.top-20)+")");

        yProgScale = d3.scaleLinear().domain([-1,1]).range([10*stateFunc.data.simSetup.nodeRadius*2,0])
        progressAxis = d3.axisLeft(yProgScale).ticks(3,"%")
        progressAxis = progressGraph.append("g")
          .attr("id","progress-axis")
          .attr("transform","translate("+-5+","+(-yProgScale.range()[0]/2)+")")
          .call(progressAxis)


        cliper = progressGraph.append("clipPath")
          .attr("id", "clipsMcGee");

        cliper.selectAll(".posCirc")
          .data([1,2,3,4,5])
          .enter().append("circle")
          .attr("cx",stateFunc.data.simSetup.nodeRadius)
          .attr("cy",function(d,i){
            var r = stateFunc.data.simSetup.nodeRadius
              , diameter = 2*r;
              return -1*(r + (i*diameter))-1;
          })
          .attr("r",stateFunc.data.simSetup.nodeRadius);

        cliper.selectAll(".negRect")
          .data([1,2,3,4,5])
          .enter().append("rect")
          .attr("x",-1)
          .attr("y",function(d,i){
            var r = stateFunc.data.simSetup.nodeRadius
              , diameter = 2*r;
              return (i*diameter)+2;
          })
          .attr("height",stateFunc.data.simSetup.nodeRadius*2)
          .attr("width",stateFunc.data.simSetup.nodeRadius*2.5);

        posBar = progressGraph.append("rect")
          .classed("bar-pos",true)
          .attr("clip-path", "url(#clipsMcGee)")
          .attr("height",0)
          .attr("width",stateFunc.data.simSetup.nodeRadius*2)
          .attr("x",0)
          .attr("y",-2)
          .attr("fill","gray")
          .attr("stroke","none");

        negBar = progressGraph.append("rect")
          .classed("bar-neg",true)
          .attr("clip-path", "url(#clipsMcGee)")
          .attr("height",0)
          .attr("width",stateFunc.data.simSetup.nodeRadius*2)
          .attr("x",0)
          .attr("y",3)
          .style("fill",stateFunc.data.simSetup.nodeFillColor)
          .style("stroke",stateFunc.data.simSetup.nodeStrokeColor);

        var line = d3.line();
        extraTick = progressGraph.append("path")
          .datum([[-10,0.3],[10,0.3]])
          .attr("fill", "none")
          .attr("stroke", "#bdbdc1")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1)
          .attr("d", line)
      }
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
  chart.simulation = function(s) {
    if (!arguments.length) { return simulation; }
    simulation = s;
    return chart;
  };
  chart.outerRadius = function(o) {
    if (!arguments.length) { return outerRadius; }
    outerRadius = o;
    return chart;
  };
  chart.innerRadius = function(i) {
    if (!arguments.length) { return innerRadius; }
    innerRadius = i;
    return chart;
  };
  chart.rScale = function(r) {
    if (!arguments.length) { return rScale; }
    rScale = r;
    return chart;
  };
  chart.step = function(s) {
    if (!arguments.length) { return step; }
    step = s;
    return chart;
  };
  return chart
}
