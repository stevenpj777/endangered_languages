var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var svg = d3.select("body")
    .append("svg")
    .style("cursor", "move");

svg.attr("viewBox", "50 10 " + width + " " + height)
    .attr("preserveAspectRatio", "xMinYMin");

var zoom = d3.zoom()
    .on("zoom", function () {
        var transform = d3.zoomTransform(this);
        map.attr("transform", transform);
    });

svg.call(zoom);

var map = svg.append("g")
    .attr("class", "map");

d3.queue()
    .defer(d3.json, "src/data/50m.json")
    .defer(d3.json, "src/data/population.json")
    .await(function (error, world, data) {
        if (error) {
            console.error('Oh dear, something went wrong: ' + error);
        }
        else {
            drawMap(world, data);
        }
    });

function drawMap(world, data) {
    // geoMercator projection
    var projection = d3.geoMercator() //d3.geoOrthographic()
        .scale(130)
        .translate([width / 2, height / 1.5]);

    // geoPath projection
    var path = d3.geoPath().projection(projection);

    //colors for population metrics
    var color = d3.scaleThreshold()
        .domain([10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1500000000])
        .range(["#f7fcfd", "#e0ecf4", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#810f7c", "#4d004b"]);

    var features = topojson.feature(world, world.objects.countries).features;
    var populationById = {};

    data.forEach(function (d) {
        populationById[d.country] = {
            population: +d.population,
            females: +d.females,
            males: +d.males,
            year: +d.year,
            // language: d.language
            languages: +d.languages,
            speakers: +d.speakers

        }
    });
    features.forEach(function (d) {
        d.details = populationById[d.properties.name] ? populationById[d.properties.name] : {};
    });

    map.append("g")
        .selectAll("path")
        .data(features)
        .enter().append("path")
        .attr("name", function (d) {
            return d.properties.name;
        })
        .attr("id", function (d) {
            return d.id;
        })
        .attr("d", path)
        .style("fill", function (d) {
            return d.details && d.details.population ? color(d.details.population) : undefined;
        })
        .on('mouseover', function (d) {
            d3.select(this)
                .style("stroke", "blue")
                .style("stroke-width", 1)
                .style("cursor", "pointer");

            d3.select(".country")
                .text(d.properties.name);

            d3.select(".total")
                .text(d.details && d.details.population && "Population: " + d.details.population || "¯\\_(ツ)_/¯");

            d3.select(".languages")
                .text(d.details && d.details.languages && "# Langs: " + d.details.languages || "¯\\_(ツ)_/¯");

            d3.select(".speakers")
                .text(d.details && d.details.speakers && "Speakers: " + d.details.speakers || "¯\\_(ツ)_/¯");

            d3.select('.details')
                .style('visibility', "visible")
        })
        .on('mouseout', function (d) {
            d3.select(this)
                .style("stroke", null)
                .style("stroke-width", 0.25);

            d3.select('.details')
                .style('visibility', "hidden");
        });
}
