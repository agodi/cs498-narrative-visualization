const width = 500;
const height = 500;
const stateStatsMap = new Map();
const projection = d3.geoAlbersUsa().scale(700).translate([width / 2, height / 2]);
const geoUrl = "https://gist.githubusercontent.com/dwtkns/c6945b98afe6cc2fc410/raw/77de7bc07fc3974ec892aa6be46e7e035f637ea8/us.geojson";
var data;
var states = [];

function StateStats() {
    this.totalCount = 0;
    this.asianCount = 0;
    this.whiteCount = 0;
    this.hispanicCount = 0;
    this.blackCount = 0;
    this.otherCount = 0;
    this.unknownCount = 0;
    this.nativeCount = 0;
}

function countByState(row) {
    let state = row.state;
    if (!stateStatsMap.has(state)) { stateStatsMap.set(state, new StateStats()) }
    incrementStatsCounters(row.race, stateStatsMap.get(state));
    return row;
}

function incrementStatsCounters(race, stats) {
    switch (race) {
        case 'W':
            stats.whiteCount += 1;
            break;
        case 'B':
            stats.blackCount += 1;
            break;
        case 'A':
            stats.asianCount += 1;
            break;
        case 'H':
            stats.hispanicCount += 1;
            break;
        case 'N':
            stats.nativeCount += 1;
            break;
        case 'O':
            stats.otherCount += 1;
            break;
        default:
            stats.unknownCount += 1;
            break;
    }
    stats.totalCount += 1;
}

function showTooltip(d) {
    d3.select("#tooltip")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .style("opacity", 1)
        .html("Total count: " + stateStatsMap.get(d.properties.postal).totalCount);

    showStateStats(d);
}

function hideTooltip(d) {
    d3.select("#tooltip")
        .style("opacity", 0);

    d3.select("svg").selectAll(".stats").remove();
}

function moveTooltip(d) {
    d3.select("#tooltip")
        .style("left", (d3.event.pageX - 40) + "px")
        .style("top", (d3.event.pageY - 45) + "px");
}

async function loadData() {
    data = await d3.csv(
        "https://raw.githubusercontent.com/washingtonpost/data-police-shootings/master/fatal-police-shootings-data.csv",
        countByState);
    d3.json(geoUrl).then(createUSMap)
}

function showStateStats(d) {
    const svg = d3.select("svg");
    const stats = stateStatsMap.get(d.properties.postal);
    const counts = [
        ["Asian", stats.asianCount],
        ["Black", stats.blackCount],
        ["Hispanic", stats.hispanicCount],
        ["Other", stats.otherCount],
        ["Native", stats.nativeCount],
        ["White", stats.whiteCount],
        ["Unknown", stats.unknownCount]
    ]

    const stateStatsLegend = svg.append("g")
        .attr("transform", "translate(" + 500 + "," + 60 + ")");

    stateStatsLegend.selectAll("rect").data([true]).enter()
        .append("rect")
        .attr("x", 40)
        .attr("y", 200)
        .attr("width", 155)
        .attr("height", 170)
        .attr("class", "stats");

    stateStatsLegend.selectAll("legends").data([1]).enter()
        .append("text")
        .text("Count by race in " + d.properties.postal)
        .attr("x", 45)
        .attr("y", 220)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", "black")
        .attr("class", "stats");

    stateStatsLegend.selectAll("dots").data(counts).enter()
        .append("circle")
        .attr("cx", 50)
        .attr("cy", (d, i) => 238 + i * 20)
        .attr("r", 4)
        .attr("fill", "black")
        .attr("class", "stats");

    stateStatsLegend.selectAll("legends").data(counts).enter()
        .append("text")
        .text((d) => d[0] + ": " + d[1])
        .attr("x", 60)
        .attr("y", (d, i) => 243 + i * 20)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", "black")
        .attr("class", "stats");
}

function createUSMap(us) {
    const path = d3.geoPath().projection(projection);
    const totalCounts = Array.from(stateStatsMap.values()).map(stats => stats.totalCount);
    const maxCount = Math.max(...totalCounts);
    const color = d3.scaleSequential(d3.interpolateReds).domain([0, maxCount]);
    const top5 = Array.from(stateStatsMap.entries()).sort((a, b) => b[1].totalCount - a[1].totalCount).slice(0, 5);

    const svg = d3.select("svg")
        .attr("width", width + 200)
        .attr("height", height);

    svg.append("text")
        .attr("x", (width + 200) / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("class", "title")
        .text("Number of deaths per state");

    svg.append("g")
        .selectAll("path")
        .data(us.features).enter().append("path")
        .attr("class", "state")
        .attr("fill", d => color(stateStatsMap.get(d.properties.postal).totalCount))
        .attr("d", path)
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    const top10Legend = svg.append("g")
        .attr("transform", "translate(" + 530 + "," + 60 + ")");

    top10Legend.selectAll("rect").data([true]).enter()
        .append("rect")
        .attr("x", 40)
        .attr("y", 10)
        .attr("width", 95)
        .attr("height", 135)
        .attr("class", "legend");

    top10Legend.selectAll("dots").data(top5).enter()
        .append("circle")
        .attr("cx", 50)
        .attr("cy", (d, i) => 50 + i * 20)
        .attr("r", 4)
        .attr("fill", d => color(d[1].totalCount));

    top10Legend.selectAll("legends").data([1]).enter()
        .append("text")
        .text("Top 5")
        .attr("x", 70)
        .attr("y", (d, i) => 30)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", "black");

    top10Legend.selectAll("legends").data(top5).enter()
        .append("text")
        .text((d) => statesAbbr[d[0]])
        .attr("x", 60)
        .attr("y", (d, i) => 53 + i * 20)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", d => color(d[1].totalCount));
}