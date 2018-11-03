function Acts(stateFunc){
  var iDispatach
    , simSetup
    , width
    , height
    , outerRadius
    , innerRadius
    , rScale
    , step
    , trans = d3.transition()
        .duration(3000)
        .ease(d3.easeLinear)
    , simulation
    , svg
    , drawing
    , i = 0
    , stoper = function stop(){}
    , t1 = {"stop":stoper}
    , t2 = {"stop":stoper};
  function chart(selection){
    selection.each( function(dataObject){
      svg = d3.select(this);
      stateFunc.data.svg = d3.select(this)
      stateFunc.data.t1 = {"stop":stoper}
      stateFunc.data.t2 = {"stop":stoper}

      draw();

      svg.on("click", function(){

        if ((stateFunc.data.step<2)||(stateFunc.data.step>5)) return;
        /*
        var mouseCoords = d3.mouse(this)
        , node = canvas2svgNode(mouseCoords)
        , transformedCoord = [mouseCoords[0]-stateFunc.data.adjX,mouseCoords[1]-stateFunc.data.adjY];
        */
        var ff_element = document.getElementById("viz-svg") //d3.select("#viz-svg").node()d3.select("#viz-svg").node()
          , ff_mouseX = d3.event.clientX
          , ff_mouseY = d3.event.clientY
          , ff_svgPoint = ff_element.createSVGPoint();

        // set points
        ff_svgPoint.x = ff_mouseX
        ff_svgPoint.y = ff_mouseY

        // transform points
        var ff_svgGlobal = ff_svgPoint.matrixTransform(ff_element.getScreenCTM().inverse());

        //stateFunc.data.mouseCoords = d3.mouse(this)
        stateFunc.data.mouseCoords = [ff_svgGlobal.x, ff_svgGlobal.y]
        stateFunc.data.node = canvas2svgNode(stateFunc.data.mouseCoords)
        stateFunc.data.transformedCoord = [stateFunc.data.mouseCoords[0]-stateFunc.data.adjX,stateFunc.data.mouseCoords[1]-stateFunc.data.adjY]

        t1.stop();
        t2.stop();

        t1 = d3.timer(function(elapsed) {
          var svgCoords = canvas2svgCoords(stateFunc.data.node);
          stateFunc.data.svgCoords = canvas2svgCoords(stateFunc.data.node);
          if (Math.random()<=0.30) particle(stateFunc.data.svgCoords);
          if (elapsed > 2000) t1.stop();
        })
        t2 = d3.timer(function(elapsed) {
          buildAnnotations(stateFunc.data.node,stateFunc.data.transformedCoord)
          if (elapsed > 3000) t2.stop();
        })
      });

      svg.on("mousemove",handleMouseMove)

      function draw(){
        d3.selectAll(".drawing").remove();

        drawing = svg.append("g")
          .classed("drawing", true)
          .attr("transform","translate("+stateFunc.data.adjX+","+stateFunc.data.adjY+")");
      }
      function redraw(){
        svg=d3.select("viz-svg")
        stateFunc.data.svg = d3.select("viz-svg")
        draw();
      }

      function handleMouseMove(){
        if ( ((stateFunc.data.step<1)||(stateFunc.data.step>5)) ) return;
        // d3.mouse(this) is not working in FireFox so using another method to get the screen coords.
        var ff_element = document.getElementById("viz-svg") //d3.select("#viz-svg").node()

        var ff_mouseX = d3.event.clientX
          , ff_mouseY = d3.event.clientY
          , ff_svgPoint = ff_element.createSVGPoint();

        // set points
        ff_svgPoint.x = ff_mouseX
        ff_svgPoint.y = ff_mouseY

        // transform points
        var ctm = ff_element.getScreenCTM();

        var ff_svgGlobal = ff_svgPoint.matrixTransform(ctm.inverse());

        //var mouseCoords = d3.mouse(this)
        var mouseCoords = [ff_svgGlobal.x, ff_svgGlobal.y]
        , node = canvas2svgNode(mouseCoords)
        , transformedCoord = [mouseCoords[0]-stateFunc.data.adjX,mouseCoords[1]-stateFunc.data.adjY]
        , radiusSize = d3.min([Math.hypot(transformedCoord[0], transformedCoord[1]) , stateFunc.data.outerRingRadius]);
        draw();
        drawing.selectAll(".dark-orbit")
          .remove()

        drawing.append("circle")
          .classed("dark-orbit",true)
          .attr("r",radiusSize+"px")
          .attr("cx",0+"px")
          .attr("cy",0+"px")
          //.style("stroke-dasharray", "5,5")
          .transition()
          .duration(1000)
          .ease(Math.sqrt)
          .remove()

        drawRadiusScale()
        drawArrow(transformedCoord)
      }

      function drawRadiusScale(){
        var newScale = buildNewScale()
          , scaleType = stateFunc.data.rScale.type
          , midPointRule = {
            Linear: function(scale){return (scale.domain()[1]+scale.domain()[0])/2}
            , Log:  function(scale){return Math.sqrt(scale.domain()[1]*scale.domain()[0])}
          }
          , midPoint = midPointRule[scaleType](newScale);

        drawing.selectAll(".radius-scale-container")
        .remove()

        var scaleContainer = drawing.append("g")
        .classed("radius-scale-container",true);

        scaleContainer.append("g")
        .attr("transform","translate("+ -((stateFunc.data.outerRingRadius)/2)+","+ (stateFunc.data.outerRingRadius+20)+")")
        .classed("radius-scale-axis",true)
        .call(
            d3.axisBottom(newScale)
              .tickValues([ stateFunc.data.rScale.domain()[0], midPoint, stateFunc.data.rScale.domain()[1] ])
              .tickFormat(d3.format(".0s"))
              //.tickPadding(0)
            )
        .transition()
        .duration(1000)
        .ease(Math.sqrt)
        .remove();

        scaleContainer.append("g")
      }//drawRadiusScale()

      function buildNewScale(){
        var newScale = stateFunc.data.rScale.copy();
        newScale.domain([stateFunc.data.rScale.domain()[1],stateFunc.data.rScale.domain()[0]]).clamp(true)
        return newScale;
      }

      function drawArrow(transformedCoord){
        drawing.selectAll(".arrowContainer")
          .remove();

        var newScale = buildNewScale()
        // draw arrow
        var xValue = d3.min([d3.max([innerRadius, Math.hypot(transformedCoord[0], transformedCoord[1])]) , stateFunc.data.outerRadius]);

        d3.selectAll('.arrow-container').remove()

        var arrowContainer = drawing.append("g")
          .classed("arrow-container",true)
          .attr("transform","translate("+ -((stateFunc.data.outerRingRadius)/2)+","+ (stateFunc.data.outerRingRadius+20)+")");

        arrowContainer.append("path")
          .attr("transform","translate("+newScale(stateFunc.data.rScale.invert(xValue))+","+(-7)+") rotate(180)")
          .classed("arrow",true)
          .attr("d", d3.symbol()
             //.size()
             .type(d3.symbolTriangle)
           )
           //.attr("transform","rotate(90)")
           .transition()
           .duration(1000)
           .ease(Math.sqrt)
           .remove();

        var message_count = Math.floor(stateFunc.data.rScale.invert(xValue)).toLocaleString()
        arrowContainer.append("text")
          .attr("x",((stateFunc.data.outerRingRadius)/2)+10+"px")
          .attr("y",35+"px")
          .attr("text-anchor","middle")
          .attr("fill",stateFunc.data.simSetup.innerRingColor)
          .text(function(){
            var m1 = "{message-count} emails".replace("{message-count}",message_count)
              , m2 = "{message-count} email".replace("{message-count}",message_count)
              , message = (message_count=="1")?m2:m1;
            return message
          })
          .transition()
          .duration(1000)
          .ease(Math.sqrt)
          .remove();
      }
      function buildAnnotations(node,quadCoords){
        var svgCoords = canvas2svgCoords(node)
          , noteLocation = adjacentQuadrant(quadCoords)
          , locString = (node.geoip=="-1")?"an unknown":"a "+node.geoip
          , senderName = (node.sender_display_name=="-1")?"an unknown":"a "+node.sender_display_name
          , auth = node.auth;
        const annotations = [
          {
            //below in makeAnnotations has type set to d3.annotationLabel
            //you can add this type value below to override that default
            type: d3.annotationCalloutCircle,
            note: {
              label: "A total of {messageCount} messages were sent from {sender} sender in {loc} location.".replace("{messageCount}",node.message_count.toLocaleString()).replace("{loc}",locString).replace("{sender}",senderName)
              ,title: "IP Address Details:"
              ,wrap: 190
            },
            //settings for the subject, in this case the circle radius
            subject: {
              radius: 20
            },
            x: svgCoords[0],
            y: svgCoords[1],
            dx: stateFunc.data.outerRadius*noteLocation[0], //102
            dy: stateFunc.data.outerRadius*noteLocation[1]+ 0.25*stateFunc.data.outerRadius*Math.sign(noteLocation[1])//137,
          }].map(function(d){ d.color = "#E8336D"; return d})

        const makeAnnotations = d3.annotation()
          .type(d3.annotationLabel)
          .annotations(annotations);

        d3.select(".annotation-group")
          .remove()

        d3.select("svg")
          .append("g")
          .attr("class", "annotation-group")
          .call(makeAnnotations)
          .transition()
          .duration(1000)
          .ease(Math.sqrt)
          .style("opacity",0.40)
          .remove()
      }

      function canvas2svgNode(coords){
        return simulation.find(coords[0]-stateFunc.data.adjX,coords[1]-stateFunc.data.adjY)
      }
      function canvas2svgCoords(node){
        return [node.x+stateFunc.data.adjX, node.y+stateFunc.data.adjY]
      }
      function particle(m) {
        svg.insert("circle")
            .classed("anno",true)
            .attr("cx", m[0]+"px")
            .attr("cy", m[1]+"px")
            .attr("r", (1e-6)+"px")
            .style("stroke","#E8336D")
            //.style("stroke", d3.hsl((i = (i + 1) % 360), 1, .5))
            .style("fill","none")
            .style("stroke-opacity", 1)
          .transition()
            .duration(3000)
            .ease(Math.sqrt)
            .attr("r", 25+"px")
            .style("stroke-opacity", 1e-6)
            .remove();
        //d3.event.preventDefault();
      }
    })//selection()
  }//chart()
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
    step= s;
    return chart;
  };
  return chart
}
