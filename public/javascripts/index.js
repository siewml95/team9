$(document).ready(function() {
$('#form').submit(function(event){
  event.preventDefault();
  $(this).ajaxSubmit({
    error: function(xhr) {
    console.log(xhr);

    },
    success: function(response) {
      console.log(JSON.stringify(response));
      var tweets = response.tweets;
      console.log('tweets : ' + JSON.stringify(tweets))
      var ctx = document.getElementById("myChart").getContext("2d");
      var ctx2 = document.getElementById("myChartSentiment").getContext("2d");
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
      },{scaleFontColor: "#666"});

      var BarChartSentiment = new Chart(ctx2).Bar({
        labels: ['Positive' , 'Neutral' , 'Negative'],
        datasets : [
          {
            label: 'Sentiment',
            fillColor: "rgba(220,220,220,0.5)",
            strokeColor: "rgba(220,220,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data : response.sentiment
          }
        ]
      },{scaleFontColor: "#666"});

       for(var i = 0; i < tweets.length; i++) {
         var str = '<tr><th>' + tweets[i].id +'</th><th>' + tweets[i].user +'</th><th>' + tweets[i].text + '</th><th>' + tweets[i].createdAt + '</th></tr>';
         var ele = $(str);
         $('#tweets').append(ele);
       }

       $('#title').css('display','block')

       $('#mentions').text(tweets.length);


    }
  });
});
});
