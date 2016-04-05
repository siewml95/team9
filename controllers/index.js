var db = require('../db');
var AlchemyAPI = require('../alchemyapi');
var alchemyapi = new AlchemyAPI();
var kmeans = require("node-kmeans");
var k = require('k-means');
var kMeans = require('kmeans-js');
var km = new kMeans({
    K: 10
});
var clusterfck = require("clusterfck");
var csv = require('csv');
var Parse = require('csv-parse');
var fs = require('fs');
var moment = require('moment');



function createTempTweets(tweets,callback) {
  db.query("TRUNCATE TABLE TweetsTemp", function(err) {
    if(err) console.log(err);
    else {
      var positiveno = 0;
      var negativeno = 0;
      var neutralno = 0;
      tweets.forEach(function(tweet,index) {
        var TA_TYPE;
        var sql = {"id" : tweet.id, "createdAt" : tweet.createdAt , "text" : tweet.text , "lang" : tweet.lang ,"user" : tweet.user , "replyUser" : tweet.replyUser, "retweetedUser" : tweet.retweetedUser, 'lat' : tweet.lat , 'lon' : tweet.lon , 'keyword' : tweet.keyword };
        alchemyapi.sentiment("text", tweet.text , {}, function(response) {
           if(response["docSentiment"] !=undefined) {
             console.log("Sentiment: " + response[  "docSentiment"]["type"]);
             TA_TYPE =  response[  "docSentiment"]["type"] ;
             sql['TA_TYPE'] = TA_TYPE;
             if(TA_TYPE == 'positive') {
               positiveno++;
             }
             else if(TA_TYPE == 'negative') {
               negativeno++;
             }
             else {
               neutralno++;
             }
             db.query('INSERT INTO TweetsTemp SET ?', sql,function(err, result) {
               if (err) throw err;
               else {
				   		   console.log('TEMP Tweets inserted:', tweet.id, tweet.createdAt);
                 if(index >= tweets.length - 1) {
                   console.log('finished');
                   callback(null,positiveno,negativeno,neutralno);
                 }
				     	 }
		    		 });
           }
           else {
             console.log("Sentiment : undefined");
             TA_TYPE = 'undefined';
             sql['TA_TYPE'] = TA_TYPE;
             neutralno++;
             db.query('INSERT INTO TweetsTemp SET ?', sql,function(err, result) {
               if (err) throw err;
               else {
                console.log('TEMP Tweets inserted:', tweet.id, tweet.createdAt);
                if(index >= tweets.length - 1) {
                  console.log('finished');
                  callback(null,positiveno,negativeno,neutralno);
                }
              }
            });
           }
         });
   });
   }
 });
};

function createTweeters(tweets,callback) {
  db.query("DROP TABLE IF EXISTS Tweeters", function(err) {
    if(err) console.log(err);
    else {
      db.query('CREATE TABLE Tweeters AS SELECT t.user, ((CASE WHEN P IS NULL THEN 0 ELSE P * 1 END)+(CASE WHEN N IS NULL THEN 0 ELSE N * 0 END) - (CASE WHEN NEG IS NULL THEN 0 ELSE NEG * 1 END) - (CASE WHEN UND IS NULL THEN 0 ELSE UND * 0 END)) AS stance, ((CASE WHEN RRC IS NULL THEN 0 ELSE RRC END)+(CASE WHEN RTRC IS NULL THEN 0 ELSE RTRC END)-(CASE WHEN RSC IS NULL THEN 0 ELSE RSC END) + (CASE WHEN RTSC IS NULL THEN 0 ELSE RTSC END)) AS influence FROM (SELECT DISTINCT user FROM TweetsTemp) t LEFT JOIN ( SELECT user, SUM(P) AS P, SUM(N) AS N, SUM(NEG) AS NEG, SUM(UND) AS UND FROM TweetsTemp t LEFT JOIN ( SELECT id, SUM(CASE TA_TYPE WHEN "positive" THEN total END) AS P, SUM(CASE TA_TYPE WHEN "neutral" THEN total END) AS N, SUM(CASE TA_TYPE WHEN "negative" THEN total END) AS NEG, SUM(CASE TA_TYPE WHEN "undefined" THEN total END) AS UND FROM ( SELECT id, TA_TYPE, COUNT(*) AS total FROM TweetsTemp WHERE TA_TYPE = "positive" OR TA_TYPE = "neutral" OR TA_TYPE = "negative" OR TA_TYPE = "undefined" GROUP BY id, TA_TYPE ) k GROUP BY id ) i ON t.id = i.id GROUP BY user ) s ON s.user = t.user LEFT JOIN ( SELECT replyUser, COUNT(*) AS RRC FROM TweetsTemp WHERE replyUser != "" GROUP BY replyUser ) rrc ON rrc.replyUser = t.user LEFT JOIN ( SELECT retweetedUser, COUNT(*) AS RTRC FROM TweetsTemp WHERE retweetedUser != "" GROUP BY retweetedUser ) rtrc ON rtrc.retweetedUser = t.user LEFT JOIN ( SELECT user, COUNT(*) AS RSC FROM TweetsTemp WHERE replyUser != "" GROUP BY user ) rsc ON rsc.user = t.user LEFT JOIN ( SELECT user, COUNT(*) AS RTSC FROM TweetsTemp WHERE retweetedUser != "" GROUP BY user ) rtsc ON rtsc.user = t.user',
      function(err) {
        if(err) { console.log('Cannot create tweeters table') ;  console.log(err); }
        else {
           console.log("Table Tweeters Created");
        }
        callback(null);
      });
    }

 });
};

function findTopTweeters(tweeters,callback) {

}

function createClusters(tweeters,array,index2,callback) {
   //console.log('fuck4');
   var vectors =[];
   var array2 = [];
   var array3 = [];
   tweeters.forEach(function(tweeter,index) {
      vectors[index] = [tweeter.stance,tweeter.influence];
      if(index >= tweeters.length - 1) {
        kmeans.clusterize(vectors, {k : 10}, function(err, cluster){
          if(err) {
            console.log(err);
          //  callback(err,null)
          }
          else {
          //  console.log('%o',JSON.stringify(cluster));
          //  callback(null,cluster);
           for(var  i = 0; i<10;i++) {
              array2[i] = cluster[i].centroid;
              if(array2[i] == 0)
                 i--;
              if(i == 9) {
                //console.log('unsorted ' + JSON.stringify(array2));
                var sortedI = array2.sort(compareInfluence);
                var sortedS = sortedI.sort(compareStance);
              //  console.log('sorted' + JSON.stringify(sortedS));
                callback(array2);
              }
           }
          }
        });
      }
   });
};

function siArray(tweeters,callback) {
  var vectors = [];
  tweeters.forEach(function(tweeter,index) {
     vectors[index] = [tweeter.stance,tweeter.influence];
     if(index >= tweeters.length - 1) {
       callback(vectors);
     }
   });
};

function getRidZero(array,callback) {
  var length = array.length;
  var bool = true;
  while(bool) {
   length = array.length
   for(var i = 0; i < length ; i++){
	    if (array[i] == 0 || array[i] == undefined || array[i] == null) array.splice(i, 1);
      if(i >= length - 1) {
        bool = (array.indexOf(0) != -1 || array.indexOf(undefined) != -1 || array.indexOf(null) != -1)
        if(!bool) {
        //  console.log('zerorid ' + JSON.stringify(array))
          callback(array);
          return ;

        }
      }
   }
 }
};

function finalCluster(tweeters,centroid,callback) {
  var kk = new clusterfck.Kmeans(centroid);
   console.log('fuck')
  siArray(tweeters,function(vectors) {
    var clusters = [0,0,0,0,0,0,0,0,0,0];

    vectors.forEach(function(vector,index) {
      var clusterIndex = kk.classify(vector);
      clusters[clusterIndex] += 1;
      console.log('vector ' + JSON.stringify(vector))
      console.log('len ' + JSON.stringify(clusterIndex))
      if(index >= vectors.length - 1) {

       callback(clusters)
      }
    });
  });
}



function iterateClusters(tweeters,callback) {
  console.log('ficl')
   var clusters = new Array(100);
   for(var i = 0;i <100;i++)
      clusters[i] = 0;
   clusters.forEach(function(cluster,index) {
       //console.log('fuck3');
       createClusters(tweeters,clusters,index,function(result) {
           clusters[index] = result;
      //     console.log('Done ' + result);
           if(index >= clusters.length - 1) {
          //   console.log('finish' + JSON.stringify(clusters));
             callback(clusters);
           }
       });

     });
};

function getAverageCentroids(array,callback) {
    var result = [[0,0],[0,0], [0,0],[0,0],[0,0], [0,0],  [0,0], [0,0],  [0,0], [0,0]];
    console.log('array : ' + array.length)
    array.forEach(function(item,index) {
      // console.log('item ' + JSON.stringify(item))
       for(var i = 0; i < 10; i ++) {
         result[i][0] += item[i][0];
         result[i][1] += item[i][1];

       if(i == 9 && index >= array.length - 1) {
      //     console.log('result ' + JSON.stringify(result));
           console.log('result ' + JSON.stringify(result))
           callback(result);
         }
       }
    })
}

function getAverageCentroid(length,array,callback) {
   var array2 = [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
   console.log('length ' + length);
   array2.forEach(function(item,index) {
    // console.log('check ' + JSON.stringify(array[index]) );
     array2[index][0] = array[index][0] / length ;
     array2[index][1] = array[index][1] / length ;
     if(index >= 9) {
       console.log('avearge ' + JSON.stringify(array2))
       arrange(array2,function(newarray) {
         callback(newarray);
       })
     }
   })

}

function arrange(array,callback) {
  var neg = [];
  var pos = [];
  var newneg =[];
  var newpos =[];
  array.forEach(function(item,index) {
    if(array[index][0] < 0)
      pos.push(array[index]);
    else
      neg.push(array[index]);
    if(index == 9) {
      newneg = neg.sort(compareNeg);
      newpos = pos.sort(comparePos);
      var newarray = newneg.concat(newpos);
      if(newarray != undefined)
         callback(newarray.reverse())
    }
  })
}

exports.test = function(req,res,next) {
  db.query('SELECT * FROM Tweeters',function(err,rows,fields) {
    console.log('len rows : ' + rows.length)
    if(err) throw err;
    else {
      iterateClusters(rows,function(clusters) {
        getRidZero(clusters,function(clusters2) {
          getAverageCentroids(clusters2,function(result) {
            getAverageCentroid(clusters2.length,result,function(centroids) {
              console.log('avearge ' + JSON.stringify(centroids))
              finalCluster(rows,centroids,function(final){
                   console.log('final data ' + JSON.stringify(final) )
                   res.render('home' , {"data" : final, "labels" : [0,1,2,3,4,5,6,7,8,9], "mentions" : rows.length, "tweeters" : rows });
              });

            });
        });
      });
    });
  }
 });
}

function parseCSVFile(sourceFilePath, columns, onNewRecord, handleError, callback){
    var source = fs.createReadStream(sourceFilePath);
    var array = [];

    var linesRead = 0;

    var parser = Parse({
        delimiter: ',',
        columns:columns
    });

    parser.on("readable", function(){
        var record;
        while (record = parser.read()) {
            linesRead++;
            array.push(record);
            onNewRecord(record);
        }
    });

    parser.on("error", function(error){
        handleError(error)
    });

    parser.on("end", function(){
        callback(array);
    });

    source.pipe(parser);
}

function arrangeRecords(records,callback) {
  var sorted = records.sort(compareDates);
  callback(sorted);
}

function compareDates(first,second) {
  var a = moment(first.Date,'DD/MM/YYYY')
  var b = moment(second.Date,'DD/MM/YYYY')
  if( a > b )
    return 1;
  else if(a < b)
     return -1;
  else
    return 0;
}


function convertData(rows,start,end,callback) {
   var start_date = moment(start, 'DD/MM/YYYY');
   var end_date = moment(end,'DD/MM/YYYY');
   var diff = parseInt(end_date.diff(start_date,'days'),10) + 1;
   var labels = [];
   var quantities = [];
   console.log('data diff ' + diff);
   for(var i = 0; i < diff; i++) {
     var temp = start_date.format('DD/MM/YYYY');
     var acc = 0;
       for(var k = 0; k < rows.length;k++) {
         var row = moment(rows[k].createdAt);
         row = moment(row.format('DD/MM/YYYY') , 'DD/MM/YYYY');
         console.log('date createdAt ' + rows[k].createdAt + '/ ' + temp + ' / ' + start_date.diff(row,'days'))
         console.log(row.format('DD/MM/YYYY'))
         if(start_date.diff(row,'days') == 0) {
           console.log('date acc ' + acc)
           console.log('data type ' + rows[k].TA_TYPE)
           if(rows[k].TA_TYPE == 'positive')
              acc += 1;
         }
       }

       start_date.add(1,'days');
       labels.push(temp);
       quantities.push(acc);
   }
   console.log('data labels'  + labels)
   console.log('data quantites'  + quantities)

   callback(labels,quantities);
}


function convertRecords(start,end,sortedrecords,callback) {
  if(!start) {
    var start_date = moment(sortedrecords[0].Date,'DD/MM/YYYY');
  }
  else {
    var start_date = moment(start,'DD/MM/YYYY');
  }

  var start_init = start_date.format('DD/MM/YYYY').split('/');
  if(start_init.length < 3) {
    start_init = start_date.format('DD/MM/YYYY').split('-');
  }

  if(!end) {
    var end_date = moment(sortedrecords[sortedrecords.length - 1].Date,'DD/MM/YYYY');
  }
  else {
    var end_date = moment(end,'DD/MM/YYYY');
  }

  var end_init = end_date.format('DD/MM/YYYY').split('/');
  if(end_init.length < 3) {
    end_init = end_date.format('DD/MM/YYYY').split('-');
  }




  var diff = parseInt(end_date.diff(start_date,'days'),10) + 1;
  var labels = [];
  var quantities = [];

  for(var i = 0; i < diff; i++ ) {
    var temp = start_date.format('DD/MM/YYYY');
    var acc = 0;
    for(var k = 0; k < sortedrecords.length;k++ ) {
      //console.log('check ' + sortedrecords[k].Date.replace(/\s/g, '') + '/' + temp)
      if(start_date.diff(moment(sortedrecords[k].Date.replace(/\s/g, ''),'DD/MM/YYYY')) == 0) {
        //console.log('acc ' + acc)
        acc += parseInt(sortedrecords[k].Quantity);
      }
    }
    start_date.add(1,'days');
    labels.push(temp);
    quantities.push(acc);
  }
  console.log(labels)
  console.log(quantities)


  callback(start_init,end_init,labels,quantities);

}

exports.file = function(req,res,next) {
      var sent = false;

      var filePath = req.files.csv.path;
      console.log(filePath);
      function onNewRecord(record){
          console.log(record)
      }

      function onError(error){
          console.log(error)
      }

      function done(linesRead){
          res.send(200, linesRead)
      }

      var start_date = null;
      var end_date = null;
      console.log('year ' + req.body.year_start + ' month ' + req.body.month_start  +  ' day ' + req.body.day_start )
      if(req.body.year_start && req.body.month_start && req.body.day_start) {
        var start_date = req.body.day_start + '-'  + req.body.month_start + '-' + req.body.year_start;
      }

      if(req.body.year_end && req.body.month_end && req.body.day_end) {
        var end_date = req.body.day_end + '-' + req.body.month_end + '-' + req.body.year_end ;
      }


      var columns = true;
      parseCSVFile(filePath, columns, onNewRecord, onError,  function(demands) {
         console.log('demand ' + JSON.stringify(demands));
         arrangeRecords(demands,function(sorted) {
           console.log('please')
           convertRecords(start_date,end_date,sorted,function(calc_start,calc_end,labels,quantity) {
               console.log('check')
               console.log(labels);
               console.log(quantity);
               search(calc_start,calc_end,req.body.language,req.body.text,labels,quantity,function(tweets,finalcluster,tweeters,sentiment,datalabels,dataquantity,datacorrelationobjects){
                 if(!sent) {
                 sent = true;
                 res.status(201);
                 res.json({"data" : finalcluster,  "mentions" : tweets.length, "tweets" : tweets, "tweeters" : tweeters , "sentiment" : sentiment , "csvlabels" : labels , "csvquantity" : quantity,"datalabels" : datalabels, "dataquantity" : dataquantity , "datacorrelationobjects" : datacorrelationobjects});
                 }

               })
           });
         })
      });


}

function search(start_date,end_date,language,text,labels,quantity,callback) {
  var sent = false;
  var start_d = start_date[2] + '-' + start_date[1] + '-' + start_date[0];
  var end_d = end_date[2] + '-' + end_date[1] + '-' + end_date[0];
  var correct_s = start_date[0] + '/' + start_date[1] + '/' + start_date[2];
  var correct_e = end_date[0] + '/' + end_date[1] + '/' + end_date[2];

  var query = 'SELECT * FROM Tweets WHERE text LIKE "% ' + text + ' %"';
  if(language != 'none' ) {
    query += 'AND lang LIKE "' + language + '"';
  }

  if(start_date) {
    query += 'AND createdAt >= "' + start_d + '"';
  }
  if(end_date) {
    query += 'AND createdAt <= "' + end_d + '"';
  }

  db.query(query,function(err,rows,fields) {
  //  console.log(JSON.stringify(rows));
    console.log('len' + rows.length);
    createTempTweets(rows,function(err,positiveno,negativeno,neutralno) {
      if(err) throw err;
       else  {
         db.query('Select * FROM TweetsTemp',function(err,rows2,fields) {
           if(err) throw err;
           else {
             createTweeters(rows2,function(err) {
               if(err) throw err;
                else  {
                  console.log('testing1')
                  db.query('SELECT * FROM Tweeters',function(err,rows3,fields) {
                    if(err) throw err;
                    else {
                      console.log('testing2')
                      iterateClusters(rows3,function(clusters) {
                        console.log('testing3')

                        getRidZero(clusters,function(clusters2) {
                          getAverageCentroids(clusters2,function(result) {
                            getAverageCentroid(clusters2.length,result,function(centroids) {
                              console.log('avearge ' + JSON.stringify(centroids))
                              finalCluster(rows3,centroids,function(final){
                                   var sentiment = [positiveno,negativeno,neutralno];
                                   convertData(rows2,correct_s,correct_e,function(datalabels,dataquantity){
                                     createCorrelationObject(quantity,dataquantity,function(datacorrelationobjects) {
                                     if(!sent) {
                                       sent = true;
                                     callback(rows2,final,rows3,sentiment,datalabels,dataquantity,datacorrelationobjects);
                                   }
                                 });

                               });
                                });

                            return; });
                        return ;});
                      return ;});
                    return ;});

                    }
                  return;});

                }
              return; })
           }
         return; });

       }
     return; })

  return; });

}

function createCorrelationObject(demandarray,sentimentarray,callback) {
  var correlationobject = [];
  var len = sentimentarray.length;
  for(var i = 0; i<len; i++) {
    correlationobject.push({'sentiments' : sentimentarray[i], 'demands' : demandarray[i]});
  }
  correlationobject = correlationobject.sort(compareDemands);
  callback(correlationobject);
}

function getRidOfRepeatDemands(correlationobject,callback) {
  var len = correlationobject.length;
  var toberemoved = [];
  var correctdemand= [];
  var previous = null;
  var sum =0;
  for(var i=0;i<len; i++) {
    if(correlationobject[i].demands == correlationobject[i+1].demands) {
      sum = correlationobject[i].sentiments + correlationobject[i+1].sentiments;
    }
    else {
      if(previous != null && previous == correlationobject[i].demands) {
        correctdemand.push({'sentiments' : sum, 'demands' : previous});
      }
      else {
        correctdemand.push({'sentiments' : correlationobject[i].sentiments , 'demands' : correlationobject[i].demands });
      }
      sum = 0;

    }
    previous = correlationobject[i].demands;
  }
  callback(correctdemand);
}


function compareDemands(a,b) {
  if(a.demands > b.demands) {
    return 1;
  }
  else if(a.demands < b.demands) {
    return -1;
  }
  else {
    return 0;
  }
}

exports.search = function(req,res,next) {
  var sent = false;
  console.log(req.body.text);
  var query = 'SELECT * FROM Tweets WHERE text LIKE "% ' + req.body.text + ' %"';
  if(req.body.language != 'none') {
    query += 'AND lang LIKE "' + req.body.language + '"';
  }

  var start_date = req.body.year_start + '-' + req.body.month_start + '-' + req.body.day_start;
  if(start_date) {
    query += 'AND createdAt >= "' + start_date + '"';
  }
  var end_date = req.body.year_end + '-' + req.body.month_end + '-' + req.body.day_end;
  if(end_date) {
    query += 'AND createdAt <= "' + end_date + '"';
  }
  console.log(start_date);

  console.log(query);
  db.query(query,function(err,rows,fields) {
  //  console.log(JSON.stringify(rows));
    console.log('len' + rows.length);
    createTempTweets(rows,function(err,positiveno,negativeno,neutralno) {
      if(err) throw err;
       else  {
         db.query('Select * FROM TweetsTemp',function(err,rows2,fields) {
           if(err) throw err;
           else {
             createTweeters(rows2,function(err) {
               if(err) throw err;
                else  {
                  console.log('testing1')
                  db.query('SELECT * FROM Tweeters',function(err,rows3,fields) {
                    if(err) throw err;
                    else {
                      console.log('testing2')
                      iterateClusters(rows3,function(clusters) {
                        console.log('testing3')

                        getRidZero(clusters,function(clusters2) {
                          getAverageCentroids(clusters2,function(result) {
                            getAverageCentroid(clusters2.length,result,function(centroids) {
                              console.log('avearge ' + JSON.stringify(centroids))
                              finalCluster(rows3,centroids,function(final){
                                   var sentiment = [positiveno,negativeno,neutralno];
                                   //console.log('final data ' + JSON.stringify(final) )
                                   if(!sent) {
                                     res.status(201);
                                //   res.writeHead(200, {'Content-Type': 'text/plain'});
                                   console.log('sent');
                                   res.send({"data" : final,  "mentions" : rows2.length, "tweets" : rows2, "tweeters" : rows3 , "sentiment" : sentiment});
                                   sent = true;
                                 }
                                 else {
                                   return;
                                 }

                              });

                            return; });
                        return ;});
                      return ;});
                    return ;});

                    }
                  return;});

                }
              return; })
           }
         return; });

       }
     return; })

  return; });
}



var compareInfluence = function(a, b) {
  if (a[1] < b[1]) {
    return -1;
  }
  if (a[1] > b[1]) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

var comparePos = function(a,b) {
  console.log('comparePos a : ' + a + ' b : ' + b )

  if(a[1] >= b[1] && a[0] >= b[0])
    return 1;
  else if(a[1] < b[1] && a[0] < b[0])
    return -1;
  else if(a[1] >= 0 && b[1] >= 0) {
    if(a[0] >= 2 * b[0] && a[1] * 2 >= b[1])
       return 1;
    else {
       return -1;
    }
  }
  else if(a[1] < 0 && b[1] <0) {
    if(a[0] >= 2 * b[0] && a[1]/b[1]  >= 2)
       return 1;
    else {
      return -1;
    }
  }

  else if(a[1] >= 0 && b[1] < 0) {
      return 1;
  }

  else if(a[1] < 0 && b[1] >= 0) {
      return -1;
  }

 return 0;
}


var compareNeg = function(a,b) {

  console.log('compareNeg a : ' + a + ' b : ' + b )

  if(a[1] <= b[1] && a[0] >= b[0])
    return 1;
  else if(a[1] > b[1] && a[0] < b[0])
    return -1;
  else if(a[1] >= 0 && b[1] >= 0) {
    if(a[0] * 2 <= b[0] && a[1] <= b[1] * 2)
       return -1;
    else {
       return 1;
    }
  }
  else if(a[1] < 0 && b[1] <0) {
    if(a[0] * 2 <= b[0] && a[1]/b[1]  <= 0.5)
       return -1;
    else {
      return 1;
    }
  }

  else if(a[1] >= 0 && b[1] < 0) {
      return -1;
  }

  else if(a[1] < 0 && b[1] >= 0) {
      return 1;
  }

 return 0;
}

var compareStance = function(a, b) {
  if (a[0] < b[0]) {
    return -1;
  }
  if (a[0] > b[0]) {
    return 1;
  }
  // a must be equal to b
  return 0;
}



function getData(clusters,sortedArray,callback) {
  var data=[];
  clusters.forEach(function(cluster,index) {
    data[index] = clusters.filter(function(a) {
      return a.centroid  == sortedArray[index];
    })[0].clusterInd.length;
    if(index >= clusters.length - 1) {
        callback(null,data);
     }

	 });

};






function addIndex(clusterCenters,callback) {
  var data = [];
  clusterCenters.forEach(function(cluster,index) {
    data[index] = [index,cluster];
    if(index >= (clusterCenters.length)-1) {
      console.log('addIndex' + JSON.stringify(data));
      callback(null,data);
    }
  })
};


function getData(clusters,sortedArray,callback) {
  var data= [];
  console.log('hello');
  sortedArray.forEach(function(arrayItem,index) {
    data[index] = clusters.filter(function(a) {
      return arrayItem[0] == a[0];
    }).length;
    if(index >= sortedArray.length - 1) {
        console.log('data' + data);
        callback(null,data);
     }
  })
};

function createLabel(data,callback) {
  var labels = [];
  data.forEach(function(datum,index) {
    labels[index] = "" + index.toString() + "";
    if(index == data.length - 1)
       callback(null,labels);
  });
};

exports.dashboard = function(req,res,next) {
  res.render('dashboard');
}


exports.clusters = function(req,res,next) {
  db.query('SELECT * FROM Tweeters',function(err,rows,fields) {
    if(err) throw err;
    else {
      createClusters(rows,function(err,cluster) {
        if(err) throw err;
        else {
          console.log("Loop");
          addIndex(cluster["clusterCenters"],function(err,indexArray) {

          var sortedI = indexArray.sort(compareInfluence);
          var sortedS = sortedI.sort(compareStance);
          console.log('sortedS' + JSON.stringify(sortedS));
          getData(cluster.finalMatrix,sortedS,function(err,data) {
             createLabel(data,function(err,labels) {
               res.render('home',{data : data,labels : labels});
             })

          })
        })

       }
      });
    }
  });
};

exports.tweeters = function(req,res,next) {
  db.query('Select * FROM TweetsTemp',function(err,rows,fields) {
    if(err) throw err;
    else {
      createTweeters(rows,function(err) {
        if(err) throw err;
         else  {
           console.log("Tweeter Finished");
         }
       })
    }
  });
};

exports.temp = function(req,res,next) {
  db.query('Select * FROM Tweets',function(err,rows,fields) {
    if(err) throw err;
    else {
      createTempTweets(rows,function(err) {
        if(err) throw err;
         else  {
           console.log("fininsehd");
         }
       })
    }
  });
};
