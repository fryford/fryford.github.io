// Build file selection

		d3.select("#selectfile")
		  .append("input")
          .attr("type", "file")
          .attr("accept", ".csv")
          .on("change", function() {
            var file = d3.event.target.files[0];
						console.log(file)
            if (file) {
              var reader = new FileReader();
                reader.onloadend = function(evt) {
                  dataUrl = evt.target.result;

              };
             reader.readAsDataURL(file);
            }
         })

		d3.select("#selectfile")
				.append("label")
				.attr("class","labelplay",)
				.text("or play with sample data")
				.append("input")
				.attr("type", "checkbox")
				.on("change", function() {
					dataUrl = "suicides.csv"
			  });


		 d3.select("#numberofbreaks")
		 .html("then the number of breaks...<br>")
		 .style("font-weight","bold")
		  .append("input")
		  .attr("id","breaks")
          .attr("type", "number")
		  .attr("min","1")
		  .attr("max","15")
		  .attr("value","5");
		  //.on("change", function(){previewCsvUrl(dataUrl);})


		d3.select("#gobutton").on("click", function(){previewCsvUrl(dataUrl);});

function previewCsvUrl(dataUrl) {

		d3.select("#jenksvalues").selectAll("*").remove();

		nobreaks = d3.select("#breaks").node().value;

		d3.csv( dataUrl, function( rows ) {

		row = rows[0];

		values = [];


		for (key in row) {

		  values[key] =  rows.sort(function(a, b) {return a[key] - b[key];}).map(function(d) { return +eval("d." + key); }).filter(function(d) {return !isNaN(d)})

			breaks2 = [];

				ss.ckmeans(values[key], +nobreaks).map(function(cluster,i) {
					if(i<+nobreaks-1) {
						breaks2.push(cluster[0]);
					} else {
						breaks2.push(cluster[0])
						//if the last cluster take the last max value
						breaks2.push(cluster[cluster.length-1]);
					}
				});


			breaksxx = ss.equalIntervalBreaks(values[key], +nobreaks);

			breaks3 = breaksxx.map(function(fff,i) {
				return Math.round(fff)
			})


			arraylength = Math.round(values[key].length/+nobreaks)

			breaks4 = [];

			clusters = ss.chunk(values[key], arraylength);

			clusters.map(function(cluster,i) {
				if(clusters.length > +nobreaks) {
						if(i<+nobreaks) {
							breaks4.push(cluster[0]);
						} else {
							//if the last cluster take the last max value
							breaks4.push(cluster[cluster.length-1]);
						}
				} else {
					if(i<+nobreaks-1) {
						breaks4.push(cluster[0]);
					} else {

						breaks4.push(cluster[0])
						//if the last cluster take the last max value
						breaks4.push(cluster[cluster.length-1]);
					}
				}
			});


			breaks[key] = [[breaks2],[breaks3],[breaks4]];

		}
		d3.json("js/config.json", function(error, config) {
			dvc=config;
			drawGraphic(rows);
		})

	})

}


var pymChild = null;

function drawGraphic(graphic_data) {

	d3.select("#vis").selectAll('*').remove();

  bodywidth = parseInt(d3.select("#vis").style("width"))


  if(bodywidth > dvc.ons.thresholds_sm_md[1]) {
    size = 2;
		ticks = 4;
  } else if (bodywidth > dvc.ons.thresholds_sm_md[0]) {
    size = 1;
		ticks = 4;
  } else {
    size = 0;
		ticks = 2; 
  }

	row = graphic_data[0];

	values = [];


for (key in row) {

	d3.select("#vis")
		.append("div")
		.attr("id","varlabel")
		.text("variable: " + key)

  var margin = {top:dvc.ons.margin_top_right_bottom_left[0], right:dvc.ons.margin_top_right_bottom_left[1], bottom:dvc.ons.margin_top_right_bottom_left[2], left:dvc.ons.margin_top_right_bottom_left[3]},

  width = (bodywidth/3) - margin.left - margin.right,
  height = (((bodywidth/3) / dvc.ons.aspectRatio_sm_md_lg[size][0]) * dvc.ons.aspectRatio_sm_md_lg[size][1]) - margin.top - margin.bottom;

  // var parseDate = d3.timeParse("%d/%m/%Y");
  var tickformat = d3.format(",.0%");

  // x scale for time
  var x = d3.scaleLinear()
      .range([0, width])
      //.clamp(true);

  // y scale for histogram
  var y = d3.scaleLinear()
      .range([height, 0]);



		values[key] =  graphic_data.sort(function(a, b) {return a[key] - b[key];}).map(function(d) {return {value: +eval("d." + key)}; });

  // load data
	//work out max values
		d3max = d3.max(values[key].map(function(d){return d.value;}))
	 	d3min = d3.min(values[key].map(function(d){return d.value;}))

    x.domain([d3min,d3max]);

    const range = (from, to, step) =>
      Array(~~((to - from) / step) + 1) // '~~' is Alternative for Math.floor()
      .fill().map((v, i) => from + i * step);

		//work out optimal bin bin_width using Freedman-Diaconis method
		//2*  (IQR(values)/ cuberoot of n)

		iqr25 = ss.quantile(values[key],0.25);

		iqr75 = ss.quantile(values[key],0.75);

		iqr = iqr25.value - iqr75.value;

		binwidth = 2 * (iqr/Math.cbrt(values[key].length))

    thresholds = range(x.domain()[0], x.domain()[1], binwidth /*25dvc.ons.bin_width*/);

    // set parameters for histogram
    var histogram = d3.histogram()
        .value(function(d) { return d.value; })
        .domain(x.domain())
        .thresholds(thresholds);


    // nest data by region
    var nest = d3.nest()
        .key(function(d) { return d.region; })
        .entries(values[key]);

    // apply histogram generator to each region's values
    var regions = nest.map(function(d) {
      return {
        key: d.key,
        values: histogram(d.values),
        no: d.values.length
      }
    });

    // calculate local y-max for each region
    var localMax = regions.map(function(d) {
      return {
        region: d.key,
        max: d3.max(d.values, function(s) {
          return s.length/d.no
        })
      }
    })

    if(dvc.ons.yAxisScale == "auto") {
      // find global max
      y.domain([0, d3.max(localMax, function(d) { return d.max; })])
    } else {
      y.domain(dvc.ons.yAxisScale)
    }

    // for each region, set up a svg with axis and label

		breaksnew = ["Jenks/CKmeans","Equal Intervals","k-Quartiles"];

		for (k = 0; k < breaksnew.length; k++) {


    var svg = d3.select("#vis")
				.append("svg")
        .data(regions)
        .attr("class", "labelshow")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

		svg.append("text")
			 .attr("transform", "translate(8,20)")
			 .attr("class","breaklabel")
			 .text(breaksnew[k])

	 svg.append("text")
			 .attr("transform", "translate(8,40)")
			 .attr("class","breaklabel")
			 .text("[" + breaks[key][k][0] + "]")

    var hist = svg.append("g")
        .attr("class", "hist")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    hist.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0" + "," + height + ")")
        .call(d3.axisBottom(x)
					.ticks(ticks)
          //.tickFormat(tickformat)
        );

    hist.append("g")
        .attr("class", "axis y")
        //.attr("transform", "translate(" + width + ",0)")
        .call(d3.axisLeft(y)
          .ticks(3)
          //.tickSize(width)
          .tickFormat(tickformat)
        );

    hist.append("text")
        .attr("class", "xlabel labelshow")
        .attr("x", width/2)
        .attr("y", height + 40)
        .attr("text-anchor","middle")
        .attr("font-size", "14px")
        .html(dvc.ons.xaxislabel)


    // draw histogram bars
    var bars = hist.selectAll(".bar")
        .data(function(d) {return d.values; })
        .enter()
        .append("g")
        .attr("class", "bar")
        .attr("transform", function(s,i) {
          return "translate(" + x(s.x0) + "," + y(s.length/d3.select(this.parentNode).datum().no) + ")";
        });

    bars.append("rect")
        .attr("class", "bar")
        .attr("x", 1)
        .attr("width", function(s) { return x(s.x1) - x(s.x0); })
        .attr("height", function(s) {return height - y(s.length/d3.select(this.parentNode.parentNode).datum().no); })
        .attr("fill", "#3B7A9E");

		hist.selectAll("breaklinessss")
				.data(breaks[key][k][0])
				.enter()
				.append("line")
				.attr("class","breaklinessss")
				.attr("x1",function(d,i) {return x(d)})
				.attr("x2",function(d,i) {return x(d)})
				.attr("y1", y(0))
				.attr("y2", y(y.domain()[1]))
				.attr("stroke","#FFA500")
				.attr("stroke-width","1px")

	}



	} //end key in row

    if (pymChild) {
        pymChild.sendHeight();
    }

}
