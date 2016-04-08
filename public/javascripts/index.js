$(document).ready(function() {
  var tweets = null;
  var tweeters = null;
  var demandlabels = null;
  var demands = null;
  var csvlabels = null;
  var csvdemands = null;
  var datalabels = null;
  var datademands = null;
  var datacorrelationobjects = null;

  function getRidOfRepeatDemands(correlationobject) {
    var len = correlationobject.length;
    var toberemoved = [];
    var correctdemand= [];
    var previous = null;
    var sum =0;
    var isLast = false;
    for(var i=0;i<len; i++) {
      try {
        var check = correlationobject[i+1].demands;
      }catch(err) {
        isLast = true;
      }
      if(!isLast && correlationobject[i].demands == correlationobject[i+1].demands) {
        sum = correlationobject[i].sentiments + correlationobject[i+1].sentiments;
      }
      else {
        if(previous != null && previous == correlationobject[i].demands) {
          correctdemand.push({'sentiments' : sum, 'demands' : previous});
          console.log('last same')
        }
        else {
          correctdemand.push({'sentiments' : correlationobject[i].sentiments , 'demands' : correlationobject[i].demands });
        }
        sum = 0;

      }
      previous = correlationobject[i].demands;
    }
    return correctdemand;
  }

  function checkpointscorrelated(correlationobject) {
    correlationobject = getRidOfRepeatDemands(correlationobject);
    console.log('check ' + JSON.stringify(correlationobject));
    var truesum = 0;
    var falsesum = 0;
    for(var i = 0;i<correlationobject.length - 1;i++) {
      if((correlationobject[i].demands <= correlationobject[i+1].demands) && (correlationobject[i].sentiments <= correlationobject[i+1].sentiments)) {
        truesum++;
      }
      else if ((correlationobject[i].demands >= correlationobject[i+1].demands) && (correlationobject[i].sentiments >= correlationobject[i+1].sentiments)) {
        truesum++;
      }
      else
        falsesum++;
    }
    return truesum/(truesum+falsesum);
  }

  $('.tabbtn').click(function() {
        $('.tabbtn').removeClass('active');
        $(this).addClass('active');
        $('.tab').removeClass('active');
        var id = '#tab-' + $(this).index();
        $(id).addClass('active');
    });

    $('.trybtn').click(function(){
          console.log('tweets' + JSON.stringify(tweets));
          console.log('tweeterss' + JSON.stringify(tweeters));


    });

$('#form').submit(function(event){
  event.preventDefault();
  $('.glyphicon.spin').removeClass('display-none');

  $(this).ajaxSubmit({
    timeout: 18000,
    error: function(xhr) {
    console.log(xhr);
    $('.glyphicon.spin').addClass('display-none');


    },
    success: function(response) {
      console.log(JSON.stringify(response));
      tweets = response.tweets;
      tweeters = response.tweeters;
      csvlabels = response.csvlabels;
      csvdemands = response.csvquantity;
      datalabels = response.datalabels;
      datademands = response.dataquantity;
      datacorrelationobjects = response.datacorrelationobjects;


      console.log('tweets : ' + JSON.stringify(tweets))
      console.log('datacorrelationobjects : ' + JSON.stringify(datacorrelationobjects))

      var ctx = document.getElementById("tweeterscluster").getContext("2d");
      var ctx2 = document.getElementById("pie").getContext("2d");
      var ctx3 = document.getElementById("demandvstime").getContext("2d");
      var ctx4 = document.getElementById("sentimentvstime").getContext("2d");

      var myBarChart = new Chart(ctx).Bar({
        labels: ['Cluster 0','Cluster 1','Cluster 2','Cluster 3','Cluster 4','Cluster 5','Cluster 6','Cluster 7','Cluster 8', 'Cluster 9'],
        datasets : [
           {
             label: "My First dataset",
             fillColor: "rgba(220,220,220,0.5)",
             strokeColor: "rgba(220,220,220,0.8)",
             highlightFill: "rgba(220,220,220,0.75)",
             highlightStroke: "rgba(220,220,220,1)",
             data : response.data
           }
        ]
      },{scaleFontColor: "#000"});
      $('.glyphicon.spin.tweeterscluster').addClass('display-none');




      var lineChart = new Chart(ctx3).Line({
    labels: csvlabels,
    datasets: [
        {
            label: "My First dataset",
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: csvdemands
        }
    ]
});
$('.glyphicon.spin.demandvstime').addClass('display-none');


var lineChart2 = new Chart(ctx4).Line({
labels: datalabels,
datasets: [
  {
      label: "My First dataset",
      fillColor: "rgba(220,220,220,0.2)",
      strokeColor: "rgba(220,220,220,1)",
      pointColor: "rgba(220,220,220,1)",
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: "rgba(220,220,220,1)",
      data: datademands
  }
]
});
$('.glyphicon.spin.sentimentsvstime').addClass('display-none');


var data = [
    {
        value: response.sentiment[0],
        color:"#F7464A",
        highlight: "#FF5A5E",
        label: "Positive"
    },
    {
        value: response.sentiment[1],
        color: "#46BFBD",
        highlight: "#5AD3D1",
        label: "Neutral"
    },
    {
        value: response.sentiment[2],
        color: "#FDB45C",
        highlight: "#FFC870",
        label: "Negative"
    }
]

var myDoughnutChart = new Chart(ctx2).Pie(data);


        var vis = d3.select('#visualisation'),
          WIDTH = 500,
          HEIGHT = 500,
          MARGINS = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 50
          },
          xRange = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([d3.min(datacorrelationobjects, function(d) {
            return d.demands;
          }), d3.max(datacorrelationobjects, function(d) {
            return d.demands;
          })]),
          yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([d3.min(datacorrelationobjects, function(d) {
            return d.sentiments;
          }), d3.max(datacorrelationobjects, function(d) {
            return d.sentiments;
          })]),
          xAxis = d3.svg.axis()
            .scale(xRange)
            .tickSize(5)
            .tickSubdivide(true),
          yAxis = d3.svg.axis()
            .scale(yRange)
            .tickSize(5)
            .orient('left')
            .tickSubdivide(true);

      vis.append('svg:g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
        .call(xAxis)
        .append("text")
           .attr("x", 6)
           .attr("dx", ".71em")
           .style("text-anchor", "end")
           .text("Demands");

      vis.append('svg:g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
        .call(yAxis)
        .append("text")
           .attr("transform", "rotate(-90)")
           .attr("y", 6)
           .attr("dy", ".71em")
           .style("text-anchor", "end")
           .text("Sentiments");
        var lineFunc = d3.svg.line()
        .x(function(d) {
          return xRange(d.demands);
        })
        .y(function(d) {
          return yRange(d.sentiments);
        })
        .interpolate('linear');
        vis.append('svg:path')
        .attr('d', lineFunc(datacorrelationobjects))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('fill', 'none');

        var percentcorrelated = checkpointscorrelated(datacorrelationobjects);
        $('#percentcorrelated .info').text((percentcorrelated * 100) + '%');
        $('#percentcorrelated .progress-bar').css('width', (percentcorrelated * 100) + '%');


       for(var i = 0; i < tweets.length; i++) {
         var str = '<tr><td class="id">' + tweets[i].id +'</td><td class="username">' + tweets[i].user +'</td><td class="text">' + tweets[i].text + '</td><td class="created">' + tweets[i].createdAt + '</td></tr>';
         var ele = $(str);
         $('#tweets').append(ele);
       }

       for(var i = 0; i < tweeters.length; i++) {
         var str = '<tr><td class="username">' + tweeters[i].user +'</td><td class="stance">' + tweeters[i].stance + '</td><td class="influence">' + tweeters[i].influence + '</td></tr>';
         var ele = $(str);
         $('#tweeters').append(ele);
       }

       $('#title').css('display','block')

       $('#mentions').text(tweets.length);
       $('.glyphicon.spin').addClass('display-none');


    }


  });


});
});
