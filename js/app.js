var app = angular.module('app', ['ui.odometer']);

angular.module('ui.odometer').config([
  'odometerOptionsProvider', function(odometerOptionsProvider) {
    odometerOptionsProvider.defaults = {
      duration : 300,
      theme    : 'default'
    };
  }
]);

app.controller('MainController', function($scope){

  $scope.stocks = [];
  $scope.ticker = [];
  $scope.company = {bio: "", website: "", industry: ""};
  $scope.graph = {history:[0], points:[], max:"", min:"", previousClose: "", previousPoint: ""};
  $scope.symbol = "";
  $scope.time = 'month';
  $scope.position = {x: 0, y: 0};
  $scope.highlight = "";
  $scope.point = {};
  $scope.display = "";
  $scope.ratio = 1;
  $scope.realWidth;
  $scope.showLoader = 0;

  $scope.init = function(){
    var canvas = document.getElementById("graph");
    var ctx = canvas.getContext("2d");

    canvas.width = $(window).width()/100*70;
    canvas.height = $(window).height() - 100;
    $('#infoPanel').height($(window).height() -100);
    canvas.style.width = $(window).width()/100*70;
    canvas.style.height = $(window).height() - 100;

  /*  window.addEventListener('mousemove', $scope.draw, false);
    $(window).on('touchmove', $scope.draw); */
    makeHighRes(canvas);
    setInterval(function(){
      $scope.refresh();
    }, 10000);
  }

  $scope.init();

  document.getElementById("graph").addEventListener('mousemove', function(evt) {
      $scope.position = getMousePos(document.getElementById("graph"), evt);
      $scope.draw();
    }, false);

    document.getElementById("graph").addEventListener('touchmove', function(evt) {
        $scope.position = getMousePos(document.getElementById("graph"), evt);
        $scope.draw();
      }, false);

      document.getElementById("graph").addEventListener('touchstart', function(evt) {
          $scope.position = getMousePos(document.getElementById("graph"), evt);
          $scope.draw();
        }, false);


  //Get the stock current value of the stock from the yahoo finance api
  $scope.refresh = function(){
    $scope.showLoader = 0;
    if($scope.symbol){
    if($scope.time == "day"){
      $scope.getHistory();
    }
    $.ajax({
            url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%3D%22"+$scope.symbol+"%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=",
            type: 'GET',
            data: 'json',
            cache: false,
            success: function(data) {
                $scope.stocks.push(data.query.results.quote);
              //  console.log(data.query.results.quote);
                $scope.ticker = data.query.results.quote;
              //  console.log($scope.ticker);
                $scope.$apply();
            }
        });
      }
    //  console.log('refresh');
  }
  $scope.getStock = function(){
    setTimeout(function(){
      $(".ui-autocomplete").hide();
    }, 500);
    $scope.showLoader = 1;
    $('#main').remove();
    var i = 0;
    $.each($scope.stocks, function(index, value){   // Runs a simple check to see if the symbol has been searched yet or not.
      if(value.symbol == $scope.symbol){
        i = 1;
      }
    });

    $scope.getHistory();
    if(i == 0){
    $.ajax({
            url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%3D%22"+$scope.symbol+"%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=",
            type: 'GET',
            data: 'json',
            cache: false,
            success: function(data) {
                $scope.stocks.push(data.query.results.quote);
              //  console.log(data.query.results.quote);
                $scope.ticker = data.query.results.quote;
                //console.log($scope.ticker);
                $scope.$apply();
            }
        });
      }
      requestCrossDomain("http://finance.yahoo.com/q/pr?s="+$scope.symbol+"+Profile", function(results){
        var temp = results.split("Business Summary");
        var temp2 = temp[1].split("<p>");
        var temp3 = temp2[1].split("</p>");

        var site = results.split("Website: ");
        var site2 = site[1].split('href="');
        var site3 = site2[1].split('"');

        var industry = results.split("Industry:");
        var industry2 = industry[1].split('.html">');
        var industry3 = industry2[1].split('</a>');


        $scope.company.bio = temp3[0];
        $scope.company.website = site3[0];
        $scope.company.industry = industry3[0];
        $scope.$apply();
      });

  }
  $scope.getHistory = function(){ //get the last year a stock
    if($scope.showLoader){
    $('.container').show();
      }
    $scope.graph = {history:[], points:[], max:"", min:""};
    var day = 1;
    var date = new Date();
    var weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - 7);
    var monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() -1);
    var tmonthDate = new Date();
    tmonthDate.setMonth(tmonthDate.getMonth() - 3);
    var smonthDate = new Date();
    smonthDate.setMonth(smonthDate.getMonth() - 6);
    var currentDate = date.getFullYear()+"-"+("0" + (date.getMonth() + 1)).slice(-2)+"-"+date.getDate();
    var lastYear = (date.getFullYear()-1)+"-"+("0" + (date.getMonth() + 1)).slice(-2)+"-"+date.getDate();
    var lastMonth = monthDate.getFullYear()+"-"+("0" + (monthDate.getMonth() + 1)).slice(-2)+"-"+monthDate.getDate();
    var last3Month = tmonthDate.getFullYear()+"-"+("0" + (tmonthDate.getMonth() + 1)).slice(-2)+"-"+tmonthDate.getDate();
    var last6Month = smonthDate.getFullYear()+"-"+("0" + (smonthDate.getMonth() + 1)).slice(-2)+"-"+smonthDate.getDate();
    var lastWeek = weekDate.getFullYear()+"-"+(weekDate.getMonth()+1)+"-"+weekDate.getDate();
    var timeFrame = "";
    if($scope.time == "week"){
      day = 7;
    }else if($scope.time == "month"){
      var timeFrame = lastMonth;
    }else if($scope.time == "3month"){
      var timeFrame = last3Month;
    }else if($scope.time == "6month"){
      var timeFrame = last6Month;
    }else if($scope.time == "year"){
      var timeFrame = lastYear;
    }
    if($scope.time == "day" || $scope.time == "week"){
      console.log("http://chartapi.finance.yahoo.com/instrument/1.1/"+$scope.symbol+"/chartdata;type=close;range="+day+"d/json/");
      $.ajax({
         type: 'GET',
          url: "http://chartapi.finance.yahoo.com/instrument/1.1/"+$scope.symbol+"/chartdata;type=close;range="+day+"d/json/",
          //async: false,
          jsonpCallback: 'finance_charts_json_callback',
          contentType: "application/json",
          dataType: 'jsonp',
          success: function(json) {
             $.each(json.series, function(index, value){
               $scope.graph.history.push(parseFloat(value.close));
             });
              $scope.graph.previousClose = json.meta.previous_close;

               $scope.graph.max = Math.max.apply( Math, $scope.graph.history);
               $scope.graph.min = Math.min.apply( Math, $scope.graph.history);
               $scope.realWidth = $('#graph').width()*$scope.ratio - (($scope.graph.max.toFixed(2).toString().length+1)*12*$scope.ratio);
               $.each($scope.graph.history, function(index, value){
                 $scope.graph.points.push(((value - $scope.graph.min) / ($scope.graph.max - $scope.graph.min)) * (($('#graph').height()-( $('#graph').height()/10 )) - ( $('#graph').height()/10 )) + ( $('#graph').height()/10 ));
               });
               $scope.graph.previousPoint = ((json.meta.previous_close- $scope.graph.min) / ($scope.graph.max - $scope.graph.min)) * (($('#graph').height()-( $('#graph').height()/10 )) - ( $('#graph').height()/10 )) + ( $('#graph').height()/10 );
              // console.log($scope.graph);
               $scope.$apply();
               $scope.draw();
               $('.container').hide();
          },
          error: function(e) {
             console.log(e.message);
          }
      });
    }else{
    //  console.log("https://query.yahooapis.com/v1/public/yql?q=select%20Close%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22"+$scope.symbol+"%22%20and%20startDate%20%3D%20%22"+timeFrame+"%22%20and%20endDate%20%3D%20%22"+currentDate+"%22%0A&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=");
    $.ajax({
            url: "https://query.yahooapis.com/v1/public/yql?q=select%20Close%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22"+$scope.symbol+"%22%20and%20startDate%20%3D%20%22"+timeFrame+"%22%20and%20endDate%20%3D%20%22"+currentDate+"%22%0A&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=",
            type: 'GET',
            data: 'json',
            cache: false,
            success: function(data) {
                $.each(data.query.results.quote, function(index, value){
                  $scope.graph.history.push(value.Close);
                });
                $scope.graph.max = Math.max.apply( Math, $scope.graph.history);
                $scope.graph.min = Math.min.apply( Math, $scope.graph.history);
                $scope.realWidth = $('#graph').width()*$scope.ratio - (($scope.graph.max.toFixed(2).toString().length+1)*12*$scope.ratio);
                $.each($scope.graph.history, function(index, value){
                  $scope.graph.points.push(((value - $scope.graph.min) / ($scope.graph.max - $scope.graph.min)) * (($('#graph').height()-( $('#graph').height()/10 )) - ( $('#graph').height()/10 )) + ( $('#graph').height()/10 ));
                });
                console.log(((39.880001 - $scope.graph.min) / ($scope.graph.max - $scope.graph.min)) * (($('#graph').height()-( $('#graph').height()/10 )) - ( $('#graph').height()/10 )) + ( $('#graph').height()/10 ));
                console.log($scope.graph.points[0]);
                $scope.$apply();
                $scope.draw();
                $('.container').hide();
            }
        });
      }

  }

  $scope.stockColor = function(change){  // Based on the percentage of change depends on what the css class will return
    if(change.indexOf('+') >= 0){
      return "positive";
    }else if(change.indexOf('-') >= 0){
      return "negative";
    }
  }
  $scope.changeTime = function(time){
    $scope.showLoader = 1;
    $scope.time = time;
    if($scope.symbol){
    $scope.getHistory();
    }
  }
  $scope.checkSelected = function(time){
    if($scope.time == time){
      return true;
    }else {
      return false;
    }
  }
  $scope.draw = function(e){
     var canvas = document.getElementById("graph"); //get canvas info
    //var canvas = createHiDPICanvas($(window).width(), $(window).height() - 100, 4);
    var ctx = canvas.getContext("2d");
    var point = "";
    /*
    var pos = $scope.getMousePos(canvas, e);
    console.log(pos);
    */
    if($scope.time == "day" || $scope.time == "week"){
      var i = 0;
    }else {
      var i = $scope.realWidth;
    }
    if($scope.time == "day"){
      var divisible = $scope.realWidth / 390;
    }else{
    var divisible = $scope.realWidth / $scope.graph.points.length;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height); //Simple stuff to fill out our canvas
    ctx.fillStyle = "#212121";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.save();
    if($scope.time == "day" || $scope.time == "week"){
      ctx.moveTo(0, canvas.height - $scope.graph.previousPoint);
      ctx.lineTo($scope.realWidth, canvas.height - $scope.graph.previousPoint);
      ctx.strokeStyle = '#9E9E9E';
      ctx.lineWidth = 2 * $scope.ratio;
      ctx.setLineDash([5 *$scope.ratio]);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      //ctx.moveTo(0, canvas.height - $scope.graph.points[0]);
    }else{
    ctx.moveTo($scope.realWidth, canvas.height - $scope.graph.points[$scope.graph.points.length -1]);
    ctx.lineTo(0, canvas.height - $scope.graph.points[$scope.graph.points.length -1]);
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 2 *$scope.ratio;
    ctx.setLineDash([5 *$scope.ratio]);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();

  //  ctx.moveTo($scope.realWidth, (canvas.height -$scope.graph.points[0]));
  //  console.log($scope.graph.points);
    //console.log($scope.graph.points[0]+" "+$scope.graph.points[1]);
    }
    $.each($scope.graph.points, function(index, value){
      value = value * $scope.ratio;
      if($scope.highlight == index){
        $scope.point = {x: i, y: canvas.height - value};
      }
      if($scope.time == "day" || $scope.time == "week"){
        ctx.lineTo(i, canvas.height - value);
        i += divisible;
      }else{
      ctx.lineTo(i, canvas.height - value);
      i -= divisible;
      }

    });
    if($scope.time == "day" || $scope.time == "week"){
      if($scope.graph.previousPoint < $scope.graph.points[$scope.graph.points.length -1]){
        ctx.strokeStyle = '#00C853';
        ctx.fillStyle = '#00C853';
      }else if($scope.graph.previousPoint > $scope.graph.points[$scope.graph.points.length -1]){
        ctx.strokeStyle = '#F44336';
        ctx.fillStyle = '#F44336';
      }
    }else{
      if($scope.graph.points[0] > $scope.graph.points[$scope.graph.points.length -1]){
        ctx.strokeStyle = '#00C853';
        ctx.fillStyle = '#00C853';
      }else if($scope.graph.points[0] < $scope.graph.points[$scope.graph.points.length -1]){
        ctx.strokeStyle = '#F44336';
        ctx.fillStyle = '#F44336';
      }
    }

    ctx.lineWidth = 2 * $scope.ratio;
    ctx.shadowColor = '#777';
    ctx.shadowBlur = 5 * $scope.ratio;
    ctx.stroke();
    ctx.restore();

    if($scope.point){
    ctx.beginPath();
    ctx.save();
    ctx.arc($scope.point.x, $scope.point.y, 5 * $scope.ratio, 0, 2 * Math.PI, false);
    ctx.shadowColor = '#777';
    ctx.shadowBlur = 10 * $scope.ratio;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    }

    ctx.beginPath();
    ctx.save();
    var x = 0;
    var increment = Math.round(canvas.height / 8);
    x += increment;
    while(x <= canvas.height-(canvas.height /10)){
      var value = ((x - (canvas.height/10)) / (canvas.height - (canvas.height/10))) * ($scope.graph.max - $scope.graph.min) + $scope.graph.min;
    //  console.log(value);
      ctx.font = (15 * $scope.ratio)+"px Arial";
      ctx.fillStyle = 'white';
      var y = value.toFixed(2).toString().length;
      var size = 12 * $scope.ratio;
    //  console.log(y);
      ctx.fillText("$"+value.toFixed(2) ,canvas.width - (y*size), canvas.height - x);
      x += increment;
    }
    ctx.stroke();
    ctx.restore();

    if($scope.position.x){
      if($scope.time == "week"){
      var temp = $scope.graph.history[Math.round($scope.position.x/($scope.realWidth / $scope.graph.history.length))];
      $scope.highlight = Math.round($scope.position.x/($scope.realWidth / $scope.graph.history.length)) -1;
    }else if($scope.time == "day"){
      var temp = $scope.graph.history[Math.round($scope.position.x/($scope.realWidth / 390))];
      $scope.highlight = Math.round($scope.position.x/($scope.realWidth / 390)) -1;
    }else{
      var temp = $scope.graph.history[$scope.graph.history.length - Math.round($scope.position.x/($scope.realWidth / $scope.graph.history.length))];
      $scope.highlight = $scope.graph.history.length - Math.round($scope.position.x/($scope.realWidth / $scope.graph.history.length))
    }
      if(temp){
        $scope.display = parseFloat(temp);
        $scope.display = $scope.display.toFixed(2);
        $scope.$apply();
      }
      ctx.beginPath();
      ctx.save();
      ctx.moveTo($scope.position.x - canvas.getBoundingClientRect().left, canvas.height);
      ctx.lineTo($scope.position.x - canvas.getBoundingClientRect().left, 0);
      ctx.strokeStyle = '#9E9E9E';
      ctx.lineWidth = 1;
    /*  if($scope.display){
        ctx.font = "30px Arial";
        ctx.fillStyle = 'white';
        ctx.fillText("$"+$scope.display ,canvas.width /2, 100);
      } */
      ctx.stroke();
      ctx.restore();
    }
  }

  $scope.showStock = function(symbol){
    $scope.symbol = symbol;
    $scope.getHistory();
  }

  $( "#search" ).autocomplete({
        minLength: 0,
        source: function(request, response){
          var mapped = 'ye';
          return $.ajax({
             type: 'GET',
              url: "https://s.yimg.com/aq/autoc?query="+$scope.symbol+"&region=US&lang=en-US&callback=finance_charts_json_callback",
              //async: false,
              jsonpCallback: 'finance_charts_json_callback',
              contentType: "application/json",
              dataType: 'jsonp',
              success: function(data) {
              var mapped = $.map(data.ResultSet.Result, function (e, i) {
                 return {
                     label: e.symbol,
                     value: e.symbol,
                     desc: e.name
                 };
             });
             response(mapped);
              },
              error: function(e) {
                 console.log(e.message);
              }
          });

        },
    /*    focus: function( event, ui ) {
        //  $( "#search" ).val( ui.item.label );
          $scope.symbol = ui.item.label
          return false;
        }, */
        select: function( event, ui ) {
          //$( "#search" ).val( ui.item.label );
          $scope.symbol = ui.item.label
        }
      })
      .autocomplete( "instance" )._renderItem = function( ul, item ) {
        return $( "<li>" )
          .append( "<a>" + item.label + "<br><span style='font-size: 15px; color: #BDBDBD;'>" + item.desc + "</span></a>" )
          .appendTo( ul );
      };

      document.getElementById('search').onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if (keyCode == '13'){
      // Enter pressed
      $scope.getStock();
      return false;
    }
    }


    function getMousePos(canvas, evt) {
      evt.preventDefault();
        var rect = canvas.getBoundingClientRect();
        if(window.event.touches){
          return {
            x: (window.event.touches[0].pageX - rect.left) * $scope.ratio,
            y: (window.event.touches[0].pageY - rect.top) * $scope.ratio
          };
        }else{
        return {
          x: (evt.clientX - rect.left) * $scope.ratio,
          y: (evt.clientY - rect.top) * $scope.ratio
        };
      }
      }

      function closest(arr, closestTo){

    var closest = Math.max.apply(null, arr); //Get the highest number in arr in case it match nothing.

    for(var i = 0; i < arr.length; i++){ //Loop the array
        if(arr[i] >= closestTo && arr[i] < closest) closest = i; //Check if it's higher than your number, but lower than your closest value
    }

    return closest; // return the value
}

function makeHighRes(c) {
  var ctx = c.getContext('2d');
  // finally query the various pixel ratios
  var devicePixelRatio = window.devicePixelRatio || 1;
  var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio || 1;
  var ratio = devicePixelRatio / backingStoreRatio;
  // upscale canvas if the two ratios don't match
  if (devicePixelRatio !== backingStoreRatio) {

      var oldWidth = ($(window).width()/100)*70;
      var oldHeight = $(window).height() -100;
      c.width = Math.round(oldWidth * ratio);
      c.height = Math.round(oldHeight * ratio);
      c.style.width = oldWidth + 'px';
      c.style.height = oldHeight + 'px';
      // now scale the context to counter
      // the fact that we've manually scaled
      // our canvas element
      ctx.save();
      ctx.scale(ratio, ratio);
      $scope.ratio = ratio;
      ctx.restore();
  }
}

});

function requestCrossDomain( site, callback ) {
    // If no url was passed, exit.
    if ( !site ) {
        alert('No site was passed.');
        return false;
    }

    // Take the provided url, and add it to a YQL query. Make sure you encode it!
    var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + site + '"') + '&format=xml&callback=cbFunc';

    // Request that YSQL string, and run a callback function.
    // Pass a defined function to prevent cache-busting.
  //  $.getJSON( yql, cbFunc );
    $.ajax({
       type: 'GET',
        url: yql,
        //async: false,
        jsonpCallback: 'cbFunc',
        contentType: "application/json",
        dataType: 'jsonp',
        success: function(data) {
          if ( data.results[0] ) {
          //  console.log(data);
              // Strip out all script tags, for security reasons.
              // BE VERY CAREFUL. This helps, but we should do more.
              data = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

              // If the user passed a callback, and it
              // is a function, call it, and send through the data var.
              if ( typeof callback === 'function') {
                  callback(data);
              }
          }
          // Else, Maybe we requested a site that doesn't exist, and nothing returned.
          else throw new Error('Nothing returned from getJSON.');
        },
        error: function(e) {
           console.log(e.message);
        }
    });
    /*
    function cbFunc(data) {
      console.log('god this far');
    // If we have something to work with...
    if ( data.results[0] ) {
      console.log(data);
        // Strip out all script tags, for security reasons.
        // BE VERY CAREFUL. This helps, but we should do more.
        data = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

        // If the user passed a callback, and it
        // is a function, call it, and send through the data var.
        if ( typeof callback === 'function') {
            callback(data);
        }
    }
    // Else, Maybe we requested a site that doesn't exist, and nothing returned.
    else throw new Error('Nothing returned from getJSON.');
  } */
}
