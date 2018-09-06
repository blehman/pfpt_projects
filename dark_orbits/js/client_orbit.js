function ClientOrbit(stateFunc){
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
    , canvas2
    , ctx2
    , width
    , height
    , outerRadius
    , outerRadius2
    , innerRadius2
    , k
    , client
    , run
    , step=-1
    , simDelta
    , gridLength
    , adjX
    , adjY
    , nodeRadius = d3.scaleOrdinal().domain([1,2,3,4,5]).range([1,1,5,5,5])
    , scroller
    , progress = 0.0
    , progressScale = d3.scaleLinear().domain([0.0,0.60]).range([0,1]).clamp(true)
    , drawLogic
    , legendMargins

    ;

  function chart(selection){
    // note: selection is passed in from the .call(iChartType), which is the same as myHeatmap(d3.select('.stuff')) -- ??
    // using d3 for convenience
    selection.each(function(dataObject){
      console.log(dataObject)
      // get [min,max] message counts
      messageExtent = d3.extent(dataObject.client,d=>d.message_count)

      //creat the pen that will draw on the canvas
      canvas2 = document.querySelector("#viz-canvas-client")
      ctx2 = canvas2.getContext("2d")
      fitToContainer2()
      //ctx2.translate(adjX,adjY);
      // draw stuff
      iDispatch.on("step-progress-beyond",function(currentStep, currentProgress){
        progress = currentProgress;
        stepHandler2["step"+ currentStep]()
      })


      stepHandler2 = {
        "step0":_nada_
        , "step1":_nada_
        , "step2":_nada_
        , "step3":_nada_
        , "step4":_nada_
        , "step5":_nada_
        , "step6":_nada_
        , "step7":_nada_
        , "step8":_nada_
        , "step9":_nada_
        , "step10":_nada_
        , "step11":renderQueueStep
        //, "step9":noise
      }

      iDispatch.on("step-change-beyond", function(i){
        step = i;

        var stepName = stepHandler2["step"+ step].name ;
        console.log(stepName+" --beyond")
        stepHandler2["step"+ step]()

        //stateFunc.data.dispatch.call("update-legend",this,step)
      })

      function _nada_(){
        /*
        ctx.clearRect(0, 0, width, height);
        ctx.fill()
        ctx.stroke()
        */
        if (ctx2){
          ctx2.clearRect(0, 0, width, height);
          ctx2.globalAlpha = 1;
        }
      }

      function renderQueueStep(){
        //clearSaveTranslateContext()
        //ctx.globalAlpha = 0;
        //simulation.stop()
        //ctx.translate(adjX,adjY);

        var color = d3.scaleLinear()
           .domain([0, 0.5, 1])
              .range(["#ef2212", "#e7c767", "#2799df"])
              .interpolate(d3.interpolateHcl);

        // set up a render queue
        var render = renderQueue(dot)
          //.clear(clear_canvas);

        // queue up some generated data
        render(generate(stateFunc.data.clientData));

        function generate(clientData) {
          //console.log(width,height)
          return clientData.map(function(d) {
            randAngle = Math.random()*Math.PI*2
              , radius = stateFunc.data.rScaleLog(d.message_count)
              , randX = Math.cos(randAngle)*radius
              , randY = Math.sin(randAngle)*radius;
              //, color = "red";
            return [
              randX,              // x
              randY,             // y
              color(Math.random())
            ];
          });
        };

        function dot(pos) {
          //console.log(pos[0]-1+stateFunc.data.adjX,pos[1]-1+stateFunc.data.adjY)
          ctx2.fillStyle = pos[2];
          ctx2.beginPath();
          ctx2.fillRect(pos[0]-1+stateFunc.data.adjX,pos[1]-1+stateFunc.data.adjY+520,2,2);
          ctx2.stroke();
          ctx2.fill();
          ctx2.closePath();
        };
        function clear_canvas() {
          //ctx2.clearRect(0, 0, width, height);
          //ctx.save();
          //ctx.clearRect(0,0,canvas.width,canvas.height);
          //ctx.translate(adjX,adjY);
          //clearSaveTranslateContext();
        };
      } //renderQueueStep()

    function clearSaveTranslateContext(){
      ctx2.clearRect(0, 0, width, height);
      ctx2.save();
      ctx2.translate(adjX,adjY);
    } //clearSaveTranslateContext()
    function fitToContainer2(){
      // Make it visually fill the positioned parent
      canvas2.style.width ='100%';
      canvas2.style.height='100%';
      // ...then set the internal size to match
      canvas2.width  = canvas2.offsetWidth;
      canvas2.height = canvas2.offsetHeight;
      width = canvas2.width;
      height = canvas2.height;
      adjX = width/2;
      adjY = height/2;
      console.log(width,height)
    }//fitToContainer(canvas)

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
  chart.gridLength = function(g) {
    if (!arguments.length) { return gridLength; }
    gridLength = g;
    return chart;
  };
  chart.height = function(h) {
    if (!arguments.length) { return height; }
    height = h;
    return chart;
  };
  chart.width = function(w) {
    if (!arguments.length) { return width; }
    width = w;
    return chart;
  };
  chart.scroller = function(s) {
    if (!arguments.length) { return scroller; }
    scroller = s;
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
  return chart
}
