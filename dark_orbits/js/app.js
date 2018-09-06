(function() {
  var stateFunc = {
    getter(v){console.log(stateFunc.data[v.name])}
    , setter(v){console.log(stateFunc.data[v.name])}
    , data:{
        intelColorScale: d3.scaleSequential(d3.interpolateInferno).domain([0,1]).clamp(true)
        , strokeColorScale: d3.scaleLinear().domain([0.90,1.0]).range(["#edf8fb", "#2B3033"]).clamp(true)//d3.scaleSequential(d3.interpolateGreys).domain([0.40,0.50]).clamp(true)
        , geoIntelPercent: {"pass":0.75, "fail":0.30}
        , ipRepIntelPercent: {"pass":0.75, "fail":0.00}
        , senderIntelPercent: {"pass":0.30, "fail":0.00}
        , dmarcIntelPercent: {"pass":1.00, "fail":0.00}
        , totalSteps: d3.selectAll('.step').size()
        , lineWidthFactor: 1.2
        , progress: 0
        , ipRepThreshold: 40
        , authCount: {
          authorized:0
          , unauthorized:0
          ,tbd:0
        }
    }
  };
  // call the heatmap constructor
  stateFunc.data.dispatch = d3.dispatch("step-change"
    ,"step-progress"
    ,"step-progress2"
    ,"resize"
    ,"update-legend"
    ,"redraw-legend")
  stateFunc.data.simSetup = {
    "nodeRadius":5
    , "nodeStrokeColor": "#edf8fb"
    , "nodeFillColor": "#2B3033"
    , "authorizedNodeColor": '#5df500'
    , "lineWidth":1
    , "lineWidthFactor": 1.2
    , "forceCollideRadius": 5
    , "alphaDecay": 0.065
    , "alphaMin": 0.1
    , "radiusFactor": 0.25
    , "alphaTarget":0.101
    , innerRingColorScale: d3.scaleLinear().domain([0,1]).range(["#E8336D","#edf8fb"]).clamp(true)
    , "innerRingColor": "#edf8fb"//d3.rgb(222, 231, 75, 0.75)
    , "outerRingColor": "#edf8fb"//d3.rgb(246, 128, 16, 0.83)
    , "annotationColor": "#E8336D"//"#dee74b" //"#6ab39b"
    , "annotationAlign": "center"
    , "annotationTextBaseline": "middle"
    , "annotationFont": '20px Helvetica' //'1.5VW BebasNeue Regular'
    , "genFont": '20px Helvetica'//'1.5VW Share Tech Mono'
    , "genFontColor": "#edf8fb"
    , "genFontAlign": "left"
    , "nullColor": d3.rgb(255, 255, 255, 0)
    , "lineDash": [5, 5]
    , "badRep": d3.rgb(226, 46, 49, 0.9)
    }
    ;
  var iScroller = Scroller(stateFunc)
    , iOrbit = Orbit(stateFunc)
    , iActs = Acts(stateFunc)
    , iGradient = GradientLegend(stateFunc)
    //, iCounter = Counter(stateFunc)
    //, iLegend = Legend(stateFunc)
    , dispatch = d3.dispatch("step-change","step-progress","step-progress2","resize","varUpdate")
    , simSetup =     {
        "nodeRadius":5
        , "nodeStrokeColor": "#edf8fb"
        , "nodeFillColor": "#2B3033"
        , "authorizedNodeColor": '#5df500'
        , "lineWidth":1
        , "forceCollideRadius": 5
        , "alphaDecay": 0.065
        , "alphaMin": 0.1
        , "radiusFactor": 0.25
        , "alphaTarget":0.1
        , "innerRingColor": "#E8336D"//d3.rgb(222, 231, 75, 0.75)
        , "outerRingColor": "#E8336D"//d3.rgb(246, 128, 16, 0.83)
        , "annotationColor": "#6ab39b"
        , "annotationAlign": "center"
        , "annotationTextBaseline": "middle"
        , "annotationFont": '1.5VW Share Tech Mono'
        , "genFont": '1.5VW Share Tech Mono'
        , "genFontColor": "#edf8fb"
        , "genFontAlign": "left"
        , "nullColor": d3.rgb(255, 255, 255, 0)
        , "lineDash": [5, 5]
        , "badRep": d3.rgb(226, 46, 49, 0.9)
        }
        ;
  //var myCopy = Object.assign({},myVar)
  var instances = [iOrbit,iScroller,iActs];
  // Setup instances w/ dispatch
  instances.forEach(function(d,i){
    //console.log(i)
    d.iDispatch(dispatch)
    d.simSetup(simSetup)
  })

 // list data files
  var files = ["data/dark_orbits_v2.csv"]
    , promises = [];

  // get data in v5
  files.forEach(function(url) {
      var ext = url.split(".").pop()
        , parser = (ext=="csv")? d3.csv:d3.json;
      promises.push(parser(url))
  });

  // get data
  Promise.all(promises).then(runApp)

  function runApp(d){
    var clientData = d[0].map(function(e){
      var side = ((Math.random()<0.60)&(+e.ip_reputation>40))?1:-1
      return {
        "ip_address":e.ip_address
        , "bucket_id":+e.bucket_id
        , "message_count":+e.message_count
        , "geoip": e.geoip
        , "ip_reputation": +e.ip_reputation
        , "max_auth_date": new Date(e.max_auth_date)
        , "sender_id": +e.sender_id
        , "sender_display_name": e.sender_display_name
        , "gridSide": side
        , dkim_alignment: +e.dkim_alignment
        , dkim_pass_fail:	+e.dkim_pass_fail
        , spf_alignment: +e.spf_alignment
        , spf_pass_fail: +e.spf_pass_fail
        , intel: intelScore(e, stateFunc)
      };
    })
    var incrementer = {
      tbd: res => stateFunc.data.authCount["tbd"]++
      , unauthorized:  res => stateFunc.data.authCount["unauthorized"]++
      , authorized: res => stateFunc.data.authCount["authorized"]++
    }
    //incrementer[score.auth](d)
    clientData.forEach( function(d,i){
       stateFunc.data.authCount[d.intel.auth]++
    })
    clientData.map(function(d,i){
      var val = null;
      if(d.intel.auth=="tbd"){
        val =(Math.random()>0.40)?"authorized":"unauthorized";
      }
      d.intel.tbdAuth = val
      return d
    })
    function createAuth(){
      var auth = (Math.random()>0.40)?"authorized":"unauthorized";
      return auth;
    }
    var gridSideCount = d3.nest()
      .key(function(d) {
        return d.gridSide;
      })
      // .key(function(d) { return d.priority; })
      .rollup(function(leaves) {
        return leaves.length;
      })
      .entries(clientData);

    stateFunc.data.clientData = clientData;
    stateFunc.data.step = 0;
    stateFunc.data.percentUnknown = 1;
    // set values for data specific vars

    var messageExtent = d3.extent(clientData, d=>d.message_count)
      , maxRound = Math.floor(messageExtent[1])
      , minRound = Math.floor(messageExtent[0])
      , maxDigits = String(maxRound).length
      , minDigits = String(minRound).length
      , maxValue = + ("1"+"0".repeat(maxDigits))
      , minValue = + ("1"+"0".repeat(d3.min(0,minDigits -1)))
      , rScaleLinear = d3.scaleLinear()
          .domain([maxValue, minValue])
      , rScaleLog = d3.scaleLog()
          .domain([maxValue, minValue])
      , senderKey = getUniqueSenders(clientData)
      , rScale = rScaleLinear;

    stateFunc.data.messageCountExtent = d3.extent(clientData, d=>d.message_count)
    stateFunc.data.maxRound = Math.floor(messageExtent[1])
    stateFunc.data.minRound = Math.floor(messageExtent[0])
    stateFunc.data.maxDigits = String(maxRound).length
    stateFunc.data.minDigits = String(minRound).length
    stateFunc.data.maxValue = + ("1"+"0".repeat(maxDigits))
    stateFunc.data.minValue = + ("1"+"0".repeat(d3.min(0,minDigits -1)))
    stateFunc.data.rScaleLinear = d3.scaleLinear()
        .domain([maxValue, minValue])
    stateFunc.data.rScaleLog = d3.scaleLog()
        .domain([maxValue, minValue])
    stateFunc.data.senderKey = getUniqueSenders(clientData)
    stateFunc.data.rScale = rScaleLinear

    // update instances with correct variables
    iOrbit.rScaleLinear(rScaleLinear)
    iOrbit.rScaleLog(rScaleLog)

    // pack data for each client
    var full_set = [
      {
      "client":clientData
      , "senderKey":senderKey
      , "sideCount": gridSideCount
      }
    ]

    var container = d3.select("#run-script");
    container.call(iScroller);
    d3.select("#orbit").selectAll("canvas")
        .data(full_set).enter()
        .append("canvas")
        .attr('id',"viz-canvas")
        .call(iOrbit);

    instances.forEach(function(d,i){
      if (i==2){
        d.simulation(iOrbit.simulation())
        d.outerRadius(iOrbit.outerRadius())
        d.innerRadius(iOrbit.innerRadius())
        d.rScale(iOrbit.rScale())
      }
    })//instance.forEach()
    //iCounter.outerRadius(outerRadius)

    var initialSvg = d3.select("#orbit").selectAll("svg")
        .data(full_set).enter()
        .insert("svg",":first-child")
        .attr("id","viz-svg")
        .attr("height",iOrbit.height())
        .attr("width",iOrbit.width());

    initialSvg.call(iGradient).call(iActs)
        //.call(iCounter)
        //.call(iLegend)

    function unique(a){
      return a.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
    }

    function getUniqueSenders(clientData){
      var senders = [];
      clientData.forEach(d => senders.push(d.sender_display_name))
      return unique(senders)
    }

    dispatch.on("varUpdate",function(outerRadius, innerRadius, rScale, step){
      //console.log("varUpdate HIT.")
      // RUN RE-DRAW on each
      /*
      instances.forEach(function(d,i){
        if ((i==2)||(i==3)){
          //console.log("updating iActs")
          d.outerRadius(outerRadius)
          d.innerRadius(innerRadius)
          d.rScale(rScale)
          d.step(step)
        }

      })//instance.forEach()
            */
    }) //dispatch.on()
    //console.log(stateFunc.data.authCount)
  }//runApp()
  function authorization(d,score){
    var threshold = stateFunc.data.ipRepThreshold
      , rep = (d.ip_reputation < threshold)?"bad":"notBad"
      , singlePass = (((d.dkim_alignment==1)&(d.dkim_pass_fail==1))||((d.spf_alignment==1)&(d.spf_pass_fail)))?1:0
      , doublePass = (((d.dkim_alignment==1)&(d.dkim_pass_fail==1))&((d.spf_alignment==1)&(d.spf_pass_fail)))?1:0
      , value = d3.sum([singlePass,doublePass])
      , test = {0: "issues", 1:"single-pass",2:"double-pass"}
      , res = rep+"-"+test[value]
      , translate = {
        "bad-issues": d=>"unauthorized"
        , "bad-single-pass": d=>"authorized"
        , "bad-double-pass": d=>"authorized"
        , "notBad-single-pass": d=>"authorized"
        , "notBad-double-pass": d=>"authorized"
        , "notBad-issues": function(d){
          if(sumIntel(d)<1){
            return "tbd"
          }else if(d.geo==stateFunc.data.geoIntelPercent.pass){
            return "unauthorized"
          }else{
            return "authorized"
          }//else
        }//anonymous function
      }
      , label = translate[res](score)
      return label
  }
  function intelScore(d, stateFunc){
    var score = {"geo":0, "ipRep":0, "sender":0, "dmarc":0}
      , flagged = ["Vietnam","Thailand","Ukraine","Latvia","Mauritius"];
    score.geo = (flagged.includes(d.geoip))?stateFunc.data.geoIntelPercent.pass:stateFunc.data.geoIntelPercent.fail;
    score.ipRep = ((d.ip_reputation<40)||(d.ip_reputation>80))?stateFunc.data.ipRepIntelPercent.pass:stateFunc.data.ipRepIntelPercent.fail;
    score.sender = (d.sender_display_name!="-1")?stateFunc.data.senderIntelPercent.pass:stateFunc.data.senderIntelPercent.fail;
    score.dmarc = (((d.dkim_alignment==1)&(d.dkim_pass_fail==1))||((d.spf_alignment==1)&(d.spf_pass_fail)))?stateFunc.data.dmarcIntelPercent.pass:stateFunc.data.dmarcIntelPercent.fail;
    score.auth = authorization(d,score)
    /*
    var incrementer = {
      tbd: res => stateFunc.data.authCount["tbd"]++
      , unauthorized:  res => stateFunc.data.authCount["unauthorized"]++
      , authorized: res => stateFunc.data.authCount["authorized"]++
    }
    incrementer[score.auth](d)
    */
    return score;
  }
  function sumIntel(score){
    return d3.sum([score.geo,score.ipRep,score.sender,score.dmarc])
  }
}())
