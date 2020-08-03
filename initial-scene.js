const width = 500;
const height = 500;
const margin = 50;
const yearStatsMap = new Map();
const commitsUrl = "https://api.github.com/repos/washingtonpost/data-police-shootings/commits";
const dataUrl = "https://raw.githubusercontent.com/washingtonpost/data-police-shootings/master/fatal-police-shootings-data.csv";
var data;
var yearStatsXBand;
var yearStatsYBand;
var yearStatsYears;
var yearStatsUpperLimit;
var lastCommitDate;

function YearStats() {
    this.totalCount = 0;
    this.statesCounts = new Map();
}

function processRow(row) {
    row.date = new Date(row.date);
    year = row.date.getFullYear();
    if (!yearStatsMap.has(year)) { yearStatsMap.set(year, new YearStats()) }
    incrementYearCounters(row.state, yearStatsMap.get(year));
    return row;
}

function incrementYearCounters(state, yearStats) {
    yearStats.totalCount += 1;
    if (!yearStats.statesCounts.has(state)) { yearStats.statesCounts.set(state, 0); }
    yearStats.statesCounts.set(state, yearStats.statesCounts.get(state) + 1);
}

function showTooltip(d) {
    d3.select("#tooltip")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .style("opacity", 1)
        .html("Total count: " + d[1].totalCount);

    showYearStats(d);
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
    data = await d3.csv(dataUrl, processRow);

    getChartParams();

    await getLastCommitDate();

    createBarChart();
}

function showYearStats(d) {
    const svg = d3.select("svg");
    const stats = Array.from(d[1].statesCounts.entries()).sort((a, b) => b[1] - a[1]);
    const top5 = stats.slice(0, 5);

    const yearStatsLegend = svg.append("g")
        .attr("transform", "translate(" + 500 + "," + 60 + ")");

    yearStatsLegend.selectAll("rect").data([true]).enter()
        .append("rect")
        .attr("x", 40)
        .attr("y", 200)
        .attr("width", 155)
        .attr("height", 135)
        .attr("class", "stats");

    yearStatsLegend.selectAll("legends").data([1]).enter()
        .append("text")
        .text("Top 5 states in " + d[0])
        .attr("x", 45)
        .attr("y", 220)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", "black")
        .attr("class", "stats");

    yearStatsLegend.selectAll("dots").data(top5).enter()
        .append("circle")
        .attr("cx", 50)
        .attr("cy", (d, i) => 238 + i * 20)
        .attr("r", 4)
        .attr("fill", "black")
        .attr("class", "stats");

    yearStatsLegend.selectAll("legends").data(top5).enter()
        .append("text")
        .text((d) => statesAbbr[d[0]] + ": " + d[1])
        .attr("x", 60)
        .attr("y", (d, i) => 243 + i * 20)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("fill", "black")
        .attr("class", "stats");

}

async function getLastCommitDate() {
    response = await fetch(commitsUrl);
    commits = await response.json();
    lastCommitDate = new Date(commits[0].commit.committer.date).toDateString();
    return true;
}

function getChartParams() {
    let maxValue = 0;
    let years = Array.from(yearStatsMap.keys());
    yearStatsMap.forEach(function(value) {
        if (value.totalCount > maxValue) {
            maxValue = value.totalCount;
        }
    });

    yearStatsUpperLimit = Math.ceil(maxValue / 100) * 100;

    yearStatsXBand = d3
        .scaleBand()
        .domain(years.sort())
        .range([0, width - margin * 2]);
    yearStatsYBand = d3
        .scaleLinear()
        .domain([0, yearStatsUpperLimit])
        .range([width - margin * 2, 0]);

}

function createBarChart() {
    const svg = d3.select("svg")
        .attr("width", width + 200)
        .attr("height", height);

    svg.append("text")
        .attr("x", (width + 200) / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("class", "title")
        .text("Number of deaths per year");

    svg.append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .selectAll("rect").data(Array.from(yearStatsMap.entries())).enter().append("rect")
        .attr("x", function(d) { return yearStatsXBand(d[0]) })
        .attr("y", function(d) { return yearStatsYBand(0) })
        .attr("width", function(d) { return yearStatsXBand.bandwidth() - 2 })
        .attr("height", function(d) { return (width - margin * 2) - yearStatsYBand(0) })
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    svg.selectAll("rect")
        .transition()
        .duration(2000)
        .attr("y", function(d) { return yearStatsYBand(d[1].totalCount) })
        .attr("height", function(d) { return (width - margin * 2) - yearStatsYBand(d[1].totalCount) })
        .delay((d, i) => i * 200);

    d3.select("svg").append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .call(d3.axisLeft(yearStatsYBand));
    d3.select("svg").append("g")
        .attr("transform", "translate(" + margin + "," + (width - margin) + ")")
        .call(d3.axisBottom(yearStatsXBand));

    svg.append('line')
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("x1", 425)
        .attr("y1", 240)
        .attr("x2", 425)
        .attr("y2", 240)
        .transition()
        .duration(500)
        .attr("x2", 480)
        .attr("y2", 150)
        .delay(() => 2000);

    svg.append('line')
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("x1", 480)
        .attr("y1", 150)
        .attr("x2", 480)
        .attr("y2", 150)
        .transition()
        .duration(500)
        .attr("x2", 520)
        .attr("y2", 150)
        .delay(() => 2350);

    svg.append('text')
        .transition()
        .delay(() => 2350)
        .attr("x", 500)
        .attr("y", 147)
        .attr("font-family", "Arial, Helvetica, sans-serif")
        .attr("font-size", "12")
        .text("Data current as of " + lastCommitDate);
}