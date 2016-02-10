
$( "#search" ).autocomplete({
      minLength: 0,
      source: function(request, response){
        var mapped = 'ye';
        return $.ajax({
           type: 'GET',
            url: "https://s.yimg.com/aq/autoc?query="+$("#search").val()+"&region=US&lang=en-US&callback=finance_charts_json_callback",
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
      focus: function( event, ui ) {
        $( "#search" ).val( ui.item.label );
        return false;
      },
      select: function( event, ui ) {
        $( "#search" ).val( ui.item.label );
      }
    })
    .autocomplete( "instance" )._renderItem = function( ul, item ) {
      return $( "<li>" )
        .append( "<a>" + item.label + "<br>" + item.desc + "</a>" )
        .appendTo( ul );
    };
