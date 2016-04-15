$(document).ready(function() {

  $('input[name=test]').click(function() {
        var value = $(this).val();
        if(value == "Graph") {
          $(".form-cor label").addClass('inactive');
          $(".form-cor select").addClass('inactive');
          $("input[name=csv]").addClass('inactive');
          $("input[name=text]").addClass('inactive');
          $("input[type=submit]").val("Test")

        }
        else {
          $(".form-cor").children().removeClass('inactive');
          $("input[type=submit]").val("Search")

        }

    });

  $('#form').submit(function(event){
    event.preventDefault();
    $('.glyphicon.spin').removeClass('display-none');

    $(this).ajaxSubmit({
      error: function(xhr) {
      console.log(xhr);
      $('.glyphicon.spin').addClass('display-none');


      },
      success: function(response) {
         console.log(JSON.stringify(response))
         var language = $("select[name=" + "language] " +  "option:selected").val();
         var country = $("select[name=" + "country] " +  "option:selected").val();
         var month_start = $("select[name=" + "month_start] " +  "option:selected").val();
         var year_start = $("select[name=" + "year_start] " +  "option:selected").val();
         var day_start = $("select[name=" + "day_start] " +  "option:selected").val();
         var month_end = $("select[name=" + "month_end] " +  "option:selected").val();
         var year_end = $("select[name=" + "year_end] " +  "option:selected").val();
         var day_end = $("select[name=" + "day_end] " +  "option:selected").val();
         try {
            var filename =  $('input[type=file]')[0].files[0].name;
         }
         catch(e) {
             var filename = undefined;
         }

         console.log('test ' + filename);
         if(!response.testUI) {
          QUnit.test("Testing for Graphs Value ",function(assert) {
            assert.deepEqual(response.dataquantity,[33,19,18],'Sentiment vs Time y-axis value ');
            assert.deepEqual(response.datalabels,["10/02/2016","11/02/2016","12/02/2016"],'Sentiment vs Time x-axis value ')
            assert.deepEqual(response.csvquantity,[12,11,12],'Demands vs Time y-axis value ');
            assert.deepEqual(response.csvlabels,["10/02/2016","11/02/2016","12/02/2016"],'Demands vs Time x-axis value ');
            assert.deepEqual(response.mentions,[90,54,77],'Mentions y-axis value ');
            assert.deepEqual(response.datacorrelationobjects,[{"sentiments":19,"demands":11},{"sentiments":33,"demands":12},{"sentiments":18,"demands":12}], 'Correlation value ');

          })
        }
        else {
          QUnit.test("Testing for UI ",function(assert) {
            assert.equal(response.language,language,'Language Value ');
            assert.equal(response.country,country,'Country Value');
            assert.equal(response.month_start,month_start,'From Month Value ');
            assert.equal(response.year_start,year_start,'From Year Value ')
            assert.equal(response.day_start,day_start,'From Day Value ');
            assert.equal(response.month_end,month_end,'To Month Value ');
            assert.equal(response.year_end,year_end,'To Year Value ');
            assert.equal(response.day_end,day_end, 'To Day Value ');
            assert.equal(response.filename,filename,'File Name');


          })
        }
          $('.glyphicon.spin').addClass('display-none');


      }

  });
});

});
