function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "k", "m", "b","t"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

function adjacentQuadrant(svgCoords){
  var xZone = (svgCoords[0]<=0)? "neg":"pos"
    , yZone = (svgCoords[1]<=0)? "neg":"pos"
    , coordSign = xZone+"-"+yZone
    , identifyQuadrant = {
      "pos-neg":"I"
      , "neg-neg":"II"
      , "neg-pos":"III"
      , "pos-pos":"IV"
    }
/* Quadrants:
      "I": 3*Math.PI/12
    , "II": 9*Math.PI/12
    , "III": 15*Math.PI/12
    , "IV": 21*Math.PI/12
*/
    , adjacentRad = {
          "I": 15*Math.PI/12
        , "II": 21*Math.PI/12
        , "III": 3*Math.PI/12
        , "IV": 9*Math.PI/12
      }
    , quadrant = identifyQuadrant[coordSign]
    , rad = adjacentRad[quadrant];
    return [Math.cos(rad),-Math.sin(rad)]

}

function adjacentQuadrant2(svgCoords){
  var xZone = (svgCoords[0]<=0)? "neg":"pos"
    , yZone = (svgCoords[1]<=0)? "neg":"pos"
    , coordSign = xZone+"-"+yZone
    , identifyQuadrant = {
      "pos-neg":"I"
      , "neg-neg":"II"
      , "neg-pos":"III"
      , "pos-pos":"IV"
    }
    , adjacentRad = {
          "I": 9*Math.PI/12
        , "II": 3*Math.PI/12
        , "III": 21*Math.PI/12
        , "IV": 15*Math.PI/12
      }
    , quadrant = identifyQuadrant[coordSign]
    , rad = adjacentRad[quadrant];
    return [Math.cos(rad),-Math.sin(rad)]

}

/*
function identity(d, stateFunc){
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
        if(sumIntel(d.intel)<1){
          stateFunc.data.authCount["tbd"]++
          return "tbd"
        }else if(d.intel.geo==stateFunc.data.geoIntelPercent.pass){
          stateFunc.data.authCount["unauthorized"]++
          return "unauthorized"
        }else{
          stateFunc.data.authCount["authorized"]++
          return "authorized"
        }//else
      }//anonymous function
    }
    if (res=="notBad-issues"){console.log(d.intel, translate[res](d))}
    return translate[res](d)
}
*/
