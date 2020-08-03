const width = 500;
const height = 500;
const color = d3.scaleOrdinal().range(d3.schemeSet2);
const raceStatsMap = new Map();
const legendsMap = {
    "W": "White",
    "B": "Black",
    "A": "Asian",
    "N": "Native American",
    "H": "Hispanic",
    "O": "Other",
    "": "Unknown"
};
var data;
var raceStatsXBand;
var raceStatsYBand;
var raceStatsYears;
var raceStatsUpperLimit;
var max = 0;

function RaceStats() {
    this.totalCount = 0;
    this.below15 = 0;
    this.below30 = 0;
    this.below45 = 0;
    this.below60 = 0;
    this.below75 = 0;
    this.above75 = 0;
}

function countByRace(row) {
    race = row.race;
    if (!raceStatsMap.has(race)) { raceStatsMap.set(race, new RaceStats()) }
    incrementStatsCounters(parseInt(row.age), raceStatsMap.get(race));
    return row;
}

function incrementStatsCounters(age, stats) {
    stats.totalCount += 1;
    if (age <= 15) { stats.below15 += 1; } else if (age <= 30) { stats.below30 += 1; } else if (age <= 45) { stats.below45 += 1; } else if (age <= 60) { stats.below60 += 1; } else if (age <= 75) { stats.below75 += 1; } else if (age > 75) { stats.above75 += 1; }
}

function showTooltip(d) {
    d3.select("#tooltip")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .style("opacity", 1)
        .html("Total count: " + d.data[1].totalCount);
    showRaceStats(d);
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

function getLegend(d) {
    return legendsMap[d[0]]
}

async function loadData() {
    data = await d3.csv(
        "https://raw.githubusercontent.com/washingtonpost/data-police-shootings/master/fatal-police-shootings-data.csv",
        countByRace);
    createPieChart();
}

function showRaceStats(d) {
    const svg = d3.select("svg");
    const stats = d.data[1];
    const counts = [
        ["0-15", stats.below15],
        ["16-30", stats.below30],
        ["31-45", stats.below45],
        ["46-60", stats.below60],
        ["61-75", stats.below75],
        ["75+", stats.above75],
    ]

    const raceStatsLegend = svg.append("g")
        .attr("transform", "translate(" + 450 + "," + 60 + ")");

    raceStatsLegend.selectAll("rect").data([true]).enter()
        .append("rect")
        .attr("x", 40)
        .attr("y", 200)
        .attr("width", 155)
        .attr("height", 155)
        .attr("class", "stats");

    raceStatsLegend.selectAll("legends").data([1]).enter()
        .append("text")
        .html("Count by age group ")
        .attr("x", 48)
        .attr("y", 220)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", "black")
        .attr("class", "stats");

    raceStatsLegend.selectAll("dots").data(counts).enter()
        .append("circle")
        .attr("cx", 50)
        .attr("cy", (d, i) => 238 + i * 20)
        .attr("r", 4)
        .attr("fill", "black")
        .attr("class", "stats");

    raceStatsLegend.selectAll("legends").data(counts).enter()
        .append("text")
        .text((d) => d[0] + ": " + d[1])
        .attr("x", 60)
        .attr("y", (d, i) => 243 + i * 20)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", "black")
        .attr("class", "stats");

}

function createPieChart() {
    let pie = d3.pie().value(d => d[1].totalCount)
    let arc = d3.arc().innerRadius(40).outerRadius(180);
    let data = Array.from(raceStatsMap.entries());

    const svg = d3.select("svg")
        .attr("width", width + 200)
        .attr("height", height);

    svg.append("text")
        .attr("x", (width + 200) / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("class", "title")
        .text("Number of deaths per race");

    svg.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
        .selectAll("path").data(pie(data)).enter().append("path")
        .transition().delay((d, i) => i * 100).duration(1000)
        .attrTween("d", d => {
            var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
            return function(t) {
                d.endAngle = i(t);
                return arc(d)
            }
        })
        .attr("fill", d => color(d.data[1].totalCount));

    svg.selectAll("path")
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);


    let legends = svg.append("g")
        .attr("transform", "translate(" + 457 + "," + 60 + ")");

    legends.selectAll("rect").data([true]).enter()
        .append("rect")
        .attr("x", 40)
        .attr("y", 10)
        .attr("width", 140)
        .attr("height", 147)
        .attr("class", "legend");

    legends.selectAll("dots").data(data).enter()
        .append("circle")
        .attr("cx", 50)
        .attr("cy", (d, i) => 25 + i * 20)
        .attr("r", 4)
        .attr("fill", d => color(d[1].totalCount));

    legends.selectAll("labels").data(data).enter()
        .append("text")
        .text(getLegend)
        .attr("x", 60)
        .attr("y", (d, i) => 28 + i * 20)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", d => color(d[1].totalCount));
}