
function Scroller(stateFunc){
  var iDispatch
    , simSetup
    , scroller;
  function chart(selection){
    // note: selection is passed in from the .call(iChartType), which is the same as myHeatmap(d3.select('.stuff')) -- ??
    //console.log(dataObject)
    // using d3 for convenience
		var container = d3.select('#scroll');
		var graphic = container.select('.scroll__graphic');
		var text = container.select('.scroll__text');
		var step = text.selectAll('.step');

		// initialize the scrollama
		var scroller = scrollama();
    iDispatch.on("resize", function() {
      scroller.resize();
    });
		// generic window resize listener event
		function handleResize() {
			// 1. update height of step elements
			var stepHeight = Math.floor(window.innerHeight * 0.75);
			step.style('height', stepHeight + 'px');
			// 2. update width/height of graphic element
			var bodyWidth = d3.select('body').node().offsetWidth;
			var graphicMargin = 16 * 4;
			var textWidth = text.node().offsetWidth;
			var graphicWidth = container.node().offsetWidth - textWidth - graphicMargin;
			//var graphicHeight = Math.floor(window.innerHeight / 2)
      var graphicHeight = Math.floor(window.innerHeight * 0.90);
			var graphicMarginTop = Math.floor(graphicHeight / 2);

			graphic
				.style('width', graphicWidth + 'px')
				.style('height', graphicHeight + 'px')
			// 3. tell scrollama to update new element dimensions
			scroller.resize();
		}//handleResize()
		// scrollama event handlers
    function handleStepProgress(response) {
    /*
      var el = d3.select(response.element);

      var val = el.attr('data-step');
      var rgba = 'rgba(' + val + ', ' + response.progress + ')';
      el.style('background-color', rgba);
      el.select('.progress').text(d3.format('.1%')(response.progress))
    */
      //console.log(response.progress)
      stateFunc.data.step = response.index;
      stateFunc.data.progress = response.progress;
      iDispatch.call("step-progress", this, response.index, response.progress)
      iDispatch.call("step-progress2", this, response.index, response.progress)

    }
		function handleStepEnter(response) {
      stateFunc.data.scrollDiretion = response.direction
			// response = { element, direction, index }
			// add color to current step only
			step.classed('is-active', function (d, i) {
				return i === response.index;
			})
      step.classed('fade', function (d, i) {
        return i != response.index;
      })
			// update graphic based on step
			//graphic.select('p').text(response.index + 1);
      //console.log(response.index)
      //console.log(response)
      //console.log("----")
      stateFunc.data.step = response.index;
      iDispatch.call("step-change",this, response.index)
		}//handleStepEnter()

		function handleContainerEnter(response) {
			// response = { direction }
			// old school
			// sticky the graphic
			graphic.classed('is-fixed', true);
			graphic.classed('is-bottom', false);
		}//handleContainerEnter()
		function handleContainerExit(response) {
			// response = { direction }
			// old school
			// un-sticky the graphic, and pin to top/bottom of container
			graphic.classed('is-fixed', false);
			graphic.classed('is-bottom', response.direction === 'down');
		}//handleContainerExit()
		function init() {
			// 1. force a resize on load to ensure proper dimensions are sent to scrollama
			handleResize();
			// 2. setup the scroller passing options
			// this will also initialize trigger observations
			// 3. bind scrollama event handlers (this can be chained like below)
			scroller.setup({
				container: '#scroll',
				graphic: '.scroll__graphic',
				text: '.scroll__text',
				step: '.scroll__text .step',
        progress: true,
				debug: false,
				offset: 0.75,
			})
				.onStepEnter(handleStepEnter)
				.onContainerEnter(handleContainerEnter)
				.onContainerExit(handleContainerExit)
        .onStepProgress(handleStepProgress);
			// setup resize event
			window.addEventListener('resize', handleResize);
		}//init()
		// kick things off
		init();

  // end chart
  }
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
  chart.scroller = function(s) {
    if (!arguments.length) { return scroller; }
    scroller = s;
    return chart;
  };
  return chart
}
