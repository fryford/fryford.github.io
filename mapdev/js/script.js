
//test if browser supports webGL

if(Modernizr.webgl) {
	
	//Load data and config file
	d3.queue()
		.defer(d3.csv, "data/chnglem.csv")
		.defer(d3.json, "data/config.json")
		.defer(d3.json, "data/geog.json")
		.await(ready);
		
	
	function ready (error, data, config, geog){
		
		//Set up global variables
		dvc = {};
		dvc.curr = "yr1";
		oldAREACD = "";
		
		//Fire design functions
		selectlist(data);
		
		//Number format
		displayformat = d3.format(".1f");
		legendformat = d3.format(".0f");
		
		
		//Mapbox key (must hide)
		//mapboxgl.accessToken = 'pk.eyJ1Ijoib25zZGF0YXZpcyIsImEiOiJjamMxdDduNnAwNW9kMzJyMjQ0bHJmMnI1In0.3PkmH-GL8jBbiWlFB1IQ7Q';
		
		//set max bounds (stops loading unnessary tiles
//		var bounds = [
//			[-19.8544921875, 40.82380908513249], // Southwest coordinates
//			[10.021484375, 68.478568831926395]  // Northeast coordinates
//		];
		
		//set up basemap
		map = new mapboxgl.Map({
		  container: 'map', // container id
		  style: 'https://free.tilehosting.com/styles/positron/style.json?key=ZBXiR1SHvcgszCLwyOFe', //stylesheet location
		  center: [-2.5, 54], // starting position
		  zoom: 4.5, // starting zoom
		  maxZoom: 13 //
		});
		
		// Add zoom and rotation controls to the map.
		map.addControl(new mapboxgl.NavigationControl());
		
		// Add geolocation controls to the map.
		map.addControl(new mapboxgl.GeolocateControl({
			positionOptions: {
				enableHighAccuracy: true
			},
			trackUserLocation: true
		}));
		
		
		//set up d3 color scales
				
		rateById = {};
		areaById = {};

		data.forEach(function(d) { rateById[d.AREACD] = +eval("d." + dvc.curr); areaById[d.AREACD] = d.AREANM});	
		
		
		//Flatten data values and work out breaks
		var values =  data.map(function(d) { return +eval("d." + dvc.curr); }).filter(function(d) {return !isNaN(d)}).sort(d3.ascending);
		
		if(config.ons.breaks =="jenks") {
			breaks = ss.ckmeans(values, (config.ons.numberBreaks+1)).map(function(cluster) {
			  return cluster[0];
			});
		}
		else if (config.ons.breaks == "equal") {
			breaks = ss.equalIntervalBreaks(values, config.ons.numberBreaks);
		}
		else {breaks = config.ons.breaks[a];};
		
		//set up d3 color scales
		color = d3.scaleThreshold()
				.domain(breaks.slice(1))
				.range(colorbrewer.YlGn[5]);
		
		//now ranges are set we can call draw the key
		createKey(config);
		
		//convert topojson to geojson
		// Would love not to specify exact object - can we avoid?
		//var areas = topojson.feature(geog, geog.objects.LA2014merc);
		for(key in geog.objects){
			var areas = topojson.feature(geog, geog.objects[key])
		}
		
		bounds = turf.extent(areas);
		
	//	map.fitBounds([[bounds[0],bounds[1]], [bounds[2], bounds[3]]]);
		
		setTimeout(function(){
			map.fitBounds([[bounds[0],bounds[1]], [bounds[2], bounds[3]]])
		},100);
		
		// Add some
		setTimeout(function(){
			map.setMaxBounds(map.getBounds());
		},1000);
				
		//and add properties to the geojson based on the csv file we've read in
		areas.features.map(function(d,i) {
			
		  d.properties.fill = color(rateById[d.properties.AREACD]) 
		});
		
		
		specificpolygon = areas.features.filter(function(d) {return d.properties.AREACD == "S12000028"})
	
		specific = turf.extent(specificpolygon[0].geometry);
		
		map.on('load', function() {
		  
		
			map.addSource('area', { 'type': 'geojson', 'data': areas });
		
			
			  map.addLayer({
				  'id': 'area',
				  'type': 'fill',
				  'source': 'area',
				  'layout': {},
				  'paint': {
					  'fill-color': {
							type: 'identity',
							property: 'fill',
					   },
					  'fill-opacity': 0.7,
					  'fill-outline-color': '#fff'
				  }
			  });
			
			
			map.addLayer({
				"id": "state-fills-hover",
				"type": "line",
				"source": "area",
				"layout": {},
				"paint": {
					"line-color": "#000",
					"line-width": 2
				},
				"filter": ["==", "AREACD", ""]
			});
					
			  map.addLayer({
				  'id': 'area_labels',
				  'type': 'symbol',
				  'source': 'area',
				  'minzoom': 10,
				  'layout': {
					  "text-field": '{AREANM}',
					  "text-font": ["DIN Offc Pro Medium","Arial Unicode MS Regular"],
					  "text-size": 14
				  },
				  'paint': {
					  "text-color": "#666",
					  "text-halo-color": "#fff",
					  "text-halo-width": 1,
					  "text-halo-blur": 1
				  }
			  });
			
		
			//Highlight stroke on mouseover (and show area information)
			map.on("mousemove", "area", onMove);
	
			// Reset the state-fills-hover layer's filter when the mouse leaves the layer.
			map.on("mouseleave", "area", onLeave);
			
			//
			map.on("click", "area", onClick);
	
		});
		
		function onMove(e) {
				newAREACD = e.features[0].properties.AREACD;
				
				if(newAREACD != oldAREACD) {
					oldAREACD = e.features[0].properties.AREACD;
					map.setFilter("state-fills-hover", ["==", "AREACD", e.features[0].properties.AREACD]);
					
					selectArea(e.features[0].properties.AREACD);
					setAxisVal(e.features[0].properties.AREACD);
				}
		};
		
					
		function onLeave() {
				map.setFilter("state-fills-hover", ["==", "AREACD", ""]);
				oldAREACD = "";
				$("#areaselect").val("").trigger("chosen:updated");
				hideaxisVal();
		};
			
		function onClick(e) {
				disableMouseEvents();
				newAREACD = e.features[0].properties.AREACD;
				
				if(newAREACD != oldAREACD) {
					oldAREACD = e.features[0].properties.AREACD;
					map.setFilter("state-fills-hover", ["==", "AREACD", e.features[0].properties.AREACD]);
					
					selectArea(e.features[0].properties.AREACD);
					setAxisVal(e.features[0].properties.AREACD);
				}
		};	
	
		function disableMouseEvents() {
				map.off("mousemove", "area", onMove);
				map.off("mouseleave", "area", onLeave);	
		}
		
		function enableMouseEvents() {
				map.on("mousemove", "area", onMove);
				map.on("click", "area", onClick);
				map.on("mouseleave", "area", onLeave);	
		}
		
		function selectArea(code) {
			$("#areaselect").val(code).trigger("chosen:updated");
		}
		
		function zoomToArea(code) {
			
			specificpolygon = areas.features.filter(function(d) {return d.properties.AREACD == code})
		
			specific = turf.extent(specificpolygon[0].geometry);
			
			map.fitBounds([[specific[0],specific[1]], [specific[2], specific[3]]], {
  				padding: {top: 150, bottom:150, left: 100, right: 100}
			});
				
		}
		
		function resetZoom() {
			
			map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]]);
				
		}
		
		
		function setAxisVal(code) {
			d3.select("#currLine")
				.transition()
				.duration(400)
				.attr("x1", x(rateById[code]))
				.attr("x2", x(rateById[code]))
				.style("opacity",1);
				
			d3.select("#currVal").text(displayformat(rateById[code]))
				.transition()
				.duration(400)
				.attr("x", x(rateById[code]))
				.style("opacity",1);
		}
		
		function hideaxisVal() {
			d3.select("#currLine")
				.style("opacity",0)
				
			d3.select("#currVal").text("")
				.style("opacity",0)
		}
		
		function createKey(config){

			keywidth = d3.select("#keydiv").node().getBoundingClientRect().width;
			
			var svgkey = d3.select("#keydiv")
				.append("svg")
				.attr("id", "key")
				.attr("width", keywidth)
				.attr("height",65);
		
	
			var color = d3.scaleThreshold()
			   .domain(breaks)
			   .range(colorbrewer.YlGn[5]);
	
			// Set up scales for legend
			x = d3.scaleLinear()
				.domain([breaks[0], breaks[5]]) /*range for data*/
				.range([0,keywidth-30]); /*range for pixels*/
	
	
			var xAxis = d3.axisBottom(x)
				.tickSize(15)
				.tickValues(color.domain())
				.tickFormat(legendformat);
	
			var g2 = svgkey.append("g").attr("id","horiz")
				.attr("transform", "translate(15,30)");
	
	
			keyhor = d3.select("#horiz");
	
			g2.selectAll("rect")
				.data(color.range().map(function(d,i) {
	
				  return {
					x0: i ? x(color.domain()[i+1]) : x.range()[0],
					x1: i < color.domain().length ? x(color.domain()[i+1]) : x.range()[1],
					z: d
				  };
				}))
			  .enter().append("rect")
				.attr("class", "blocks")
				.attr("height", 8)
				.attr("x", function(d) {
					 return d.x0; })
				.attr("width", function(d) {return d.x1 - d.x0; })
				.style("opacity",0.8)
				.style("fill", function(d) { return d.z; });
	
	
			g2.append("line")
				.attr("id", "currLine")
				.attr("x1", x(10))
				.attr("x2", x(10))
				.attr("y1", -10)
				.attr("y2", 12)
				.attr("stroke-width","2px")
				.attr("stroke","#000")
				.attr("opacity",0);
				
			g2.append("text")
				.attr("id", "currVal")
				.attr("x", x(10))
				.attr("y", -15)
				.attr("fill","#000")
				.text("");
			
				
	
			keyhor.selectAll("rect")
				.data(color.range().map(function(d, i) {
				  return {
					x0: i ? x(color.domain()[i]) : x.range()[0],
					x1: i < color.domain().length ? x(color.domain()[i+1]) : x.range()[1],
					z: d
				  };
				}))
				.attr("x", function(d) { return d.x0; })
				.attr("width", function(d) { return d.x1 - d.x0; })
				.style("fill", function(d) { return d.z; });
	
			keyhor.call(xAxis).append("text")
				.attr("id", "caption")
				.attr("x", -63)
				.attr("y", -20)
				.text("");
	
			keyhor.append("rect")
				.attr("id","keybar")
				.attr("width",8)
				.attr("height",0)
				.attr("transform","translate(15,0)")
				.style("fill", "#ccc")
				.attr("x",x(0));
	
	
	
			d3.select("#horiz").selectAll("text").attr("transform",function(d,i){
					// if there are more that 4 breaks, so > 5 ticks, then drop every other.
					if(i % 2 && dvc.jenksSteps > config.ons.dropXtick){return "translate(0,10)"} }
			);
			//Temporary	hardcode unit text																
			dvc.unittext = "change in life expectancy";
			
			d3.select("#keydiv").append("p").attr("id","keyunit").style("margin-top","-10px").style("margin-left","10px").text(dvc.unittext);

	} // Ends create key
		
		function selectlist(datacsv) {

			var areacodes =  datacsv.map(function(d) { return d.AREACD; });
			var areanames =  datacsv.map(function(d) { return d.AREANM; });
			var menuarea = d3.zip(areanames,areacodes).sort(function(a, b){ return d3.ascending(a[0], b[0]); });

			// Build option menu for occupations
			var optns = d3.select("#selectNav").append("div").attr("id","sel").append("select")
				.attr("id","areaselect")
				.attr("style","width:98%")
				.attr("class","chosen-select");


			optns.append("option")
				.attr("value","first")
				.text("");

			optns.selectAll("p").data(menuarea).enter().append("option")
				.attr("value", function(d){ return d[1]})
				.text(function(d){ return d[0]});

			myId=null;

			$('#areaselect').chosen({width: "98%", allow_single_deselect:true}).on('change',function(evt,params){

					if(typeof params != 'undefined') {

							disableMouseEvents();
							
							map.setFilter("state-fills-hover", ["==", "AREACD", params.selected]);
					
							selectArea(params.selected);
							setAxisVal(params.selected);
							
							zoomToArea(params.selected);
							
					}
					else {
							enableMouseEvents();
							hideaxisVal();
							onLeave();
							resetZoom();
					}

			});

	};
		
	}

} else {
	
	//provide fallback for browsers that don't support webGL
	d3.select('#map').remove();
	d3.select('body').append('p').html("Unfortunately your browser does not support WebGL. If you're able to please upgrade to a modern browser - <a href='https://www.gov.uk/help/browsers' target='_blank'</a> ")	

}
