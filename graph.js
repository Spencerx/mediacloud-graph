var width = 800,
    height = 800,
    MAX_SIZE = 20,
    MIN_SIZE = 2,
    MAX_FONT_SIZE = 36,
    MIN_FONT_SIZE = 3,
    X_MARGIN = 60,
    Y_MARGIN = 60,
    TIMEOUT = 2000,
    DURATION = 1500,
    LABEL_CUTOFF = 4;

var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

var radius = d3.scale.linear().domain([0,1]).range([MIN_SIZE, MAX_SIZE]);
var fontSize = d3.scale.linear().domain([LABEL_CUTOFF,MAX_SIZE]).range([MIN_FONT_SIZE, MAX_FONT_SIZE]).clamp(true);

d3.select('#date-slider').style('width', (width - 2 * X_MARGIN) + 'px');
d3.select('#graph-wrapper').style('width', width + 'px');

function play(frames) {
    frames.forEach(function(frame, i) {
        setTimeout(go, i * TIMEOUT, frame, i);
    })
}

function go(frame, i) {
    // Keep slider in sync with playing
    if (typeof i != 'undefined') { $('#date-slider').slider('value', i); }
    var nodes = svg.selectAll("g.node")
        .data(frame.nodes, function(n) { return n.id; })

    // Enter
    var group = nodes.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(n) {
            return "translate("
                + convertXCoord(n.position.x)
                + ","
                + convertYCoord(n.position.y)
                + ")";
        })
        .classed('not-selected', function() { return !d3.select('.not-selected').empty(); })

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
        .style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); })
    
    trans
        .select('text')
        .style('font-size', function(n) {
            var size = fontSize(radius(n.size));
            return size > LABEL_CUTOFF ? size + 'px' : '0';
        })

    // Exit
    var exit = nodes.exit(),
        exitTrans = exit.transition();

    exitTrans
        .select('circle')
        .attr('r', 0);

    exitTrans
        .select('text')
        .style('font-size', '0px');

    exitTrans.remove();

    // Keep node-info in sync with data in node
    userSelected = svg.select('g.node.selected');
    if (!userSelected.empty()) {
        populateNodeInfo(userSelected.data()[0]);
    }

    // If selected nodes are removed, make everything normal again
    if (!exit.filter('.selected').empty()) {
        nodes.classed('not-selected', false).classed('selected', false);
        d3.select('#node-info').html('');
    }
    
    // Event handlers
    nodes.on('click', function() {
        var node = d3.select(this).data()[0];
        d3.select(this).classed('selected', true);
        nodes.classed('not-selected', function(n) { return n != node; });
        populateNodeInfo(node);
    });

    svg.on('click',
        function() {
            nodes.classed('not-selected', false).classed('selected', false);
            d3.select('#node-info').html('');
        },
    // Capture
    true);

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

function populateNodeInfo(node) {
    d3.select('#node-info').html(
        Object.keys(node).map(
            function(key) {
                return '<dt>' + key + '</dt><dd>' + node[key] + '</dd>';
            }
        ).reduce(function(prev, curr) { return prev + curr; })
    );
}

d3.json('frames3.json', function(frames) {
    var slider = $('#date-slider').slider({
        min: 0,
        max: frames.length - 1,
        range: "min",
        change: function(event, ui) {
            go(frames[ui.value]);
        }
    });
    go(frames[0]);
    d3.select('#play').on('click', function(d, i) { play(frames); });
});
