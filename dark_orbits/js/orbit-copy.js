
function Orbit(){
  var svg
    , xScale = d3.scaleLinear().domain([0, 9]).range([180, 240])
    , colorScale = d3.scaleLinear().domain([0, 9]).range(["brown", "steelblue"])
    , nodes, node, simulation
    , iDispatach;

  function chart(selection){
    // note: selection is passed in from the .call(iChartType), which is the same as myHeatmap(d3.select('.stuff')) -- ??
    // using d3 for convenience
    vizSetup();

    function vizSetup(){
      nodes = [].concat(
        d3.range(80).map(function() { return {type: "a"}; }),
        d3.range(160).map(function() { return {type: "b"}; })
      );

      node = d3.select("svg")
        .append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
          .classed("ip-address",true)
          .attr("r", 2.5)
          .attr("fill", "gray")

      simulation = d3.forceSimulation(nodes)
          .force("charge", d3.forceCollide().radius(5))
          .force("r", d3.forceRadial(function(d) { return d.type === "a" ? 100 : 200; }))
          .on("tick", ticked);
    }
    // decide how to apply forceSimulation
    function ticked() {
      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }
  // end chart
  }
  chart.iDispatch = function(d) {
    if (!arguments.length) { return iDispatch; }
    iDispatch = d;
    return chart;
  };
  return chart
}
