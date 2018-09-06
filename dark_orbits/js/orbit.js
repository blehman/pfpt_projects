function Orbit(stateFunc){
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
    , canvas
    , ctx
    , width
    , height
    , outerRadius
    , outerRadius2
    , innerRadius2
    , k
    , client
    , run
    , simDelta
    , gridLength
    , adjX
    , adjY
    , nodeRadius = d3.scaleOrdinal().domain([1,2,3,4,5]).range([1,1,5,5,5])
    , scroller
    , progress = 0.0
    , progressScale = d3.scaleLinear().domain([0.0,0.6]).range([0,1]).clamp(true)
    , drawLogic
    , legendMargins
    , step = 0;

  function chart(selection){
    // note: selection is passed in from the .call(iChartType), which is the same as myHeatmap(d3.select('.stuff')) -- ??
    // using d3 for convenience
    selection.each(function(dataObject){
      //console.log(dataObject)
      drawLogicNode = {
        true: drawNode
        , false: _nada_
      }
      drawLogicSquare = {
        true: drawSquare
        , false: _nada_
      }
      // get [min,max] message counts
      messageExtent = d3.extent(dataObject.client,d=>d.message_count)

      //creat the pen that will draw on the canvas
      canvas = document.querySelector("canvas")
      ctx = canvas.getContext("2d")
      ctx.globalAlpha = 0;
      // draw stuff
      buildSim();
      iDispatch.on("step-progress2",function(currentStep, currentProgress){
        progress = currentProgress;
        stepHandler["step"+ currentStep]()
      })

      window.onresize = function() {
        clearTimeout(run);
        run = setTimeout(function() {
          //create the pen that will draw on the canvas
          fitToContainer(canvas)
          //iDispatch.call("varUpdate",this,outerRadius, innerRadius, stateFunc.data.rScale, step)
          stateFunc.data.dispatch.call("redraw-legend")
          iDispatch.call("resize")
          // reheat sim
          stepHandler["step"+ step]()

        }, 100);
      };

      stepHandler = {
        "step0":blackhole
        , "step1":blackhole
        , "step2":blackholeLabel  //blackholeSpectrum
        , "step3":center
        , "step4":coronaLinear      //blackholeRing
        , "step5":coronaLog
        , "step6":coronaLog
        , "step7":coronaGeo
        , "step8":coronaIP
        , "step9":coronaSender
        , "step10":coronaDMARC
        , "step11":bucketSim2_
        , "step12":tbd__
        , "step13":authorize_
      }

      iDispatch.on("step-change", function(i){
        step = i;
        stateFunc.data.step = step;
        var stepName = stepHandler["step"+ step].name ;
        //console.log(stepName)
        stepHandler["step"+ step]()
        stateFunc.data.dispatch.call("update-legend",this,step)
      })

      function _nada_(){
      }

      function intelArray(d){
        var s = "step"+stateFunc.data.step
          , intel = intelScore(d)
          , geo = intel => [intel.geo]
          , geoIPRep = intel => [intel.geo, intel.ip_reputation]
          , geoIPRepSender = intel => [intel.geo, intel.ip_reputation, intel.sender ]
          , intelStep =
            {
              "step0":0
              , "step1":0
              , "step2":0
              , "step3":0
              , "step4":0
              , "step5":geo
              , "step6":geoIPRep
              , "step7":geoIPRepSender
              , "step8":geoIPRepSender
              , "step9":geoIPRepSender
              , "step10":geoIPRepSender
              , "step11":geoIPRepSender
            };
          return intelStep(s)(intel)
      }
      function blackhole(){
        ctx.globalAlpha = 1;
        simDelta = {
            "x": d3.forceX(-500).strength(0)
          , "y": d3.forceY(-500).strength(0)
          , "tick": ipAddressLabelTick2
          , "center":d3.forceCenter(0,0)
          , "r": d3.forceRadial(0.0).strength(5)
          , "charge": d3.forceCollide().radius(0.0)
          , "alphaDecay": 0.0001
          , "alphaMin": simSetup.alphaMin
          , "alphaTarget": 0
        }
        changeSim(simDelta)
      }
      function blackholeLabel(){
        ctx.globalAlpha = 1;
        simDelta = {
            "x": d3.forceX(-500).strength(0)
          , "y": d3.forceY(-500).strength(0)
          , "tick": ipAddressLabelTick
          , "center":d3.forceCenter(0,0)
          , "r": d3.forceRadial(0.0).strength(5)
          , "charge": d3.forceCollide().radius(0.0)
          , "alphaDecay": 0.0001
          , "alphaMin": simSetup.alphaMin
          , "alphaTarget": 0
        }
        changeSim(simDelta)
      }
      function isolate(force, filter) {
        var initialize = force.initialize;
        force.initialize = function() { initialize.call(force, dataObject.client.filter(filter)); };
        return force;
      }
      function addFriendFoeTxt(){
        var len = dataObject.client.length
          , progressIndex = Math.ceil(progressScale(stateFunc.data.progress)*len)
          , adj = (stateFunc.data.adjY - stateFunc.data.outerRingRadius)/4
          , squareWidth = 2*stateFunc.data.simSetup.nodeRadius
          , outerMargin = 20
          , leftStartPoint = (-1*(stateFunc.data.adjX-outerMargin))
          , rightStartPoint = (stateFunc.data.adjX-outerMargin)
          , innerMargin = 20
          , baseWidth = stateFunc.data.adjX-outerMargin-innerMargin
          , baseCount = Math.floor(baseWidth/(squareWidth))
          , friendCoords = [leftStartPoint+(baseWidth/2), stateFunc.data.outerRingRadius+(adj*2+10)]
          , foeCoords = [rightStartPoint-(baseWidth/2), stateFunc.data.outerRingRadius+(adj*2)+10];
        // inner circle text
        ctx.beginPath();
        ctx.font = stateFunc.data.simSetup.annotationFont
        ctx.fillStyle = stateFunc.data.simSetup.innerRingColor;
        ctx.textAlign = stateFunc.data.simSetup.annotationAlign;
        ctx.textBaseline = stateFunc.data.simSetup.annotationTextBaseline;
        ctx.fillText("Friend",friendCoords[0],friendCoords[1])

        // outer circle text
        ctx.beginPath();
        ctx.font = stateFunc.data.simSetup.annotationFont
        ctx.fillStyle = stateFunc.data.simSetup.outerRingColor;
        ctx.textAlign = stateFunc.data.simSetup.annotationAlign;
        ctx.textBaseline = stateFunc.data.simSetup.annotationTextBaseline;
        ctx.fillText("Foe",foeCoords[0],foeCoords[1])

      }
      function bucketSim2_(){
        ctx.globalAlpha = 1;
        var len = dataObject.client.length
          , progressIndex = Math.ceil(progressScale(stateFunc.data.progress)*len)
          , adj = (stateFunc.data.adjY - stateFunc.data.outerRingRadius)/4
          , yAuthCounter = {
            "authorized": -1
            , "unauthorized":-1
          }
          , xAuthCounter = {
            "authorized": -1
            , "unauthorized":-1
          }
          , squareWidth = 2*stateFunc.data.simSetup.nodeRadius
          , outerMargin = 20
          , leftStartPoint = (-1*(stateFunc.data.adjX-outerMargin))
          , rightStartPoint = (stateFunc.data.adjX-outerMargin)
          , innerMargin = 20
          , baseWidth = stateFunc.data.adjX-outerMargin-innerMargin
          , baseCount = Math.floor(baseWidth/(squareWidth))
          , yRow = {
              "authorized":0
              , "unauthorized":0
          }
          , xCol = {
              "authorized":0
              , "unauthorized":0
          }
          , simDelta = {
              "x": isolate( d3.forceX(function(d,i){
                xAuthCounter[d.intel.auth]++
                //console.log(i,xAuthCounter[d.intel.auth],baseCount, (xAuthCounter[d.intel.auth]%baseCount==0))
                xCol[d.intel.auth] = incrementCol(d)
                return xCol[d.intel.auth]
              }).strength(0.01), (d,i) => (i<=progressIndex)&(d.intel.auth!="tbd") )
            , "y": isolate( d3.forceY().y(
                function(d,i){
                  yAuthCounter[d.intel.auth]++
                  yRow[d.intel.auth] = (yAuthCounter[d.intel.auth]%baseCount==0)?(yRow[d.intel.auth]-squareWidth):yRow[d.intel.auth]
                  return yRow[d.intel.auth]+(stateFunc.data.outerRingRadius + adj*2)
                })
                .strength(0.01), (d,i) => (i<=progressIndex)&(d.intel.auth!="tbd") )
            , "tick": colorFullInel__
            , "center": null//d3.forceCenter(0,0)
            //, "center": isolate(d3.forceCenter(0,0), (d,i) => ((i<=progressIndex)||d.intel.auth=="tbd"))
            , "r": isolate(
              d3.forceRadial(function(d) { return stateFunc.data.rScale(d.message_count) }).strength(0.10)
            , (d,i)=>((i>progressIndex)||(d.intel.auth=="tbd")))
            , "charge": isolate(d3.forceCollide().radius(simSetup.forceCollideRadius).strength(0.90), (d,i)=>((i>progressIndex)||(d.intel.auth=="tbd")))
            , "alphaDecay": simSetup.alphaDecay
            , "alphaMin": simSetup.alphaMin
            , "alphaTarget": simSetup.alphaTarget
          }
        changeSim(simDelta)

        function incrementCol(d){
          var  xVal = {
            "authorized":d => (xAuthCounter[d.intel.auth]%baseCount==0)?leftStartPoint:(xCol[d.intel.auth]+squareWidth)
            , "unauthorized":d => (xAuthCounter[d.intel.auth]%baseCount==0)?rightStartPoint:(xCol[d.intel.auth]-squareWidth)
            }
          //console.log("{start} | {auth}: {value}".replace("{start}",xAuthCounter[d.intel.auth]%baseCount==0).replace("{auth}",d.intel.auth).replace("{value}",xVal[d.intel.auth](d)))
          return xVal[d.intel.auth](d)
        }
      }//bucketSim2_()
      function tbd__(){
        ctx.globalAlpha = 1;
        var len = dataObject.client.length
          , progressIndex = Math.ceil(progressScale(stateFunc.data.progress)*len)
          , adj = (stateFunc.data.adjY - stateFunc.data.outerRingRadius)/4
          , yAuthCounter = {
            "authorized": -1
            , "unauthorized":-1
          }
          , xAuthCounter = {
            "authorized": -1
            , "unauthorized":-1
          }
          , squareWidth = 2*stateFunc.data.simSetup.nodeRadius
          , outerMargin = 20
          , leftStartPoint = (-1*(stateFunc.data.adjX-outerMargin))
          , rightStartPoint = (stateFunc.data.adjX-outerMargin)
          , innerMargin = 20
          , baseWidth = stateFunc.data.adjX-outerMargin-innerMargin
          , baseCount = Math.floor(baseWidth/(squareWidth))
          , yRow = {
              "authorized":0
              , "unauthorized":0
          }
          , xCol = {
              "authorized":0
              , "unauthorized":0
          }
          , tbd_authorized_xCol_leftStartPoint = leftStartPoint + ((stateFunc.data.authCount.authorized%baseCount)*squareWidth)
          , tbd_authorized_xCol_rightStartPoint = rightStartPoint - ( ((stateFunc.data.authCount.unauthorized%baseCount)-1)*squareWidth)
          , tbd_authorized_yRow_start = -1*Math.ceil(stateFunc.data.authCount.authorized/baseCount)*squareWidth
          , tbd_unathorized_yRow_start = -1*Math.ceil(stateFunc.data.authCount.unauthorized/baseCount)*squareWidth
          , tbdxCol = {
              "authorized":tbd_authorized_xCol_leftStartPoint-(1*squareWidth)
              , "unauthorized":tbd_authorized_xCol_rightStartPoint
          }
          , tbdyRow = {
              "authorized":tbd_authorized_yRow_start
              , "unauthorized":tbd_unathorized_yRow_start
          }
          , tbdyAuthCounter = {
            "authorized": stateFunc.data.authCount.authorized-1
            , "unauthorized":stateFunc.data.authCount.unauthorized-1
          }
          , tbdxAuthCounter = {
            "authorized": stateFunc.data.authCount.authorized-1
            , "unauthorized": stateFunc.data.authCount.unauthorized-1
          }
          , simDelta = {
              "x": isolate( d3.forceX(function(d,i){
                if (d.intel.auth!="tbd"){
                  xAuthCounter[d.intel.auth]++
                  //console.log(i,xAuthCounter[d.intel.auth],baseCount, (xAuthCounter[d.intel.auth]%baseCount==0))
                  xCol[d.intel.auth] = incrementCol(d)
                  return xCol[d.intel.auth]
                }else {
                  tbdxAuthCounter[d.intel.tbdAuth]++
                  //console.log(i,xAuthCounter[d.intel.auth],baseCount, (xAuthCounter[d.intel.auth]%baseCount==0))
                  tbdxCol[d.intel.tbdAuth] = tbdincrementCol(d)
                  return tbdxCol[d.intel.tbdAuth]
                }
              }).strength(0.01), (d,i) => ( (d.intel.auth!="tbd")||((d.intel.auth=="tbd")&(i<=progressIndex)) ) )
            , "y": isolate( d3.forceY().y(
                function(d,i){
                  if (d.intel.auth!="tbd"){
                    yAuthCounter[d.intel.auth]++
                    yRow[d.intel.auth] = (yAuthCounter[d.intel.auth]%baseCount==0)?(yRow[d.intel.auth]-squareWidth):yRow[d.intel.auth]
                    return yRow[d.intel.auth]+(stateFunc.data.outerRingRadius + adj*2)
                  }else {
                    tbdyAuthCounter[d.intel.tbdAuth]++
                    tbdyRow[d.intel.tbdAuth] = (tbdyAuthCounter[d.intel.tbdAuth]%baseCount==0)?(tbdyRow[d.intel.tbdAuth]-squareWidth):tbdyRow[d.intel.tbdAuth]
                    return tbdyRow[d.intel.tbdAuth]+(stateFunc.data.outerRingRadius + adj*2)
                  }
                })
                .strength(0.01), (d,i) => ( (d.intel.auth!="tbd")||((d.intel.auth=="tbd")&(i<=progressIndex)) ))
            , "tick": colorFullInel__
            , "center": null
            //, "center": isolate(d3.forceCenter(0,0), (d,i) => ((i<=progressIndex)||d.intel.auth=="tbd"))
            , "r": isolate(
              d3.forceRadial(function(d) { return stateFunc.data.rScale(d.message_count) }).strength(0.10)
            , (d,i)=>((d.intel.auth=="tbd")&(i>progressIndex)))
            , "charge": isolate(d3.forceCollide().radius(simSetup.forceCollideRadius).strength(0.30), (d,i)=>((d.intel.auth=="tbd")&(i>progressIndex)))
            , "alphaDecay": simSetup.alphaDecay
            , "alphaMin": simSetup.alphaMin
            , "alphaTarget": simSetup.alphaTarget
          }
        changeSim(simDelta)
        function incrementCol(d){
          var  xVal = {
            "authorized":d => (xAuthCounter[d.intel.auth]%baseCount==0)?leftStartPoint:(xCol[d.intel.auth]+squareWidth)
            , "unauthorized":d => (xAuthCounter[d.intel.auth]%baseCount==0)?rightStartPoint:(xCol[d.intel.auth]-squareWidth)
            }
          //console.log("{start} | {auth}: {value}".replace("{start}",xAuthCounter[d.intel.auth]%baseCount==0).replace("{auth}",d.intel.auth).replace("{value}",xVal[d.intel.auth](d)))
          return xVal[d.intel.auth](d)
        }
        function tbdincrementCol(d){
          var  xVal = {
            "authorized":d => (tbdxAuthCounter[d.intel.tbdAuth]%baseCount==0)?leftStartPoint:(tbdxCol[d.intel.tbdAuth]+squareWidth)
            , "unauthorized":d => (tbdxAuthCounter[d.intel.tbdAuth]%baseCount==0)?rightStartPoint:(tbdxCol[d.intel.tbdAuth]-squareWidth)
            }
          //console.log("{start} | {auth}: {value}".replace("{start}",xAuthCounter[d.intel.auth]%baseCount==0).replace("{auth}",d.intel.auth).replace("{value}",xVal[d.intel.auth](d)))
          return xVal[d.intel.tbdAuth](d)
        }
      }//tbd__()
      function authorize_(){
        ctx.globalAlpha = 1;
        var len = dataObject.client.length
          , progressIndex = Math.ceil(progressScale(stateFunc.data.progress)*len)
          , adj = (stateFunc.data.adjY - stateFunc.data.outerRingRadius)/4
          , yAuthCounter = {
            "authorized": -1
            , "unauthorized":-1
          }
          , xAuthCounter = {
            "authorized": -1
            , "unauthorized":-1
          }
          , squareWidth = 2*stateFunc.data.simSetup.nodeRadius
          , outerMargin = 20
          , leftStartPoint = (-1*(stateFunc.data.adjX-outerMargin))
          , rightStartPoint = (stateFunc.data.adjX-outerMargin)
          , innerMargin = 20
          , baseWidth = stateFunc.data.adjX-outerMargin-innerMargin
          , baseCount = Math.floor(baseWidth/(squareWidth))
          , yRow = {
              "authorized":0
              , "unauthorized":0
          }
          , xCol = {
              "authorized":0
              , "unauthorized":0
          }
          , tbd_authorized_xCol_leftStartPoint = leftStartPoint + ((stateFunc.data.authCount.authorized%baseCount)*squareWidth)
          , tbd_authorized_xCol_rightStartPoint = rightStartPoint - ( ((stateFunc.data.authCount.unauthorized%baseCount)-1)*squareWidth)
          , tbd_authorized_yRow_start = -1*Math.ceil(stateFunc.data.authCount.authorized/baseCount)*squareWidth
          , tbd_unathorized_yRow_start = -1*Math.ceil(stateFunc.data.authCount.unauthorized/baseCount)*squareWidth
          , tbdxCol = {
              "authorized":tbd_authorized_xCol_leftStartPoint-(1*squareWidth)
              , "unauthorized":tbd_authorized_xCol_rightStartPoint
          }
          , tbdyRow = {
              "authorized":tbd_authorized_yRow_start
              , "unauthorized":tbd_unathorized_yRow_start
          }
          , tbdyAuthCounter = {
            "authorized": stateFunc.data.authCount.authorized-1
            , "unauthorized":stateFunc.data.authCount.unauthorized-1
          }
          , tbdxAuthCounter = {
            "authorized": stateFunc.data.authCount.authorized-1
            , "unauthorized": stateFunc.data.authCount.unauthorized-1
          }
          , simDelta = {
              "x": isolate( d3.forceX(function(d,i){
                if (d.intel.auth!="tbd"){
                  xAuthCounter[d.intel.auth]++
                  //console.log(i,xAuthCounter[d.intel.auth],baseCount, (xAuthCounter[d.intel.auth]%baseCount==0))
                  xCol[d.intel.auth] = incrementCol(d)
                  return xCol[d.intel.auth]
                }else {
                  tbdxAuthCounter[d.intel.tbdAuth]++
                  //console.log(i,xAuthCounter[d.intel.auth],baseCount, (xAuthCounter[d.intel.auth]%baseCount==0))
                  tbdxCol[d.intel.tbdAuth] = tbdincrementCol(d)
                  return tbdxCol[d.intel.tbdAuth]
                }
              }).strength(0.15), (d,i) => ( (d.intel.auth!="tbd")||((d.intel.auth=="tbd")) ) )
            , "y": isolate( d3.forceY().y(
                function(d,i){
                  if (d.intel.auth!="tbd"){
                    yAuthCounter[d.intel.auth]++
                    yRow[d.intel.auth] = (yAuthCounter[d.intel.auth]%baseCount==0)?(yRow[d.intel.auth]-squareWidth):yRow[d.intel.auth]
                    return yRow[d.intel.auth]+(stateFunc.data.outerRingRadius + adj*2)
                  }else {
                    tbdyAuthCounter[d.intel.tbdAuth]++
                    tbdyRow[d.intel.tbdAuth] = (tbdyAuthCounter[d.intel.tbdAuth]%baseCount==0)?(tbdyRow[d.intel.tbdAuth]-squareWidth):tbdyRow[d.intel.tbdAuth]
                    return tbdyRow[d.intel.tbdAuth]+(stateFunc.data.outerRingRadius + adj*2)
                  }
                })
                .strength(0.15), (d,i) => ( (d.intel.auth!="tbd")||((d.intel.auth=="tbd")) ))
            , "tick": colorFullInel__
            , "center": null
            //, "center": isolate(d3.forceCenter(0,0), (d,i) => ((i<=progressIndex)||d.intel.auth=="tbd"))
            , "r": null
            , "charge": null
            , "alphaDecay": simSetup.alphaDecay
            , "alphaMin": simSetup.alphaMin
            , "alphaTarget": simSetup.alphaTarget
          }
        changeSim(simDelta)
        function incrementCol(d){
          var  xVal = {
            "authorized":d => (xAuthCounter[d.intel.auth]%baseCount==0)?leftStartPoint:(xCol[d.intel.auth]+squareWidth)
            , "unauthorized":d => (xAuthCounter[d.intel.auth]%baseCount==0)?rightStartPoint:(xCol[d.intel.auth]-squareWidth)
            }
          //console.log("{start} | {auth}: {value}".replace("{start}",xAuthCounter[d.intel.auth]%baseCount==0).replace("{auth}",d.intel.auth).replace("{value}",xVal[d.intel.auth](d)))
          return xVal[d.intel.auth](d)
        }
        function tbdincrementCol(d){
          var  xVal = {
            "authorized":d => (tbdxAuthCounter[d.intel.tbdAuth]%baseCount==0)?leftStartPoint:(tbdxCol[d.intel.tbdAuth]+squareWidth)
            , "unauthorized":d => (tbdxAuthCounter[d.intel.tbdAuth]%baseCount==0)?rightStartPoint:(tbdxCol[d.intel.tbdAuth]-squareWidth)
            }
          //console.log("{start} | {auth}: {value}".replace("{start}",xAuthCounter[d.intel.auth]%baseCount==0).replace("{auth}",d.intel.auth).replace("{value}",xVal[d.intel.auth](d)))
          return xVal[d.intel.tbdAuth](d)
        }
      }//authorize_()
      function center(){
        simDelta = {
            "x": d3.forceX(-500).strength(0)
          , "y": d3.forceY(-500).strength(0)
          , "tick":drawInitial
          , "center": null //d3.forceCenter(0,0)
          , "r": d3.forceRadial(50).strength(0.02)
          , "charge": d3.forceCollide().radius(5).strength(0.3)
          , "alphaDecay": stateFunc.data.simSetup.alphaDecay
          , "alphaMin": stateFunc.data.simSetup.alphaMin
          , "alphaTarget": stateFunc.data.simSetup.alphaTarget
        }
        changeSim(simDelta)
      }
      function coronaLinear(){
        stateFunc.data.rScale = stateFunc.data.rScaleLinear
        simDelta = {
            "x": d3.forceX(-500).strength(0)
          , "y": d3.forceY(-500).strength(0)
          , "tick": drawInitialLabels
          , "center": d3.forceCenter(0,0)
          , "r": d3.forceRadial(function(d) { return stateFunc.data.rScale(d.message_count) })
          , "charge": d3.forceCollide().radius(simSetup.forceCollideRadius).strength(0.90)
          , "alphaDecay": stateFunc.data.simSetup.alphaDecay
          , "alphaMin": stateFunc.data.simSetup.alphaMin
          , "alphaTarget": stateFunc.data.simSetup.alphaTarget
        }
        changeSim(simDelta)
      } //corona()
      function coronaLog(){
        stateFunc.data.rScale = stateFunc.data.rScaleLog
        simDelta = {
            "x": d3.forceX(-500).strength(0)
          , "y": d3.forceY(-500).strength(0)
          , "tick": drawInitialLabels
          , "center": d3.forceCenter(0,0)
          , "r": d3.forceRadial(function(d) { return stateFunc.data.rScale(d.message_count) })
          , "charge": d3.forceCollide().radius(simSetup.forceCollideRadius).strength(0.90)
          , "alphaDecay": stateFunc.data.simSetup.alphaDecay
          , "alphaMin": stateFunc.data.simSetup.alphaMin
          , "alphaTarget": stateFunc.data.simSetup.alphaTarget
        }
        changeSim(simDelta)
      } //corona2()
      function coronaGeo(){
        stateFunc.data.rScale = stateFunc.data.rScaleLog
        simDelta = {
            "x": d3.forceX(-500).strength(0)
          , "y": d3.forceY(-500).strength(0)
          , "tick": colorGeoIntel_//colorSPF_
          , "center": d3.forceCenter(0,0)
          , "r": d3.forceRadial(function(d) { return stateFunc.data.rScale(d.message_count) })
          , "charge": d3.forceCollide().radius(simSetup.forceCollideRadius).strength(0.90)
          , "alphaDecay": stateFunc.data.simSetup.alphaDecay
          , "alphaMin": stateFunc.data.simSetup.alphaMin
          , "alphaTarget": stateFunc.data.simSetup.alphaTarget
        }
        changeSim(simDelta)
      } //coronoaSPF()
      function coronaIP(){
        stateFunc.data.rScale = stateFunc.data.rScaleLog
        simDelta = {
            "x": d3.forceX(-500).strength(0)
          , "y": d3.forceY(-500).strength(0)
          , "tick": colorIPInel_
          , "center": d3.forceCenter(0,0)
          , "r": d3.forceRadial(function(d) { return stateFunc.data.rScale(d.message_count) })
          , "charge": d3.forceCollide().radius(simSetup.forceCollideRadius).strength(0.90)
          , "alphaDecay": stateFunc.data.simSetup.alphaDecay
          , "alphaMin": stateFunc.data.simSetup.alphaMin
          , "alphaTarget": stateFunc.data.simSetup.alphaTarget
        }
        changeSim(simDelta)
      } //corona2()
      function coronaSender(){
        stateFunc.data.rScale = stateFunc.data.rScaleLog
        simDelta = {
            "x": d3.forceX(-500).strength(0)
          , "y": d3.forceY(-500).strength(0)
          , "tick": colorSenderInel_
          , "center": d3.forceCenter(0,0)
          , "r": d3.forceRadial(function(d) { return stateFunc.data.rScale(d.message_count) })
          , "charge": d3.forceCollide().radius(simSetup.forceCollideRadius).strength(0.90)
          , "alphaDecay": stateFunc.data.simSetup.alphaDecay
          , "alphaMin": stateFunc.data.simSetup.alphaMin
          , "alphaTarget": stateFunc.data.simSetup.alphaTarget
        }
        changeSim(simDelta)
      } //coronaIP()
      function coronaDMARC(){
        stateFunc.data.rScale = stateFunc.data.rScaleLog
        simDelta = {
            "x": d3.forceX(-500).strength(0)
          , "y": d3.forceY(-500).strength(0)
          , "tick": colorDMARC_
          , "center": d3.forceCenter(0,0)
          , "r": d3.forceRadial(function(d) { return stateFunc.data.rScale(d.message_count) })
          , "charge": d3.forceCollide().radius(simSetup.forceCollideRadius).strength(0.90)
          , "alphaDecay": stateFunc.data.simSetup.alphaDecay
          , "alphaMin": stateFunc.data.simSetup.alphaMin
          , "alphaTarget": stateFunc.data.simSetup.alphaTarget
        }
        changeSim(simDelta)
      } //coronaDMARC()
      function changeSim(delta){
        simulation.on("tick", delta.tick)
          .force("center", delta.center)
          .force("r", delta.r)
          .force("charge", delta.charge)
          .force("x", delta.x)
          .force("y", delta.y)
          .alphaDecay(delta.alphaDecay)
          .alphaMin(delta.alphaMin)
          .alphaTarget(delta.alphaTarget)
          .restart();

        stateFunc.data.step = step;
        var stepName = stepHandler["step"+ step].name ;
      }//changeSim()

/*
######################
######################
COLORING FUNCTIONS
######################
######################
*/
      function ipAddressLabelTick2(){
        clearSaveTranslateContext();

        ctx.beginPath();
        dataObject.client.forEach(drawSquare);
        ctx.lineWidth = stateFunc.data.simSetup.lineWidth;
        ctx.fillStyle = stateFunc.data.simSetup.nullColor;
        ctx.fill();
        ctx.strokeStyle = stateFunc.data.simSetup.nodeStrokeColor
        //ctx.fillStyle = simSetup.nodeStrokeColor
        ctx.stroke();
        ctx.restore();

      }//ipAddressLabelTick
      function ipAddressLabelTick(){
        clearSaveTranslateContext();

        ctx.beginPath();
        dataObject.client.forEach(drawSquare);
        ctx.lineWidth = stateFunc.data.simSetup.lineWidth;
        ctx.strokeStyle = stateFunc.data.simSetup.nodeStrokeColor
        //ctx.fillStyle = simSetup.nodeStrokeColor
        ctx.stroke();

        ctx.font = stateFunc.data.simSetup.annotationFont
        ctx.fillStyle = stateFunc.data.simSetup.annotationColor;
        ctx.fillText("IP address",0,-10);

        ctx.restore();
      }//ipAddressLabelTick

      function drawInitial(){
        clearSaveTranslateContext();
        for (var i = 0; i < 5; i++) {
          simulation.tick();
        }
        ctx.beginPath();
        dataObject.client.forEach(drawSquare);
        ctx.lineWidth = simSetup.lineWidth
        ctx.strokeStyle = simSetup.nodeStrokeColor;
        //ctx.fillStyle = simSetup.nodeFillColor
        //ctx.fill();
        ctx.stroke();

        ctx.restore();
      }//drawInitial()

      function addRings(){
        // inner circle text
        //ctx.moveTo(innerRadius+7,7)
        ctx.beginPath();
        ctx.font = stateFunc.data.simSetup.annotationFont
        ctx.fillStyle = stateFunc.data.simSetup.innerRingColor;
        ctx.textAlign = stateFunc.data.simSetup.annotationAlign;
        ctx.textBaseline = stateFunc.data.simSetup.annotationTextBaseline;
        ctx.fillText(abbreviateNumber(stateFunc.data.rScale.domain()[0]),0,1.5)
        //ctx.fillText(abbreviateNumber(rScale.domain()[0]),innerRadius+7,7);

        // draw inner circle
        ctx.beginPath();
        ctx.lineWidth = stateFunc.data.simSetup.lineWidth*2;
        ctx.strokeStyle = stateFunc.data.simSetup.innerRingColor;
        ctx.setLineDash(stateFunc.data.simSetup.lineDash);
        ctx.arc(0, 0, innerRadius, 0, 2 * Math.PI,false);
        ctx.stroke();

        // outer circle text
        //ctx.moveTo(innerRadius+7,7)
        ctx.beginPath();
        ctx.font = stateFunc.data.simSetup.annotationFont
        ctx.fillStyle = stateFunc.data.simSetup.outerRingColor;
        ctx.textAlign = stateFunc.data.simSetup.annotationAlign;
        ctx.textBaseline = stateFunc.data.simSetup.annotationTextBaseline;
        ctx.fillText(abbreviateNumber(stateFunc.data.rScale.domain()[1]),-stateFunc.data.outerRingRadius-20,0)
        //ctx.fillText(abbreviateNumber(rScale.domain()[1]),outerRadius+7,7);

        // draw outer circle
        ctx.beginPath();
        ctx.lineWidth = stateFunc.data.simSetup.lineWidth*2;
        ctx.setLineDash(stateFunc.data.simSetup.lineDash);
        ctx.strokeStyle = stateFunc.data.simSetup.outerRingColor;
        ctx.arc(0, 0, stateFunc.data.outerRingRadius, 0, 2 * Math.PI,false);
        ctx.stroke();

      }//addRings()

      function drawInitialLabels(){
        clearSaveTranslateContext();
        addRings();
        for (var i = 0; i < 5; i++) {
          simulation.tick();
        }
        // draw nodes
        ctx.beginPath();
        dataObject.client.forEach(drawSquare);
        ctx.lineWidth = simSetup.lineWidth
        ctx.setLineDash([])
        ctx.strokeStyle = simSetup.nodeStrokeColor;
        ctx.fillStyle = simSetup.nullColor;
        ctx.fill();
        ctx.stroke();

        //drawUnknownLegend();
        ctx.restore();
      }//drawInitialLabels()
      function drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor){
        var filteredData = dataObject.client.filter(filter)
          , len = filteredData.length
          , progressIndex = Math.ceil(progressScale(stateFunc.data.progress)*len)
          //, lessThan = function(){return filteredData.forEach(function(d,i){drawLogicSquare[i<=progressIndex](d)})}
          //, greaterThan = function(){return filteredData.forEach(function(d,i){ drawLogicSquare[i>progressIndex](d)})}
          //, none = function(){ return filteredData.forEach(drawSquare)}
          , stepName = stepHandler["step"+ step].name
          , percentProgress = (stateFunc.data.step+stateFunc.data.progress) / stateFunc.data.totalSteps
          , lessThan = function(){return filteredData.forEach(function(d,i){drawLogicSquare[i<=progressIndex](d)})}
          , greaterThan = function(){return filteredData.forEach(function(d,i){
            drawLogicSquare[i>progressIndex](d)
            /*
              if (stepName == "coronaGeo"){
                drawLogicSquare[i>progressIndex](d)
              }else{
                drawLogicSquare[i>progressIndex](d)
              }
            */
            })}
          , none = function(){ return filteredData.forEach(drawSquare)}
          , logic = {lessThan: lessThan
            , greaterThan: greaterThan
            , none: none};
        // color geo KNOWN nodes w/ percentage based logic on scroll
        ctx.beginPath();
        logic[logicType]()
        ctx.lineWidth = lineWidth
        ctx.setLineDash(lineDash)
        ctx.fillStyle = fillColor(stateFunc.data.progress)
        ctx.fill();
        ctx.strokeStyle = strokeColor(stateFunc.data.progress)
        ctx.stroke();
      }
      function colorGeoIntel_(){
        clearSaveTranslateContext();
        addRings();
        for (var i = 0; i < 5; i++) {
          simulation.tick();
        }
        var geoFAIL = stateFunc.data.geoIntelPercent.fail
          , geoPASS = stateFunc.data.geoIntelPercent.pass
          , ipFAIL = stateFunc.data.ipRepIntelPercent.fail
          , ipPASS = stateFunc.data.ipRepIntelPercent.pass
          , senderFAIL = stateFunc.data.senderIntelPercent.fail
          , senderPASS = stateFunc.data.senderIntelPercent.pass;
        // color geo nodes
        var logicType = "lessThan"
          , filter = d => (d.intel.geo==geoPASS)
          , fillColor = progress => stateFunc.data.intelColorScale(progressScale(progress)*geoPASS)
          , strokeColor = progress =>stateFunc.data.strokeColorScale(progressScale(progress)*geoPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS))
          , fillColor = progress => stateFunc.data.simSetup.nullColor
          , strokeColor = progress => stateFunc.data.simSetup.nodeStrokeColor
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        // color remaining nodes
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "lessThan"
          , filter = d => (d.intel.geo==geoFAIL)
          , fillColor = progress => stateFunc.data.intelColorScale(progressScale(progress)*geoFAIL)
          , strokeColor = progress =>stateFunc.data.strokeColorScale(progressScale(progress)*geoFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => (d.intel.geo==geoFAIL)
          , fillColor = progress => stateFunc.data.simSetup.nullColor
          , strokeColor = progress => stateFunc.data.simSetup.nodeStrokeColor
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        ctx.restore();
      }//colorGeoIntel_()

      function colorIPInel_(){
        clearSaveTranslateContext();
        addRings();
        for (var i = 0; i < 5; i++) {
          simulation.tick();
        }
        var geoFAIL = stateFunc.data.geoIntelPercent.fail
          , geoPASS = stateFunc.data.geoIntelPercent.pass
          , ipFAIL = stateFunc.data.ipRepIntelPercent.fail
          , ipPASS = stateFunc.data.ipRepIntelPercent.pass
          , senderFAIL = stateFunc.data.senderIntelPercent.fail
          , senderPASS = stateFunc.data.senderIntelPercent.pass;
          // color nodes that have both geo and ipRep w/ percentage based logic on scroll
          var logicType = "lessThan"
            , filter = d => ((d.intel.ipRep==ipPASS)&(d.intel.geo==geoPASS))
            , fillColor = progress => stateFunc.data.intelColorScale(progressScale(progress)*ipPASS+geoPASS)
            , strokeColor = progress => stateFunc.data.strokeColorScale(progressScale(progress)*ipPASS+geoPASS)
            , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
            , lineDash = [];
          drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
          // whiteout nodes that have both geo and ipRep w/ percentage based logic on scroll
          var logicType = "greaterThan"
            , filter = d => ((d.intel.ipRep==ipPASS)&(d.intel.geo==geoPASS))
            , fillColor = progress => stateFunc.data.intelColorScale(geoPASS)
            , strokeColor = progress => stateFunc.data.strokeColorScale(geoPASS)
            , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
            , lineDash = [];
          drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
          // color nodes that have either geo or ipRep but not both
          var logicType = "lessThan"
            , filter = d => ((d.intel.ipRep==ipPASS)&(d.intel.geo==geoFAIL))
            , fillColor = progress => stateFunc.data.intelColorScale(progressScale(progress)*ipPASS+geoFAIL)
            , strokeColor = progress => stateFunc.data.strokeColorScale( progressScale(progress)*ipPASS+geoFAIL)
            , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
            , lineDash = [];
          drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
          var logicType = "greaterThan"
            , filter = d => ((d.intel.ipRep==ipPASS)&(d.intel.geo==geoFAIL))
            , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL)
            , strokeColor = progress => stateFunc.data.strokeColorScale(geoFAIL)
            , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
            , lineDash = [];
          drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        // color nodes that have either geo or ipRep but not both
        var logicType = "lessThan"
          , filter = d => ((d.intel.ipRep==ipFAIL)&(d.intel.geo==geoPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(progressScale(progress)*ipFAIL+geoPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( progressScale(progress)*ipFAIL+geoPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.ipRep==ipFAIL)&(d.intel.geo==geoPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale(geoPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        // color unknown nodes
        var logicType = "lessThan"
          , filter = d => ((d.intel.ipRep==ipFAIL)&(d.intel.geo==geoFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(progressScale(progress)*ipFAIL+geoFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( progressScale(progress)*ipFAIL+geoFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.ipRep==ipFAIL)&(d.intel.geo==geoFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale(geoFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        ctx.restore();
      }//colorGeo_()

      function colorSenderInel_(){
        clearSaveTranslateContext();
        addRings();
        for (var i = 0; i < 5; i++) {
          simulation.tick();
        }
        var geoFAIL = stateFunc.data.geoIntelPercent.fail
          , geoPASS = stateFunc.data.geoIntelPercent.pass
          , ipFAIL = stateFunc.data.ipRepIntelPercent.fail
          , ipPASS = stateFunc.data.ipRepIntelPercent.pass
          , senderFAIL = stateFunc.data.senderIntelPercent.fail
          , senderPASS = stateFunc.data.senderIntelPercent.pass;

        // color nodes w/ geo
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+progressScale(progress)*senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+progressScale(progress)*senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale(geoPASS+ipFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        // color nodes w/ ipRep and not sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+progressScale(progress)*senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+progressScale(progress)*senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale(geoFAIL+ipPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        // color nodes w/ geo and sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+progressScale(progress)*senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+progressScale(progress)*senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes w/ rep and sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+progressScale(progress)*senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+progressScale(progress)*senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have both geo and ipRep and not sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+progressScale(progress)*senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+progressScale(progress)*senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have (both geo and ipRep) and sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+progressScale(progress)*senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+progressScale(progress)*senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have (neither geo nor ipRep), but do have sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+progressScale(progress)*senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+progressScale(progress)*senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale(geoFAIL+ipFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have both geo and ipRep w/ percentage based logic on scroll
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+progressScale(progress)*senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+progressScale(progress)*senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale(geoFAIL+ipFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        ctx.restore();
      }//colorSenderInel_()
      function colorDMARC_(){
        clearSaveTranslateContext();
        addRings();
        for (var i = 0; i < 25; i++) {
          simulation.tick();
        }
        var geoFAIL = stateFunc.data.geoIntelPercent.fail
          , geoPASS = stateFunc.data.geoIntelPercent.pass
          , ipFAIL = stateFunc.data.ipRepIntelPercent.fail
          , ipPASS = stateFunc.data.ipRepIntelPercent.pass
          , senderFAIL = stateFunc.data.senderIntelPercent.fail
          , senderPASS = stateFunc.data.senderIntelPercent.pass
          , dmarcFAIL = stateFunc.data.dmarcIntelPercent.fail
          , dmarcPASS = stateFunc.data.dmarcIntelPercent.pass;

        // color nodes w/ geo
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderFAIL+progressScale(progress)*dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderFAIL+progressScale(progress)*dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderFAIL+progressScale(progress)*dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderFAIL+progressScale(progress)*dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes w/ ipRep and not sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderFAIL+progressScale(progress)*dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderFAIL+progressScale(progress)*dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderFAIL+progressScale(progress)*dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderFAIL+progressScale(progress)*dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes w/ geo and sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderPASS+progressScale(progress)*dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderPASS+progressScale(progress)*dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderPASS+progressScale(progress)*dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderPASS+progressScale(progress)*dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes w/ rep and sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderPASS+progressScale(progress)*dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderPASS+progressScale(progress)*dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderPASS+progressScale(progress)*dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderPASS+progressScale(progress)*dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have both geo and ipRep and not sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderFAIL+progressScale(progress)*dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderFAIL+progressScale(progress)*dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderFAIL+progressScale(progress)*dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderFAIL+progressScale(progress)*dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have (both geo and ipRep) and sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderPASS+progressScale(progress)*dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderPASS+progressScale(progress)*dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderPASS+progressScale(progress)*dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderPASS+progressScale(progress)*dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have (neither geo nor ipRep), but do have sender
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderPASS+progressScale(progress)*dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderPASS+progressScale(progress)*dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderPASS+progressScale(progress)*dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderPASS+progressScale(progress)*dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have both geo and ipRep w/ percentage based logic on scroll
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderFAIL+progressScale(progress)*dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderFAIL+progressScale(progress)*dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "lessThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderFAIL+progressScale(progress)*dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderFAIL+progressScale(progress)*dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "greaterThan"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        ctx.restore();
      }//colorDMARC_
      function colorFullInel__(){
        clearSaveTranslateContext();
        addRings();
        addFriendFoeTxt()
        for (var i = 0; i < 25; i++) {
          simulation.tick();
        }
        var geoFAIL = stateFunc.data.geoIntelPercent.fail
          , geoPASS = stateFunc.data.geoIntelPercent.pass
          , ipFAIL = stateFunc.data.ipRepIntelPercent.fail
          , ipPASS = stateFunc.data.ipRepIntelPercent.pass
          , senderFAIL = stateFunc.data.senderIntelPercent.fail
          , senderPASS = stateFunc.data.senderIntelPercent.pass
          , dmarcFAIL = stateFunc.data.dmarcIntelPercent.fail
          , dmarcPASS = stateFunc.data.dmarcIntelPercent.pass;

        // color nodes w/ geo
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderFAIL+dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderFAIL+dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderFAIL+ dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderFAIL+ dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes w/ ipRep and not sender
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderFAIL+ dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderFAIL+ dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderFAIL+ dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderFAIL+ dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes w/ geo and sender
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderPASS+ dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderPASS+ dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipFAIL+senderPASS+ dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipFAIL+senderPASS+ dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes w/ rep and sender
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderPASS+ dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderPASS+ dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipPASS+senderPASS+ dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipPASS+senderPASS+ dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have both geo and ipRep and not sender
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderFAIL+ dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderFAIL+ dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderFAIL+ dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderFAIL+ dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have (both geo and ipRep) and sender
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderPASS+ dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderPASS+ dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoPASS)&(d.intel.ipRep==ipPASS)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoPASS+ipPASS+senderPASS+ dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoPASS+ipPASS+senderPASS+ dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have (neither geo nor ipRep), but do have sender
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderPASS+ dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderPASS+ dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderPASS)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderPASS+ dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderPASS+ dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth*stateFunc.data.lineWidthFactor
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        // color nodes that have both geo and ipRep w/ percentage based logic on scroll
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcFAIL))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderFAIL+ dmarcFAIL)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderFAIL+ dmarcFAIL)
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);
        var logicType = "none"
          , filter = d => ((d.intel.geo==geoFAIL)&(d.intel.ipRep==ipFAIL)&(d.intel.sender==senderFAIL)&(d.intel.dmarc==dmarcPASS))
          , fillColor = progress => stateFunc.data.intelColorScale(geoFAIL+ipFAIL+senderFAIL+ dmarcPASS)
          , strokeColor = progress => stateFunc.data.strokeColorScale( geoFAIL+ipFAIL+senderFAIL+ dmarcPASS)
          , lineWidth = stateFunc.data.simSetup.lineWidth
          , lineDash = [];
        drawMethod(filter, logicType, lineWidth, lineDash, fillColor, strokeColor);

        ctx.restore();
      }//colorFullInel__
      function colorIPRep(){
        clearSaveTranslateContext();
        for (var i = 0; i < 5; i++) {
          simulation.tick();
        }
        //addRings();

        // color Known IPs
        var threshold = stateFunc.data.ipRepThreshold
          , nullValue = -1;
        var knownNodes = dataObject.client.filter(d => (+d.bucket_id < 3)||(+d.sender_id != nullValue));
        ctx.beginPath();
        knownNodes.forEach(drawNode)
        ctx.lineWidth = simSetup.lineWidth*2;
        ctx.setLineDash([]);
        ctx.fillStyle = colorScale(1);
        ctx.fill();
        ctx.strokeStyle = simSetup.nodeStrokeColor;
        ctx.stroke();

        // color bad IPRep nodes
        var threshold = stateFunc.data.ipRepThreshold
          , nullValue = -1;
        var iprepNodes = dataObject.client.filter(d => ((+d.bucket_id >= 3)&(+d.sender_id == nullValue)&(d.ip_reputation<threshold)));
        ctx.beginPath();
        iprepNodes.forEach(drawNode)
        ctx.lineWidth = simSetup.lineWidth*2
        ctx.setLineDash([])
        ctx.fillStyle = simSetup.badRep
        ctx.fill();
        ctx.strokeStyle = simSetup.nodeStrokeColor
        ctx.stroke();

        // color remaining nodes
        var unknownNodes = dataObject.client.filter(d => ((+d.bucket_id >= 3)&(+d.sender_id == nullValue)&(d.ip_reputation>=threshold)));
        ctx.beginPath();
        unknownNodes.forEach(drawNode)
        ctx.lineWidth = simSetup.lineWidth
        ctx.setLineDash([])
        ctx.strokeStyle = simSetup.nodeStrokeColor
        ctx.stroke();
        ctx.fillStyle = simSetup.nullColor
        ctx.fill();

        ctx.restore();
      }//colorIPRep
    function dragsubject() {
      var elem = simulation.find(d3.event.x - width/2, d3.event.y - height/2);
      //console.log(elem)
      return elem;
    }

    function dragstarted() {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d3.event.subject.fx = d3.event.subject.x;
      d3.event.subject.fy = d3.event.subject.y;
    }

    function dragged() {
      d3.event.subject.fx = d3.event.x;
      d3.event.subject.fy = d3.event.y;
    }

    function dragended() {
      if (!d3.event.active) simulation.alphaTarget(simSetup.alphaTarget);
      d3.event.subject.fx = null;
      d3.event.subject.fy = null;
    }

    function drawNode(d) {
      //ctx.moveTo(d.x + stateFunc.data.simSetup.nodeRadius, d.y);
      //ctx.arc(d.x, d.y, stateFunc.data.simSetup.nodeRadius, 0, 2 * Math.PI);
      //ctx.closePath();
    }

    function drawSquare(d) {
      //ctx.moveTo(d.x - simSetup.nodeRadius*20, d.y - simSetup.nodeRadius*40);
      //set limits to size of canvas
      d.x = (d.x<0)? d3.max([-stateFunc.data.adjX+(2*stateFunc.data.simSetup.nodeRadius), d.x]): d3.min([stateFunc.data.adjX-(2*stateFunc.data.simSetup.nodeRadius), d.x]);
      d.y = (d.y<0)? d3.max([-stateFunc.data.adjY+(2*stateFunc.data.simSetup.nodeRadius), d.y]): d3.min([stateFunc.data.adjY-(2*stateFunc.data.simSetup.nodeRadius), d.y]);
      ctx.rect(d.x- stateFunc.data.simSetup.nodeRadius, d.y- stateFunc.data.simSetup.nodeRadius, stateFunc.data.simSetup.nodeRadius*2, stateFunc.data.simSetup.nodeRadius*2);
      ctx.closePath();
    }
    function clearSaveTranslateContext(){
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(adjX,adjY);
    }

    function buildSim(){
      // initite simulation
      simulation = d3.forceSimulation()
        .nodes(dataObject.client)


      simulation
        .alphaDecay(simSetup.alphaDecay)
        .alphaMin(simSetup.alphaMin)
        .alphaTarget(simSetup.alphaTarget)

      d3.select(canvas)
          .call(d3.drag()
              .container(canvas)
              .subject(dragsubject)
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

      fitToContainer(canvas)
    }//buildSim()

    function fitToContainer(canvas){
      // Make it visually fill the positioned parent
      canvas.style.width ='100%';
      canvas.style.height='100%';
      // ...then set the internal size to match
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      // set for use elsewhere
      width = canvas.width;
      height = canvas.height;
      stateFunc.data.width = canvas.width;
      stateFunc.data.height = canvas.height;
      adjX = width/2;
      adjY = height/2;
      stateFunc.data.adjX = width/2;
      stateFunc.data.adjY = height/2;
      // reset radial layout
      setupRadius()
      // reset grid layout
      //createSenderGrid()
      d3.select("#viz-svg")
        .attr("height",canvas.height)
        .attr("width", canvas.width)
        .style("height","100%")
        .style("width","100%")
    }//fitToContainer(canvas)

    function setLegendMargins(){
      stateFunc.data.legendMargins = {
        left: -stateFunc.data.outerRadius
        , right: stateFunc.data.outerRadius
        , top: -(stateFunc.data.outerRadius * 1.50) + 30
        , space: -30
        , symbolStart: 10
        , symbolTextStart: 20
        , bottom: (stateFunc.data.outerRadius * 1.50) + 30-(3*25)
      }
    }
    function setScales(){
      stateFunc.data.rScaleLinear.range([stateFunc.data.innerRadius, stateFunc.data.outerRadius])
      stateFunc.data.rScaleLinear.type = "Linear"
      stateFunc.data.rScaleLog.range([stateFunc.data.innerRadius, stateFunc.data.outerRadius])
      stateFunc.data.rScaleLog.type = "Log"
    }
    function setupRadius(){
      outerRadius = (Math.min(stateFunc.data.width, stateFunc.data.height) - 5) * stateFunc.data.simSetup.radiusFactor;
      innerRadius = outerRadius / 6;
      stateFunc.data.outerRadius = (Math.min(stateFunc.data.width, stateFunc.data.height) - 5) * simSetup.radiusFactor;
      stateFunc.data.outerRingRadius = stateFunc.data.outerRadius+stateFunc.data.simSetup.nodeRadius*3
      stateFunc.data.innerRadius = stateFunc.data.outerRadius / 6;
      stateFunc.data.outerArea = Math.pow(stateFunc.data.outerRadius,2) * Math.PI
      stateFunc.data.innerArea = Math.pow(stateFunc.data.innerRadius,2) * Math.PI
      stateFunc.data.dataLength = stateFunc.data.clientData.length
      stateFunc.data.simSetup.nodeRadius = (Math.sqrt((stateFunc.data.outerArea *0.90)/stateFunc.data.dataLength)/Math.PI)
      //console.log(stateFunc.data.nodeRadius)
      setLegendMargins()
      setScales()
      //outerRadius2 = outerRadius * outerRadius;
      //innerRadius2 = innerRadius * innerRadius;
      //k = outerRadius2 - innerRadius2;
      //rScaleLinear.range([innerRadius, outerRadius])
      stateFunc.data.rScaleLinear.range([stateFunc.data.innerRadius, stateFunc.data.outerRadius])
      //rScaleLinear.type = "Linear"
      stateFunc.data.rScaleLinear.type = "Linear"
      //rScaleLog.range([innerRadius, outerRadius])
      stateFunc.data.rScaleLog.range([stateFunc.data.innerRadius, stateFunc.data.outerRadius])
      //rScaleLog.type = "Log"
      stateFunc.data.rScaleLog.type = "Log"
      //iDispatch.call("varUpdate",this,outerRadius, innerRadius, rScale, step)
    }//setupRadius()
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
