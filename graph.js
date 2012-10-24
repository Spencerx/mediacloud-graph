var width = 800,
    height = 800,
    MAX_SIZE = 50,
    MIN_SIZE = 1.5,
    MAX_FONT_SIZE = 48,
    MIN_FONT_SIZE = 8,
    X_MARGIN = 60,
    Y_MARGIN = 60,
    TIMEOUT = 3000,
    DURATION = 1500,
    LABEL_CUTOFF = 16;

var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

var radius = d3.scale.linear().domain([0,1]).range([MIN_SIZE, MAX_SIZE]);
var fontSize = d3.scale.linear().domain([LABEL_CUTOFF,MAX_SIZE]).range([MIN_FONT_SIZE, MAX_FONT_SIZE]).clamp(true);

d3.json('frames2.json', function(frames) {
    frames.forEach(function(frame, i) {
        setTimeout(go, i * TIMEOUT, frame);
    });
});

function go(frame) {
    var nodes = svg.selectAll("g.node")
        .data(frame.nodes, function(n) { return n.id; })

    // Enter
    var group = nodes.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(n) { return "translate(" + convertXCoord(n.position.x) + "," + convertYCoord(n.position.y) + ")"; });

    group
        .append('circle')
        .attr('r', 0)
        .attr('id', function(n) { return n.id; })
        .style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); });

    group
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.2em')
        .text(function(n) { return n.label; })
        .style('font-size', '0px');

    // Update
    var trans = nodes
        .transition()
        .duration(DURATION)
        .attr("transform", function(n) { return "translate(" + convertXCoord(n.position.x) + "," + convertYCoord(n.position.y) + ")"; });

    trans
        .select('circle')
        //.ease('linear')
        .attr("r", function(n) { return radius(n.size); })
        .style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); });
    
    trans
        .select('text')
        .style('font-size', function(n) {
            var size = fontSize(radius(n.size));
            return size > LABEL_CUTOFF ? size + 'px' : '0';
        });

    // Exit
    nodes.exit()
        .transition()
        .select('circle')
        .attr('r', 0)
        .remove();

    /*
    var links = svg.selectAll("line.link")
        .data(frame.links, function(l) { return l.id; });

    links.enter()
        .append("line")
        .attr("class", "link")
        .attr('x1', function(l) { return d3.select(nodes[0][l.source]).attr('cx'); })
        .attr('y1', function(l) { return d3.select(nodes[0][l.source]).attr('cy'); })
        .attr('x2', function(l) { return d3.select(nodes[0][l.target]).attr('cx'); })
        .attr('y2', function(l) { return d3.select(nodes[0][l.target]).attr('cy'); })
        .style("stroke-width", 0);

    links
        .transition()
        .attr('x1', function(l) { return d3.select(nodes[0][l.source]).attr('cx'); })
        .attr('y1', function(l) { return d3.select(nodes[0][l.source]).attr('cy'); })
        .attr('x2', function(l) { return d3.select(nodes[0][l.target]).attr('cx'); })
        .attr('y2', function(l) { return d3.select(nodes[0][l.target]).attr('cy'); })
        .style("stroke-width", 1);

    links.exit()
        .transition()
        .style('stroke-width', 0)
        .remove();
    //*/
}

function convertXCoord(x) {
    return x * (width - X_MARGIN * 2) + X_MARGIN;
}

function convertYCoord(y) {
    return height - y * (height - Y_MARGIN * 2) - Y_MARGIN;
}
