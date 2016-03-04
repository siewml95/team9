var db = require('../db');
var AlchemyAPI = require('../alchemyapi');
var alchemyapi = new AlchemyAPI();
var kmeans = require("node-kmeans");
var k = require('k-means');
var kMeans = require('kmeans-js');
var km = new kMeans({
    K: 10
});

function createTempTweets(tweets,callback) {
  db.query("TRUNCATE TABLE TweetsTemp", function(err) {
    if(err) console.log(err);
    else {
      tweets.forEach(function(tweet,index) {
        var TA_TYPE;
        var sql = {"id" : tweet.id, "createdAt" : tweet.createdAt , "text" : tweet.text , "lang" : tweet.lang ,"user" : tweet.user , "replyUser" : tweet.replyUser, "retweetedUser" : tweet.retweetedUser, 'lat' : tweet.lat , 'lon' : tweet.lon , 'keyword' : tweet.keyword };
        alchemyapi.sentiment("text", tweet.text , {}, function(response) {
           if(response["docSentiment"] !=undefined) {
             console.log("Sentiment: " + response[  "docSentiment"]["type"]);
             TA_TYPE =  response[  "docSentiment"]["type"] ;
             sql['TA_TYPE'] = TA_TYPE;
             db.query('INSERT INTO TweetsTemp SET ?', sql,function(err, result) {
               if (err) throw err;
               else {
				   		   console.log('TEMP Tweets inserted:', tweet.id, tweet.createdAt);
                 if(index >= tweets.length - 1) {
                   console.log('finished');
                   callback(null);
                 }
				     	 }
		    		 });
           }
           else {
             console.log("Sentiment : undefined");
             TA_TYPE = 'undefined';
             sql['TA_TYPE'] = TA_TYPE;
             db.query('INSERT INTO TweetsTemp SET ?', sql,function(err, result) {
               if (err) throw err;
               else {
                console.log('TEMP Tweets inserted:', tweet.id, tweet.createdAt);
                if(index >= tweets.length - 1) {
                  console.log('finished');
                  callback(null);
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

/*function createClusters(tweeters,callback) {
   var vectors =[];
   tweeters.forEach(function(tweeter,index) {
     console.log( index + ' / ' + tweeters.length );
      vectors[index] = [tweeter.stance,tweeter.influence];
      if(index >= tweeters.length - 1) {
        kmeans.clusterize(vectors, {k : 10}, function(err, cluster){
          if(err) {
            console.log(err);
            callback(err,null)
          }
          else {
            console.log('%o',JSON.stringify(cluster));
            callback(null,cluster);
          }
        });
      }
   });
}; */

function createClusters(tweeters,callback) {
   var vectors =[];
   tweeters.forEach(function(tweeter,index) {
      vectors[index] = [tweeter.stance,tweeter.influence];
      if(index >= tweeters.length - 1) {
        k(vectors,{clusters : 10, iterations: 10} ,function(cluster){
            console.log('%o ' + JSON.stringify(cluster));
              callback(null,cluster);

        });
      }
   });
};










/*var compareInfluence = function(a, b) {
  if (a[1] < b[1]) {
    return -1;
  }
  if (a[1] > b[1]) {
    return 1;
  }
  // a must be equal to b
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
} */



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

function compareInfluence(a,b) {
  if(a[1][1] < b[1][1]) {
    return -1;
  }
  else if(a[1][1] > b[1][1])
    return 1;
  else return 0;
}

function compareStance(a,b) {
  if(a[1][0] < b[1][0]) {
    return -1;
  }
  else if(a[1][0] > b[1][0])
    return 1;
  else return 0;
}

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

exports.search = function(req,res,next) {
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
    createTempTweets(rows,function(err) {
      if(err) throw err;
       else  {
         db.query('Select * FROM TweetsTemp',function(err,rows2,fields) {
           if(err) throw err;
           else {
             createTweeters(rows2,function(err) {
               if(err) throw err;
                else  {
                  db.query('SELECT * FROM Tweeters',function(err,rows3,fields) {
                    if(err) throw err;
                    else {
                      createClusters(rows3,function(err,cluster) {
                        if(err) throw err;
                        else {
                          console.log("Loop");
                          addIndex(cluster["clusterCenters"],function(err,indexArray) {
                          var sortedI = indexArray.sort(compareInfluence);
                          var sortedS = sortedI.sort(compareStance);
                          console.log('sortedS' + JSON.stringify(sortedS));
                          getData(cluster.finalMatrix,sortedS,function(err,data) {
                             createLabel(data,function(err,labels) {
                               res.status(201);
                               res.json({"data" : data, "labels" : labels, "mentions" : rows2.length, "tweets" : row, "tweeters" : row3  });
                             })

                          })
                        })

                       }
                      });
                    }
                  });

                }
              })
           }
         });

       }
     })

  });
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


/*exports.clusters = function(req,res,next) {
  db.query('SELECT * FROM Tweeters',function(err,rows,fields) {
    if(err) throw err;
    else {
      createClusters(rows,function(err,cluster) {
        var clusterArray = [];
        if(err) throw err;
        else {
          for(var i= 0; i<10;i++) {
            clusterArray[i] = cluster[i].centroid;
          }
          var sortedI = clusterArray.sort(compareInfluence);
          var sortedS = sortedI.sort(compareStance);
          console.log("Influence Sorted : " + JSON.stringify(sortedI));
					console.log("Stance Sorted : " + JSON.stringify(sortedS));
          getData(cluster,sortedS,function(err,result) {
                      res.render('home' , {data : result});
          });
       }
      });
    }
  });
}; */


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
