function drawWindArrows(chart, chartDiv, jsonTable, start_ts, end_ts) {
  var ARROWS_PER_CHART = 16;
  var markersSVG = chartDiv.getElementsByTagName("svg")[0];
  var markersGRP = markersSVG.getElementById("markers-group");
  var cli = chart.getChartLayoutInterface();
  var chartArea = cli.getChartAreaBoundingBox();

  // clear markers
  if (markersGRP) {
    markersSVG.removeChild(markersGRP);
  } else {
    markersGRP = document.createElementNS("http://www.w3.org/2000/svg", "g");
    markersGRP.setAttribute("id", "markers-group");
    markersSVG.insertBefore(markersGRP, markersSVG.lastChild);
  }

  var top = chartArea.top;

  // Trying to fit approx. ARROWS_PER_CHART arrows...
  var size = (chartArea.width / ARROWS_PER_CHART) *
    0.60; // ... and give it some slack

  var path_str = "," + (top - (size / 4)) +
    " " + (size / 6) + "," + (-size / 4) +
    " " + (-size / 6) + "," + size +
    " " + (-size / 6) + "," + (-size) +
    "z";

  function getTS(idx) {
    if (idx >= jsonTable.rows.length) {
      return 0;
    }
    return jsonTable.rows[idx].c[0].v.getTime();
  }

  var ts_interval = (end_ts * 1000 - start_ts * 1000) / ARROWS_PER_CHART;
  var search_ts = start_ts * 1000 + ts_interval / 2;
  var curr_match_idx = 0;

  for (var i = 0; i < ARROWS_PER_CHART; i++) {
    var curr_match_ts = getTS(curr_match_idx);
    var curr_match_diff = Math.abs(search_ts - curr_match_ts);

    // find closest data row for mid-interval value
    while (++curr_match_idx < jsonTable.rows.length) {
      var ts = getTS(curr_match_idx);
      var diff = Math.abs(search_ts - ts);
      if (diff < curr_match_diff) {
        curr_match_diff = diff;
        curr_match_ts = ts;
      } else if (diff > curr_match_diff) {
        curr_match_idx--;
        break;
      }
    }

    // inc ts for the next shot
    search_ts += ts_interval;

    // too far from searched point
    // or end of table reached
    if (
      (curr_match_diff > ts_interval / 4) ||
      (curr_match_idx >= jsonTable.rows.length)
    ) {
      continue;
    }

    var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var left = cli.getXLocation(new Date(curr_match_ts));

    p.setAttribute("d", "m " + left + path_str);
    var wind_dir = jsonTable.rows[curr_match_idx].c[3].v;
    p.setAttribute(
      "transform",
      "rotate(" + wind_dir + " " + left + " " + top + ")",
    );
    p.setAttribute("class", "arrow");
    p.setAttribute("fill", "lightblue");
    markersGRP.appendChild(p);
  }
}

export async function drawCharts(start_day) {
  if ((typeof start_day === "undefined") || isNaN(start_day)) {
    start_day = 0;
  }
  // nothing specified, display the last 24 hours
  var d = new Date();
  if (start_day == 0) {
    d.setDate(d.getDate() - 1);
  } else {
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    d.setDate(d.getDate() + start_day);
  }

  var start_ts = d.getTime() / 1000;
  var end_ts = start_ts + 24 * 60 * 60;
  
  var wind_options = {
    title: "Wind (km/h)",
    backgroundColor: "transparent",
    titleTextStyle: { color: "FFFFFF" },
    hAxis: {
      format: "HH:mm",
      minValue: new Date(start_ts * 1000),
      maxValue: new Date(end_ts * 1000),
      textStyle: { color: "FFFFFF" },
      gridlines: { color: "444444" },
    },
    vAxis: {
      format: "###",
      minValue: 0,
      viewWindow: { min: 0 },
      textStyle: { color: "FFFFFF" },
      gridlines: { color: "444444" },
      minorGridlines: { color: "666666" },
    },
    legend: {
      position: 'bottom',
      textStyle: { color: "FFFFFF" },
    },
    chartArea: { width: "90%" },
    crosshair: {
      orientation: "vertical",
      trigger: "focus",
      focused: { color: "#A5A5A5", opacity: "0.5" },
    },
    focusTarget: "category",
    colors: ["coral", "LightSkyBlue"],
    lineWidth: 1,
  };

  const charts = new Array();
  charts.push(await drawChart("wind", wind_options, start_ts, end_ts, drawWindArrows));

  var temp_options = {
    colors: ["LightSkyBlue"],
    title: "Temperatur (\u00BAC)",
    titleTextStyle: { color: "FFFFFF" },
    backgroundColor: "transparent",
    hAxis: {
      format: "HH:mm",
      minValue: new Date(start_ts * 1000),
      maxValue: new Date(end_ts * 1000),
      textStyle: { color: "FFFFFF" },
      gridlines: { color: "444444" },
    },
    vAxis: {
      format: "##",
      textStyle: { color: "FFFFFF" },
      gridlines: { color: "444444" },
      minorGridlines: { color: "666666" },
    },
    legend: { position: "none" },
    chartArea: { width: "90%" },
    crosshair: {
      orientation: "vertical",
      trigger: "focus",
      focused: { color: "#A5A5A5", opacity: "0.5" },
    },
    focusTarget: "category",
    lineWidth: 1,
  };

  charts.push(await drawChart("temp", temp_options, start_ts, end_ts, null));
  return charts;
}

async function drawChart(type, options, start_ts, end_ts, onready) {
  var chartDiv = document.getElementById(type + "-chart");
  var dataUrl = "https://camdb.nlvms.de/php/get_data.php?item=" + type;
  if (start_ts) dataUrl += "&start=" + start_ts;
  if (end_ts) dataUrl += "&end=" + end_ts;

  try {
    const response = await fetch(dataUrl);
    const jsonData = await response.json();
    const data = new google.visualization.DataTable(jsonData);
    const dateFormatter = new google.visualization.DateFormat({
      pattern: "EEEE HH:mm",
    });
    dateFormatter.format(data, 0);
    const chart = new google.visualization.LineChart(chartDiv);
    if (onready) {
      google.visualization.events.addListener(chart, "ready", function () {
        onready(chart, chartDiv, jsonData, start_ts, end_ts);
      });
    }
    chart.draw(data, options);

    // redraw graph when window resize is completed
    window.addEventListener("resizeEnd", function () {
      chart.draw(data, options);
    });
    return chart;
  } catch(err) {
    google.visualization.errors.addError(
      chartDiv,
      err.message,
    );
  };
}
