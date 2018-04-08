if (Modernizr.inlinesvg) {

var pymChild = new pym.Child();

  d3.queue()
          .defer(d3.csv, "exports.csv")
          .defer(d3.csv, "imports.csv")
          .defer(d3.json, "config.json")
          .defer(d3.json, "geo/worldjson8.json")
          .await(ready);


function ready (error, dataexports, dataimports, config, geog){

  var margin = {top: 40, right: 20, bottom: 40, left: 30};
              //width = 960 - margin.left - margin.right,
              //height = 500 - margin.top - margin.bottom;
  width=parseInt(d3.select("body").style("width"))*0.75;
  height=width*0.58
  
  mobileBreak = 600;

  var path = d3.geoPath();

  var svg = d3.select("#mapDiv")
              .append("svg")
			  .attr("id","svgMap")
              .attr("width", width)
              .attr("height", height)
              .append('g')
              .attr('class', 'map');
			  
	  
//Gradient definition		  
	var defs = svg.append("defs");
	
	var gradient = defs.append("linearGradient")
	   .attr("id", "svgGradient")
	   .attr("x1", "0%")
	   .attr("x2", "100%")
	   .attr("y1", "0%")
	   .attr("y2", "100%");
	
	gradient.append("stop")
	   .attr('class', 'start')
	   .attr("offset", "0%")
	   .attr("stop-color", "#B8860B")
	   .attr("stop-opacity", 1);
	
	gradient.append("stop")
	   .attr('class', 'end')
	   .attr("offset", "100%")
	   .attr("stop-color", "#D2376D")
	   .attr("stop-opacity", 1);

  var projection = d3.geoNaturalEarth1()
                     .scale(width*0.21)
                     .translate( [(width/2)-20, height/2+(height/2)*0.2]);

  var path = d3.geoPath().projection(projection);

  svg.append("g")
      .attr("class", "allcountry")
    .selectAll("path")
      .data(topojson.feature(geog, geog.objects.worldjson8).features)
    .enter().append("path")
	  .attr("class","countries")
	  .attr("id", function(d){return "shape" + d.properties.fips})
      .attr("d", path)
      .on("mouseover",function(d){
		highlightcountry(d.properties.fips);
        filterdata(d.properties.fips);
      })
	  .on("mouseout",function(d){
		unhighlightcountry(d.properties.fips);
        filterdata("Total");
      })
	  
	  var m = svgPanZoom("#svgMap", {
        panEnabled: true,
        controlIconsEnabled: false,
        zoomEnabled: true,
        dblClickZoomEnabled: true,
        mouseWheelZoomEnabled: true,
        zoomScaleSensitivity: 0.3,
        minZoom: 0.4,
        maxZoom: 5,
        fit: false,
        contain: false,
        center: false,
        refreshRate: 'auto'
    });
  
getLastYear();
getColumnNames();
getCentroids();
createBarcode();
selectList();
enableZoom();
barChartInitial();


//gets the last year in the dataset
function getLastYear(){
  var years = dataimports.map(function(obj) { return obj.Year; });
  years = years.filter(function(v,i) { return years.indexOf(v) == i; });
  yearssorted = years.sort(function(a, b){return +a-+b});
  lastyear = yearssorted[yearssorted.length-1]
}

//gets the commodity codes
function getColumnNames(){
  //Get column names and number
        variables = [];
        for (var column in dataimports[0]) {
            if (column == "CountryName") continue;
            if (column == "CountryId") continue;
            if (column == "Year") continue;
			if (column == "Total") continue;
            variables.push(column);
        }
}

function filterdata(code){
latestcountrydataI = dataimports.filter(function(d){return d.CountryId==code && d.Year==lastyear})
latestcountrydataE = dataexports.filter(function(d){return d.CountryId==code && d.Year==lastyear})

//First 
lastyeardataI = [];
for (var column in latestcountrydataI[0]) {
    if (column == "CountryName") continue;
    if (column == "CountryId") continue;
    if (column == "Year") continue;
	if (column == "Total") continue;
    lastyeardataI.push(latestcountrydataI[0][column]);
}

lastyeardataE = [];
for (var column in latestcountrydataE[0]) {
    if (column == "CountryName") continue;
    if (column == "CountryId") continue;
    if (column == "Year") continue;
	if (column == "Total") continue;
    lastyeardataE.push(latestcountrydataE[0][column]);
}

//zip the data with list of variables, sort it descending, then take top 5
zippeddataI=d3.zip(lastyeardataI,variables).sort(function(a,b){return d3.descending(+a[0],+b[0]);}).slice(0,5)

//zip the data with list of variables, sort it descending, then take top 5
zippeddataE=d3.zip(lastyeardataE,variables).sort(function(a,b){return d3.descending(+a[0],+b[0]);}).slice(0,5)

//get the codes for the top 5 commodities
top5codesI=[];
zippeddataI.forEach(function(d,i){
  top5codesI.push(d[1])
})

top5codesE=[];
zippeddataE.forEach(function(d,i){
  top5codesE.push(d[1])
})

//get data for that country for all years
countrydata_allI = dataimports.filter(function(d){return d.CountryId==code})
countrydata_allE = dataexports.filter(function(d){return d.CountryId==code})

//find the data for all the top 5 commodities
temparrayI=[]
countrydata_allI.forEach(function(d){
    for(var i=0;i<top5codesI.length;i++){
      temparrayI.push({year:+d.Year,code:top5codesI[i],amt:+d[top5codesI[i]]})
    }
  })
  
temparrayE=[]
countrydata_allE.forEach(function(d){
    for(var i=0;i<top5codesI.length;i++){
      temparrayE.push({year:+d.Year,code:top5codesE[i],amt:+d[top5codesE[i]]})
    }
  })

//put it into a format for sparklines
newarrayI = {};
for(var i=0;i<top5codesI.length;i++){
  newarrayI[top5codesI[i]]=temparrayI.filter(function(d){return d.code==top5codesI[i]})
                                  .map(function(d){return {date:d3.timeParse("%Y")(d.year),amt:d.amt}})
}

newarrayE = {};
for(var i=0;i<top5codesE.length;i++){
  newarrayE[top5codesE[i]]=temparrayE.filter(function(d){return d.code==top5codesE[i]})
                                  .map(function(d){return {date:d3.timeParse("%Y")(d.year),amt:d.amt}})
}


console.log("newarrayI")
console.log(newarrayI)
console.log(d3.entries(newarrayI))

perchangeI=[]
for(var i=0;i<top5codesI.length;i++){
    console.log()
    perchangeI[i]=(newarrayI[top5codesI[i]][top5codesI.length-1].amt-newarrayI[top5codesI[i]][0].amt)/newarrayI[top5codesI[i]][0].amt
     console.log(perchangeI[i])
}

perchangeE=[]
for(var i=0;i<top5codesE.length;i++){
  console.log()
  perchangeE[i]=(newarrayE[top5codesE[i]][top5codesE.length-1].amt-newarrayE[top5codesE[i]][0].amt)/newarrayE[top5codesE[i]][0].amt
}

//stuff for bar charts
barsI = []
for (var i=0;i<top5codesI.length;i++){
  barsI.push({'name':top5codesI[i],'amt':+latestcountrydataI[0][top5codesI[i]]})
}

barsE = []
for (var i=0;i<top5codesE.length;i++){
  barsE.push({'name':top5codesE[i],'amt':+latestcountrydataE[0][top5codesE[i]]})
}

//find the max number for the x domain
xMaxI = d3.max(barsI,function(v){
  var n = v.amt;
  return Math.ceil(n);
})

xMaxE = d3.max(barsE,function(v){
  var n = v.amt;
  return Math.ceil(n);
})

xMax = d3.max([xMaxI,xMaxE])

x.domain([0,xMax])

svgBarI.select(".x")
    .transition()
	.call(xAxis);

yImport.domain(top5codesI);

svgBarI.select('.y')
      .call(yAxisImport);

svgBarI.selectAll(".barsI").selectAll('rect')
    .data(barsI)
    .transition()
    .attr("y", function(d){return yImport(d.name)})
    .attr("width", function(d){return x(d.amt)})
    .attr("height", yImport.bandwidth()/3)
	
svgBarE.select(".x")
    .transition()
	.call(xAxis);

yExport.domain(top5codesE);

svgBarE.select('.y')
      .call(yAxisExport);

svgBarE.selectAll(".barsE").selectAll('rect')
    .data(barsE)
    .transition()
    .attr("y", function(d){return yExport(d.name)})
    .attr("width", function(d){return x(d.amt)})
    .attr("height", yExport.bandwidth()/3)

//adjust text position

d3.selectAll(".y text")
    .attr("transform","translate(14,3)")
    .attr("stroke","#fff")
    .attr("stroke-width","3px")
    .attr("paint-order","stroke")
	//.each(fadeToFront2);


//sparkline stuff Imports

ysparkI.domain([d3.min(d3.entries(newarrayI),function(c){
                  return d3.min(c.value, function(v){
                    var n = v.amt;
                    return Math.floor(n);
                  })
                })
                ,
                d3.max(d3.entries(newarrayI), function(c) {
									return d3.max(c.value, function(v) {
										var n = v.amt;
										return Math.ceil(n);
									});
								})])

svgSparkI.select('.ysparkI')
        .transition()
        .call(yAxisSpark).select(".domain").remove();

svgSparkI.select('#sparkyI').selectAll('path')
        .data(d3.entries(newarrayI))
        .style("stroke",colour_palette[0])
        .attr("transform",function(d,i){
          if(i!=0){
            return "translate(0,"+(i*yImport.bandwidth()+i*yImport.bandwidth()/10+yImport.bandwidth()/20)+")"}
          else {
            return "translate(0,"+(i*yImport.bandwidth()+yImport.bandwidth()/20)+")"}
          })

        .transition()
        .attr('d', function(d) {
            return lineI(d.value);
        });



//sparkline stuff

ysparkI.domain([d3.min(d3.entries(newarrayI),function(c){
                  return d3.min(c.value, function(v){
                    var n = v.amt;
                    return Math.floor(n);
                  })
                })
                ,
                d3.max(d3.entries(newarrayI), function(c) {
									return d3.max(c.value, function(v) {
										var n = v.amt;
										return Math.ceil(n);
									});
								})])

svgSparkI.select('.ysparkI')
        .transition()
        .call(yAxisSpark);

svgSparkI.select('.ysparkI').select(".domain").remove();

svgSparkI.select('#sparkyI').selectAll('path')
        .data(d3.entries(newarrayI))
        .style("stroke",colour_palette[0])
        .attr("transform",function(d,i){
          if(i!=0){
            return "translate(0,"+(i*yImport.bandwidth()+i*yImport.bandwidth()/10+yImport.bandwidth()/20)+")"}
          else {
            return "translate(0,"+(i*yImport.bandwidth()+yImport.bandwidth()/20)+")"}
          })
        .transition()
        .attr('d', function(d) {
            return lineI(d.value);
        });
		
//sparkline stuff Exports

ysparkE.domain([d3.min(d3.entries(newarrayE),function(c){
                  return d3.min(c.value, function(v){
                    var n = v.amt;
                    return Math.floor(n);
                  })
                })
                ,
                d3.max(d3.entries(newarrayE), function(c) {
									return d3.max(c.value, function(v) {
										var n = v.amt;
										return Math.ceil(n);
									});
								})])

svgSparkE.select('.ysparkE')
        .transition()
        .call(yAxisSpark).select(".domain").remove();

svgSparkE.select('#sparkyE').selectAll('path')
        .data(d3.entries(newarrayE))
        .style("stroke",colour_palette[1])
        .attr("transform",function(d,i){
          if(i!=0){
            return "translate(0,"+(i*yExport.bandwidth()+i*yExport.bandwidth()/10+yExport.bandwidth()/20)+")"}
          else {
            return "translate(0,"+(i*yExport.bandwidth()+yExport.bandwidth()/20)+")"}
          })

        .transition()
        .attr('d', function(d) {
            return lineE(d.value);
        });



//sparkline stuff

ysparkE.domain([d3.min(d3.entries(newarrayE),function(c){
                  return d3.min(c.value, function(v){
                    var n = v.amt;
                    return Math.floor(n);
                  })
                })
                ,
                d3.max(d3.entries(newarrayE), function(c) {
									return d3.max(c.value, function(v) {
										var n = v.amt;
										return Math.ceil(n);
									});
								})])

svgSparkE.select('.ysparkE')
        .transition()
        .call(yAxisSpark);

svgSparkE.select('.ysparkE').select(".domain").remove();

svgSparkE.select('#sparkyE').selectAll('path')
        .data(d3.entries(newarrayE))
        .style("stroke",colour_palette[1])
        .attr("transform",function(d,i){
          if(i!=0){
            return "translate(0,"+(i*yExport.bandwidth()+i*yExport.bandwidth()/10+yExport.bandwidth()/20)+")"}
          else {
            return "translate(0,"+(i*yExport.bandwidth()+yExport.bandwidth()/20)+")"}
          })
        .transition()
        .attr('d', function(d) {
            return lineE(d.value);
        });

//do percentage change for each
// perchangeI.forEach(function(d,i){
  d3.select(".perchangeI").selectAll('text')
  .data(perchangeI)
  .attr('x',3*width/48)
  .attr('y',function(d,i){return yImport.bandwidth()*i+i*yImport.bandwidth()/10+yImport.bandwidth()/2})
  .attr("text-anchor", "start")
  .style("font-size", "12px")
  .style("fill", "#666")
  .transition()
  .text(function(d){if(isFinite(d) == true){return d3.format(",.0%")(d)} else {return "-"}});
  
d3.select(".perchangeE").selectAll('text')
  .data(perchangeE)
  .attr('x',3*width/48)
  .attr('y',function(d,i){return yExport.bandwidth()*i+i*yExport.bandwidth()/10+yExport.bandwidth()/2})
  .attr("text-anchor", "start")
  .style("font-size", "12px")
  .style("fill", "#666")
  .transition()
  .text(function(d){if(isFinite(d) == true){return d3.format(",.0%")(d)} else {return "-"}});
  
// })

}//end filterdata

function getCentroids() {

			//centroid select cases where the centroid doesn't work
			centr = []

			centr['UK'] = ['[-1.41,52.7]'];
			centr['CI'] = ['[-72.94,-45.39]'];//Chili
			centr['CA'] = ['[-107.57,52.0]'];//Canada
			centr['US'] = ['[-101,39.23]'];//US
			centr['TH'] = ['[-1.41,52.7]'];//Thailand
			centr['NZ'] = ['[176,-39.27]'];//NZ
			centr['NO'] = ['[8.47,60.47]'];//Norway
			centr['GR'] = ['[22.06,39.19]'];//Greece
			centr['HR'] = ['[15.13,44.59]'];//Croatia
			centr['MY'] = ['[102.21,3.64]'];//Malaysia
     		centr['PP'] = ['[143.32,-5.78]'];//Papa New Guinea
			centr['NL'] = ['[6.3,53.1]'];//Netherlands
			centr['FR'] = ['[2.21,46.22]'];//France
			centr['PO'] = ['[-9.14,38.7]'];//Portugal
			centr['AS'] = ['[133.7,-25.27]'];//Australia

			d3.selectAll(".countries").attr("data-cd", function(d,i) {if(d.properties.fips == 'UK' || d.properties.fips == 'CI' || d.properties.fips== 'CA' || d.properties.fips== 'US' || d.properties.fips== 'TH' || d.properties.fips== 'NZ' || d.properties.fips== 'NO' || d.properties.fips== 'GR' || d.properties.fips== 'HR' || d.properties.fips== 'MY' || d.properties.fips== 'PP' || d.properties.fips== 'FR' || d.properties.fips== 'PO' || d.properties.fips== 'AS')

					{return centr[d.properties.fips]} else
					{return "[" + d3.geoCentroid(d) + "]"}
			});

//		dvc.allcentroids = [];
//
//		d3.selectAll(dvc.flowdata.ons.area).each(function(d,i){
//			dvc.allcentroids.push(d3.select("#" + dvc.flowdata.ons.area[i]).attr("data-cd"));
//		});
} //end Get Centriods



function highlightcountry(countrycode) {
    
	
    
	//Update dropdown
	$("#areaselect").val(countrycode).trigger('change.select2');
	
    //Draw barcode highlight rects on top of all bars
	if(mobile == false) {
		
		console.log("I'm here");
		d3.selectAll("." + countrycode).each(fadeToFront);
		//Give map area a highlight class
		d3.select("#shape" + countrycode).classed("countries_highlights",true);
		
		
		//Draw arc from UK to destination
		var coordsfrom = d3.select("#shapeUK").attr("data-cd");
	
		var coordsto = d3.select("#shape" + countrycode).attr("data-cd");
	
		lines = [];
		
		lines.push({
			type: "LineString",
			coordinates: JSON.parse("[" + coordsto + "," + coordsfrom + "]")
		});
		
		
		d3.select(".allcountry").selectAll(".mapArcsLow")
			.data(lines)
			.enter()
			.append("path")
			.attr("class", "mapArcsLow")
			.attr("d",path)
			.attr("stroke", "url(#svgGradient)")
			.attr("stroke-width", "2px")
			.style("stroke-linecap", 'round')
			.style("stroke-linejoin", 'round')
			.attr("fill","none")
			.attr("pointer-events", "none");
    
		
	} else {
		d3.selectAll("." + countrycode).each(fadeToFront1);
	}
	
	//Get total values for imports/exports
	var importval = d3.select("#" + countrycode + "_I").attr("data-nm");
	var exportval = d3.select("#" + countrycode + "_E").attr("data-nm");
	
	//barcode labels
	d3.select("#importlabel").html("<p>Imports</p><p class='labelbold'>£"+ importval +"</p>")
	d3.select("#exportlabel").html("<p>Exports</p><p class='labelbold'>£"+ exportval +"</p>")
    
	
    //Get country name
    a = areacodes.indexOf(countrycode);
    countryname = areanames[a]
    
    //Update labels
    d3.select("#tradewith").html("UK trade with " + countryname + " <span style='font-weight:300'>2016</span>") 

	
} //end highlightcountry



function unhighlightcountry(countrycode) {
	
	//update dropdown
	$("#areaselect").val("").trigger('change.select2');
	
	console.log(countrycode);
	d3.select("#shape" + countrycode).classed("countries_highlights",false);
	d3.select(".mapArcsLow").remove();
	d3.selectAll(".highlights").remove();
    
    //Update labels
    d3.select("#tradewith").html("Overall UK trade <span style='font-weight:300'>2016</span>") 
	
	d3.select("#shape" + countrycode).classed("countries_highlights",false);
	
	//reset barcode labels
	d3.select("#importlabel").html("<p>Imports</p>")
	d3.select("#exportlabel").html("<p>Exports</p>")

} //end unhighlightcountry


function createBarcode(){
    

    
    //Get data
	barcodeimports = dataimports.filter(function(d){return d.Year==lastyear});
	barcodeexports = dataexports.filter(function(d){return d.Year==lastyear});

	var barcodeWidth=parseInt(d3.select("#barcode").style("width"));

	var barcodemarginDT = [40,0, 10, 40];
	var barcodemarginMB = [80,0, 30, 90];
	
	
	var importsTotals = barcodeimports.map(function(d,i) {
	  return {
		CountryName: d.CountryName,
		CountryId: d.CountryId,
		total: d.Total
	  };
	});

	var exportsTotals = barcodeexports.map(function(d,i) {
	  return {
		CountryName: d.CountryName,
		CountryId: d.CountryId,
		total: d.Total
	  };
	});
    
	//find max values of entire arrays (so that scale is kept constant)(first value is max)
	maxValue = d3.max([d3.max(barcodeimports, function(d) { return +d.Total;}), d3.max(barcodeexports, function(d) { return +d.Total;})]);
	
	chartWidth=parseInt(d3.select("#chartsnsparks").style("width"));
	
	if(chartWidth > mobileBreak) {
		
	mobile = false;
	
    //add labels
    
    barcodeLabels = d3.select("#barcode")
        .append("div")
		.attr("id","barcodelabels")
		.attr("class","hidden-xs")
		.html("<span style='font-weight:bold'>UK Trade</span> 2016")
		.append("div")
        .style("padding-left",barcodemarginDT[3] + "px")
        .style("padding-right",barcodemarginDT[1] + "px")
        .style("width","calc(100%-" + barcodemarginDT[3]+ " - " + barcodemarginDT[1] + ")" )
        .style("height","10px")
		
    
    barcodeLabels.append("div").attr("id","importlabel").attr("class","col-sm-6").html("<p>Imports</p>");
    barcodeLabels.append("div").attr("id","exportlabel").attr("class","col-sm-6").html("<p>Exports</p>");

	var gap = 10;

	var barWidth = (barcodeWidth - barcodemarginDT[3] - gap) / 2;

	


	

	barcodeHeight=parseInt(d3.select("#mapDiv").style("height"))-25;
	barcodeWidth=parseInt(d3.select("#barcode").style("width"));

	//create y axis scale
	barcodeyScale=d3.scaleLinear()
		.domain([0,maxValue])
		.range([barcodeHeight-barcodemarginDT[0]-barcodemarginDT[2],0]);

	barcodePlot = d3.select("#barcode").append("svg")
		.attr("id","barcodeplot")
		.attr("width",barcodeWidth)
		.attr("height",barcodeHeight);

	//create main axis
	yAxisChar=d3.axisLeft()
		.scale(barcodeyScale)
        .tickSize(barcodeWidth)
		.ticks(5);

	barcodeArea = barcodePlot.append("g")
		.attr("class","axis")
		.attr("transform","translate(" + (barcodemarginDT[3]+barcodeWidth) + "," + barcodemarginDT[0]+ ")")
		.call(yAxisChar);

	barcodeArea.append("g")
		.selectAll(".barcodeBarI")
		.data(importsTotals)
		.enter()
		.append("rect")
		.attr("id", function(d){return d.CountryId + "_I"})
		.attr("data-nm", function(d) {return d.total})
		.attr("fill","#f362b7")
		.attr("fill-opacity",0.2)
		.attr("stroke","#fff")
		.attr("stroke-opacity","0")
		.attr("stroke-width","2px")
		.attr("class", function(d){return "barcodeBarI " + d.CountryId})
		.attr("transform", "translate(" + eval(-barcodeWidth) + ",0)")
		.attr("y", function(d) {
				return barcodeyScale(Math.max(0, d.total));
		})
		.attr("height","2px")
		.attr("width",barWidth)
		.on("mouseover", function(){
			highlightcountry(this.id.slice(0, 2))
			filterdata(this.id.slice(0, 2));
		})
		.on("mouseout", function(){unhighlightcountry(this.id.slice(0, 2))});

	barcodeArea.append("g")
		.selectAll(".barcodeBarE")
		.data(exportsTotals)
		.enter()
		.append("rect")
		.attr("id", function(d){return d.CountryId + "_E"})
		.attr("data-nm", function(d) {return d.total})
		.attr("fill","#B8860B")
		.attr("fill-opacity",0.2)
		.attr("stroke","#fff")
		.attr("stroke-opacity","0")
		.attr("stroke-width","2px")
		.attr("class", function(d){return "barcodeBare " + d.CountryId})
		.attr("transform", "translate(" + eval(barWidth + gap - barcodeWidth) + ",0)")
		.attr("y", function(d) {
				return barcodeyScale(Math.max(0, d.total));
		})
		.attr("height","2px")
		.attr("width",barWidth)
		.on("mouseover", function(){
			highlightcountry(this.id.slice(0, 2))
			filterdata(this.id.slice(0, 2));
		})
		.on("mouseout", function(){unhighlightcountry(this.id.slice(0, 2))});
	} else {
		
		mobile = true;
		
		 barcodeLabels = d3.select("#barcode")
			.append("div")
			.attr("id","barcodelabels")
			.attr("class","hidden-sm")
			.html("<span style='font-weight:bold'>UK Trade</span> 2016")
			.append("div")
		
		barcodeLabels.append("div").attr("id","importlabel").attr("class","col-sm-6").html("<p>Imports</p>");
		barcodeLabels.append("div").attr("id","exportlabel").attr("class","col-sm-6").html("<p>Exports</p>");
	
		var gap = 6;
	
		barcodeHeight=200;
		barcodeWidth=chartWidth;
		
		var barHeight = (barcodeHeight - barcodemarginMB[0] - barcodemarginMB[2] - gap) / 2;
		
	
	
		//create y axis scale
		barcodeyScale=d3.scaleLinear()
			.domain([0,maxValue])
			.range([0,barcodeWidth-barcodemarginMB[1]-barcodemarginMB[3]]);
	
		barcodePlot = d3.select("#barcode").append("svg")
			.attr("id","barcodeplot")
			.attr("width",barcodeWidth)
			.attr("height",barcodeHeight);
	
		//create main axis
		xAxisChar=d3.axisBottom()
			.scale(barcodeyScale)
			.tickSize(barcodeHeight-barcodemarginMB[0] - barcodemarginMB[2])
			.ticks(5);
	
		barcodeArea = barcodePlot.append("g")
			.attr("class","axis")
			.attr("transform","translate(" + barcodemarginMB[3] +"," + barcodemarginMB[0] + ")")
			.call(xAxisChar);
	
		barcodeArea.append("g")
			.selectAll(".barcodeBarI")
			.data(importsTotals)
			.enter()
			.append("rect")
			.attr("id", function(d){return d.CountryId + "_I"})
			.attr("data-nm", function(d) {return d.total})
			.attr("fill","#f362b7")
			.attr("fill-opacity",0.2)
			.attr("stroke","#fff")
			.attr("stroke-opacity","0")
			.attr("stroke-width","2px")
			.attr("class", function(d){return "barcodeBarI " + d.CountryId})
			.attr("transform", "translate(0,0)")
			.attr("x", function(d) {
					return barcodeyScale(Math.max(0, d.total));
			})
			.attr("width","2px")
			.attr("height",barHeight)
			.on("mouseover", function(){
				highlightcountry(this.id.slice(0, 2))
				filterdata(this.id.slice(0, 2));
			})
			.on("mouseout", function(){unhighlightcountry(this.id.slice(0, 2))});
	
		barcodeArea.append("g")
			.selectAll(".barcodeBarE")
			.data(exportsTotals)
			.enter()
			.append("rect")
			.attr("id", function(d){return d.CountryId + "_E"})
			.attr("data-nm", function(d) {return d.total})
			.attr("fill","#B8860B")
			.attr("fill-opacity",0.2)
			.attr("stroke","#fff")
			.attr("stroke-opacity","0")
			.attr("stroke-width","2px")
			.attr("class", function(d){return "barcodeBarE " + d.CountryId})
			.attr("transform", "translate(0," + (barHeight + gap) + ")")
			.attr("x", function(d) {
					return barcodeyScale(Math.max(0, d.total));
			})
			.attr("width","2px")
			.attr("height",barHeight)
			.on("mouseover", function(){
				highlightcountry(this.id.slice(0, 2))
				filterdata(this.id.slice(0, 2));
			})
			.on("mouseout", function(){unhighlightcountry(this.id.slice(0, 2))});
		
	}

} // end createBarcode

//Moves SVG elements to the end of their container, so they appear "on top".
//Achieves a nice, smooth fade by duplicating the clicked element, moving the
//dupe to the front, then fading it in, while fading out the original element
//at the same time.
function fadeToFront() {

	//Select this element, that we want to move to front
	var orig = d3.select(this);
	var origNode = orig.node();

	//Clone it, and append the copy on "top" (meaning, at the end of
	var dupe = d3.select(origNode.parentNode.appendChild(origNode.cloneNode(true), origNode.nextSibling));

	//Make the new element transparent immediately, then fade it in over time
	dupe.style("fill-opacity", 0.3)
		.style("pointer-events","none")
		.attr("fill", "black")
		.attr("height","3px")
		.classed("highlights",true)
		.transition()
		.duration(200)
		.style("fill-opacity", 1.0)
		.on("end", function() {

		})


} //end fadeToFront

function fadeToFront1() {

	//Select this element, that we want to move to front
	var orig = d3.select(this);
	var origNode = orig.node();

	//Clone it, and append the copy on "top" (meaning, at the end of
	var dupe = d3.select(origNode.parentNode.appendChild(origNode.cloneNode(true), origNode.nextSibling));

	//Make the new element transparent immediately, then fade it in over time
	dupe.style("fill-opacity", 0.3)
		.style("pointer-events","none")
		.attr("fill", "black")
		.attr("width","3px")
		.classed("highlights",true)
		.transition()
		.duration(200)
		.style("fill-opacity", 1.0)
		.on("end", function() {

		})


} //end fadeToFront

function fadeToFront2() {

	//Select this element, that we want to move to front
	var orig = d3.select(this);
	var origNode = orig.node();

	//Clone it, and append the copy on "top" (meaning, at the end of
	var dupe = d3.select(origNode.parentNode.appendChild(origNode.cloneNode(true), origNode.nextSibling));

	//Make the new element transparent immediately, then fade it in over time
	dupe.attr("stroke", "none")
		.attr("paint-order",null)
		.attr("stroke-width",null);


} //end fadeToFront


function selectList() {
	
	latestcountrydataI = dataimports.filter(function(d){return d.Year==lastyear})

	areacodes =  latestcountrydataI.map(function(d) { return d.CountryId; });
	areanames =  latestcountrydataI.map(function(d) { return d.CountryName; });
	var menuarea = d3.zip(areanames,areacodes).sort(function(a, b){ return d3.ascending(a[0], b[0]); });

	// Build option menu for occupations
	var optns = d3.select("#selectNav").append("div").attr("id","sel").append("select")
		.attr("id","areaselect")
		.attr("style","width:95%")
		.attr("class","chosen-select");


	optns.append("option")


	optns.selectAll("p").data(menuarea).enter().append("option")
		.attr("value", function(d){ return d[1]})
		.text(function(d){ return d[0]});

	myId=null;

 	$('#areaselect').select2({placeholder:"Choose a trading partner",allowClear:true,dropdownParent:$('#sel')})

	$('#areaselect').on('change',function(){

			if($('#areaselect').val() != "") {
					
					d3.selectAll(".countries_highlights").classed("countries_highlights",false);
					d3.select(".mapArcsLow").remove();
					d3.selectAll(".highlights").remove();
												
					areacode = $('#areaselect').val();

					highlightcountry(areacode);
        			filterdata(areacode);
					
					disableHoverEvents();
					
			}

	});

	$("#areaselect").on("select2:unselect", function (e) {
					unhighlightcountry(areacode);
					enableHoverEvents();
	});
	
}; // end selectlist


function disableHoverEvents() {
	
	d3.select("#svgMap").style("pointer-events","none");
	d3.select("#barcode").style("pointer-events","none");
	
	
	
}; //enableHoverEvents


function enableHoverEvents() {
	d3.select("#svgMap").style("pointer-events","auto");
	d3.select("#barcode").style("pointer-events","auto");
	
}; //enableHoverEvents


function enableZoom() {
	    d3.select('.zoom-control-zoom-in').on('click', function(){m.zoomIn()});
		d3.select('.zoom-control-zoom-out').on('click', function(){m.zoomOut()});

}; //enableHoverEvents

function barChartInitial() {
//make a bar chart

chartWidth=parseInt(d3.select("#chartsnsparks").style("width"));

if(mobile == false) {
	chartWidth = (chartWidth*0.75)/2	
	
} else {
	chartWidth = (chartWidth*0.75);
	height = height * 2;
}


x = d3.scaleLinear()
          .range([ 0, chartWidth - margin.left - margin.right]);

yImport = d3.scaleBand()
          .rangeRound([0, height/2])
          .paddingInner(0.1);

yExport = d3.scaleBand()
          .rangeRound([0, height/2])
          .paddingInner(0.1);

yAxisImport = d3.axisLeft(yImport)
yAxisExport = d3.axisLeft(yExport)

xAxis = d3.axisBottom(x)
	.tickSize(-height/2, 0, 0)
	.ticks(5);

	svgBarI = d3.select('#imports').append('svg')
        .attr("id","importsChart")
        .attr("width", chartWidth )
        .attr("height", (height/2)+ margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    svgBarI.append('g')
         .attr('class', 'x axis')
         .attr("transform", "translate(0, "+height/2+")")
         .call(xAxis)
         .append("text")
         .attr("y", 25)
         .attr("x",3*chartWidth/4)
         .attr("dy", ".71em")
         .style("text-anchor", "end")
         .attr("font-size","12px")
         .attr("fill","#666")
         .text("xAxisLabel");

     svgBarI.append('g')
           .attr('class', 'y axis')
           .call(yAxisImport);

     svgBarI.append('g').attr("class","barsI").selectAll('rect')
          .data([0,0,0,0,0])
          .enter()
          .append('rect')
          .attr("fill", "#D2376D")
          .attr("x", function(d){return x(0)})
	//Exports Bars
	svgBarE = d3.select('#exports').append('svg')
        .attr("id","exportsChart")
        .attr("width", chartWidth )
        .attr("height", (height/2)+ margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    svgBarE.append('g')
         .attr('class', 'x axis')
         .attr("transform", "translate(0, "+height/2+")")
         .call(xAxis)
         .append("text")
         .attr("y", 25)
         .attr("x",3*chartWidth/4)
         .attr("dy", ".71em")
         .style("text-anchor", "end")
         .attr("font-size","12px")
         .attr("fill","#666")
         .text("xAxisLabel");

     svgBarE.append('g')
           .attr('class', 'y axis')
           .call(yAxisExport);

     svgBarE.append('g').attr("class","barsE").selectAll('rect')
          .data([0,0,0,0,0])
          .enter()
          .append('rect')
          .attr("fill", "#B8860B")
          .attr("x", function(d){return x(0)})
		  
//adjust text position

d3.selectAll(".y text").attr("x", 5);	


//here be some stuff for making sparklines
xspark = d3.scaleTime()
    .range([0, chartWidth/12]);


ysparkI = d3.scaleLinear()
    .range([yImport.bandwidth()/5,0])
	
ysparkE = d3.scaleLinear()
    .range([yExport.bandwidth()/5,0])

    console.log(yExport.bandwidth())

xspark.domain([d3.timeParse("%Y")(yearssorted[0]),d3.timeParse("%Y")(yearssorted[yearssorted.length-1])])

ysparkI.domain([0,100000])
ysparkE.domain([0,100000])


xAxisSpark = d3.axisBottom(xspark).tickFormat("").tickSize(0)
yAxisSpark = d3.axisLeft(ysparkI).tickFormat("").tickSize(0)

//function to make a line
lineI = d3.line()
    .x(function(d) { return xspark(d.date); })
    .y(function(d) { return ysparkI(d.amt); });
	
//function to make a line
lineE = d3.line()
    .x(function(d) { return xspark(d.date); })
    .y(function(d) { return ysparkE(d.amt); });


    colour_palette =["#D2376D","#B8860B"]

svgSparkI = d3.select("#sparklineI")
              .append('svg')
              .attr("id","sparkchartI")
              //.style("background-color","#fff")
							.attr("width", chartWidth/3)
							.attr("height", height/2 + margin.top + margin.bottom )  //+30)
							.append("g")
              .attr("transform", "translate(" + 2 + "," + margin.top + ")");


svgSparkI.append('g')
		.attr('class', 'ysparkI axis')
		.call(yAxisSpark).select(".domain").remove();

svgSparkI.append('g')
		.attr('class', 'xspark axis')
		.call(xAxisSpark).select(".domain").remove();

svgSparkI.append('g').attr("id","sparkyI").selectAll('path')
		.data([
		  {
			"key": "1",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  },
		  {
			"key": "2",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  },
		  {
			"key": "3",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  },
		  {
			"key": "4",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  },
		  {
			"key": "5",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  }
		]
	 )
		.enter()
  .append('path')
  .style("fill", 'none')
			.style("stroke-width", 2)
			.style("stroke-linecap", 'round')
			.style("stroke-linejoin", 'round')
  .attr('d', function(d) {
	  return lineI(d.value);
  });


svgSparkE = d3.select("#sparklineE")
              .append('svg')
              .attr("id","sparkchartE")
              //.style("background-color","#fff")
							.attr("width", chartWidth/3)
							.attr("height", height/2 + margin.top + margin.bottom )  //+30)
							.append("g")
              .attr("transform", "translate(" + 2 + "," + margin.top + ")");


svgSparkE.append('g')
		.attr('class', 'ysparkE axis')
		.call(yAxisSpark).select(".domain").remove();

svgSparkE.append('g')
		.attr('class', 'xspark axis')
		.call(xAxisSpark).select(".domain").remove();

svgSparkE.append('g').attr("id","sparkyE").selectAll('path')
		.data([
		  {
			"key": "1",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  },
		  {
			"key": "2",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  },
		  {
			"key": "3",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  },
		  {
			"key": "4",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  },
		  {
			"key": "5",
			"value": [
			  {
				"date": "2012-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2013-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2014-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2015-01-01T00:00:00.000Z",
				"amt": "0"
			  },
			  {
				"date": "2016-01-01T00:00:00.000Z",
				"amt": "0"
			  }
			]
		  }
		]
	 )
		.enter()
  .append('path')
  .style("fill", 'none')
  .style("stroke-width", 2)
  .style("stroke-linecap", 'round')
  .style("stroke-linejoin", 'round')
  .attr('d', function(d) {
	  return lineE(d.value);
  });



                  d3.select("#sparklineI").select('svg')
                  .append('g')
                  .attr('class','perchangeI')
                  .attr("transform", "translate(" + 20 + "," + margin.top + ")");
				  
				  
                  d3.select("#sparklineE").select('svg')
                  .append('g')
                  .attr('class','perchangeE')
                  .attr("transform", "translate(" + 20 + "," + margin.top + ")");

//things for percentage change
            dummyarrayfortext=[1,2,3,4,5]

            dummyarrayfortext.forEach(function(d,i){
              d3.select(".perchangeI")
              .append('text')
              .attr('x',0)
              .attr('y',yImport.bandwidth()/5*i)
              .attr("text-anchor", "start")
              .style("font-size", "12px")
              .style("fill", "#666")
              .attr("font-family","'Open Sans', sans-serif")
              .text("");
            })
			
			dummyarrayfortext.forEach(function(d,i){
              d3.select(".perchangeE")
              .append('text')
              .attr('x',0)
              .attr('y',yExport.bandwidth()/5*i)
              .attr("text-anchor", "start")
              .style("font-size", "12px")
              .style("fill", "#666")
              .attr("font-family","'Open Sans', sans-serif")
              .text("");
            })

d3.select('#sparklineI').select("svg")
.append('text')
.attr("x",0)
.attr("y",20)
.text("5-year change")
.style("font-size", "14px")
.attr("font-family","'Open Sans', sans-serif");

d3.select('#imports').select("svg")
.append('text')
.attr("x",margin.left)
.attr("y",20)
.html("Top 5 <tspan style='font-weight:bold'>import</tspan> goods")
.style("font-size", "14px")
.attr("font-family","'Open Sans', sans-serif");

d3.select('#sparklineE').select("svg")
.append('text')
.attr("x",0)
.attr("y",20)
.text("5-year change")
.style("font-size", "14px")
.attr("font-family","'Open Sans', sans-serif");

d3.select('#exports').select("svg")
.append('text')
.attr("x",margin.left)
.attr("y",20)
.html("Top 5 <tspan style='font-weight:bold'>export</tspan> goods")
.style("font-size", "14px")
.attr("font-family","'Open Sans', sans-serif");


pymChild.sendHeight();


}// end BarchartInitial

}//end ready
}//end modernizr
else {
  var pymChild = new pym.Child();
  setInterval(function(){pymChild.sendHeight();},1000)
}
