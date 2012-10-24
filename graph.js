var width = 800,
    height = 800,
    MAX_SIZE = 40,
    MIN_SIZE = 1.5,
    X_MARGIN = 60,
    Y_MARGIN = 60,
    TIMEOUT = 3000,
    DURATION = 1500;

var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

var radius = d3.scale.linear().domain([0,1]).range([MIN_SIZE, MAX_SIZE]);

d3.json('frames.json', function(frames) {
    frames.forEach(function(frame, i) {
        setTimeout(go, i * TIMEOUT, frame);
    });
});

function go(frame) {
    var nodes = svg.selectAll("circle.node")
        .data(frame.nodes, function(n) { return n.id; })

        nodes.enter()
        .append("circle")
        .attr("class", "node")
        .attr('r', 0)
        .attr("cx", function(n) { return n.position.x * (width - X_MARGIN * 2) + X_MARGIN; })
        .attr("cy", function(n) { return n.position.y * (height - Y_MARGIN * 2) + Y_MARGIN; })
        .attr('id', function(n) { return n.id; })
        .style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); })

    nodes
        .transition()
        .duration(DURATION)
        //.ease('linear')
        .attr("r", function(n) { return radius(n.size); })
        .attr("cx", function(n) { return n.position.x * (width - X_MARGIN * 2) + X_MARGIN; })
        .attr("cy", function(n) { return n.position.y * (height - Y_MARGIN * 2) + Y_MARGIN; })
        .style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); });

    nodes.exit()
        .transition()
        .attr('r', 0)
        .remove();

    /*
    var links = svg.selectAll("line.link")
        .data(frame.links, function(l) { return l.id; });

    links.enter()
        .append("line")
        .attr("class", "link")
        .attr('x1', function(l) { console.log(l); return d3.select('#' + l.source).attr('cx'); })
        .attr('y1', function(l) { return d3.select('#' + l.source).attr('cy'); })
        .attr('x2', function(l) { return d3.select('#' + l.target).attr('cx'); })
        .attr('y2', function(l) { return d3.select('#' + l.target).attr('cy'); })
        .style("stroke-width", 0)
        .transition()
        .style("stroke-width", function(l) { return l.weight * 1.2; });

    links
        .transition()
        .attr('x1', function(l) { return d3.select('#' + l.source).attr('cx'); })
        .attr('y1', function(l) { return d3.select('#' + l.source).attr('cy'); })
        .attr('x2', function(l) { return d3.select('#' + l.target).attr('cx'); })
        .attr('y2', function(l) { return d3.select('#' + l.target).attr('cy'); });

    links.exit()
        .transition()
        .style('stroke-width', 0)
        .remove();
        */
}
