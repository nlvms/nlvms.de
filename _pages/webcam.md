---
permalink: /webcam/
---

<div class="chart_wrap">
    <div id="wind-chart" class="chart"></div>
</div>

<div class="chart_wrap">
    <div id="temp-chart" class="chart"></div>
</div>

<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>

<script src="/assets/js/draw_charts.js" ></script>

<script>
  google.charts.load('current', {'packages':['corechart'], 'language': 'de'});
  google.charts.setOnLoadCallback(drawCharts);
</script>
