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

    // Calculate the denormalized position so we can use it later
    frame.nodes = frame.nodes.map(function(n) { 
            n.denormPosition = denormalizePosition(n.position);
            return n;
    });

    var nodes = svg.selectAll("g.node")
        .data(frame.nodes, function(n) { return n.id; })

    var links = svg.selectAll("line.link")
        .data(frame.links, function(l) { return l.id; });

    links.enter()
        .insert("line", 'g.node')
        .attr("class", "link")
        .attr('x1', function(l) { return frame.nodes[l.source].denormPosition.x; })
        .attr('y1', function(l) { return frame.nodes[l.source].denormPosition.y; })
        .attr('x2', function(l) { return frame.nodes[l.target].denormPosition.x; })
        .attr('y2', function(l) { return frame.nodes[l.target].denormPosition.y; })
        .style('display', 'none');

    var group = nodes.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(n) {
            return "translate("
                + n.denormPosition.x
                + ","
                + n.denormPosition.y
                + ")";
        })
        .classed('not-selected', function() { return !d3.select('.not-selected').empty(); })


    group
        .append('circle')
        .attr('r', 0)
        .attr('id', function(n) { return n.index; })
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
        .attr("transform", function(n) {
            return "translate("
                + n.denormPosition.x
                + ","
                + n.denormPosition.y
                + ")";
        })

    trans
        .select('circle')
        .attr("r", function(n) { return radius(n.size); })
        .style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); })
    
    trans
        .select('text')
        .style('font-size', function(n) {
            var size = fontSize(radius(n.size));
            return size > LABEL_CUTOFF ? size + 'px' : '0';
        })

    links.filter('.shown').transition().duration(DURATION)
        .attr('x1', function(l) { return frame.nodes[l.source].denormPosition.x; })
        .attr('y1', function(l) { return frame.nodes[l.source].denormPosition.y; })
        .attr('x2', function(l) { return frame.nodes[l.target].denormPosition.x; })
        .attr('y2', function(l) { return frame.nodes[l.target].denormPosition.y; })

    links.filter(':not(.shown)')
        .attr('x1', function(l) { return frame.nodes[l.source].denormPosition.x; })
        .attr('y1', function(l) { return frame.nodes[l.source].denormPosition.y; })
        .attr('x2', function(l) { return frame.nodes[l.target].denormPosition.x; })
        .attr('y2', function(l) { return frame.nodes[l.target].denormPosition.y; })

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

    links.exit()
        .transition()
        .style('stroke-width', 0)
        .remove();

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
        showLinks(node);
    });

    svg.on('click',
        function() {
            nodes.classed('not-selected', false).classed('selected', false);
            links.classed('shown', false);
            d3.select('#node-info').html('');
        },
    // Capture
    true);
}

function convertXCoord(x) {
    return x * (width - X_MARGIN * 2) + X_MARGIN;
}

function convertYCoord(y) {
    return height - y * (height - Y_MARGIN * 2) - Y_MARGIN;
}

function denormalizePosition(position) {
    return { x: convertXCoord(position.x), y: convertYCoord(position.y) };
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

function showLinks(node) {
    d3.selectAll('line.link').filter(function(link) {
        return link.source == node.index || link.target == node.index;
    })
    .classed('shown', true);
}

d3.json('frames2.json', function(frames) {
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
