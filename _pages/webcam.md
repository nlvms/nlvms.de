---
permalink: /webcam/
layout: splash
---

<p align="center">
<div id="time_select" class="time_select" style="width: fit-content; margin: auto;">
    <button type="button" class="time_range_button btn btn--primary btn--small" value="0">Letzten 24 Stunden</button>
    <button type="button" class="time_range_button btn btn--small" value="-1">Gestern</button>
    <!-- Buttons get inserted here -->
</div>
</p>

<p>
    <div id="wind-chart"></div>
</p>

<p>
    <div id="temp-chart"></div>
</p>

<div class="chart_wrap">
    <div id="vbatt-chart" class="chart"></div>
</div>

<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>

<script src="/assets/js/draw_charts.js" ></script>

<script>
  $(document).ready(function() {
    //create buttons
    var d = new Date("2019-09-30T10:00:00");
    console.log(d)
    var days = ['Sonntag','Montag','Dienstag','Mittwoch',
               'Donnerstag','Freitag','Samstag'];

    var offset = -2;
    d.setDate(d.getDate() + offset);
    for(var i=0; i<5; i++) {
      $("#time_select").append(
        '<button type="button"' +
        ' class="time_range_button btn btn--small"' +
        ' style="margin-right: 0.25rem;"' +
        ' value="' + offset + '">' +
        days[d.getDay()] + '</button>'
      );
      offset--;
      d.setDate(d.getDate()-1);
    }

    $(".time_range_button").click(function() {
      $(".time_range_button").removeClass("btn--primary");
      $(this).addClass("btn--primary");
      drawCharts(parseInt(this.value));
    });

    $("#vbatt-link").click(function() { drawVBatt(); });

    //create trigger to resizeEnd event
    $(window).resize(function() {
      if(this.resizeTO) clearTimeout(this.resizeTO);
      this.resizeTO = setTimeout(function() {
        $(this).trigger('resizeEnd');
      }, 500);
    });
 });

  google.charts.load('current', {'packages':['corechart'], 'language': 'de'});
  google.charts.setOnLoadCallback(drawCharts);
</script>
