var GRAPH_WIDTH       = 700,
    GRAPH_HEIGHT      = 700,
    MAX_SIZE          = 25,
    MIN_SIZE          = 3,
    MAX_FONT_SIZE     = 36,
    MIN_FONT_SIZE     = 3,
    X_MARGIN          = 60,
    Y_MARGIN          = 60,
    TIMEOUT           = 2000,
    DURATION          = 1500,
    LABEL_SIZE_CUTOFF = 4,
    ZOOM_SPEED        = 0.3,
    MAX_ZOOM          = 10,
    MIN_ZOOM          = 1,
    LABEL_OFFSET      = 0.3,
    radius            = d3.scale.linear().domain([0,1]).range([MIN_SIZE, MAX_SIZE]),
    fontSize          = d3.scale.linear().domain([MIN_SIZE,MAX_SIZE]).range([MIN_FONT_SIZE, MAX_FONT_SIZE]).clamp(true),
    //siteCategory      = d3.scale.ordinal().domain(siteCategories).range(colorbrewer.Set3[11]);
    siteCategory      = d3.scale.category20();

var svg = setupGraph();
setupLegend(siteCategories);
setupEventListeners();

d3.json('frames3.json', function(frames) {
    var slider = $('#date-slider').slider({
        min: 0,
        max: frames.length - 1,
        range: "min",
        change: function(event, ui) {
            animate(frames[ui.value]);
        }
    });
    animate(frames[0]);
    d3.select('#play').on('click', function(d, i) { play(frames); });
});

function animate(frame, i) {
    // Calculate the denormalized position so we can use it later
    frame.nodes = frame.nodes.map(function(n) { 
        n.denormPosition = denormalizePosition(n.position);
        return n;
    });

    // Grab the selectors now so we don't have to keep doing it
    var nodes = svg.selectAll("g.node")
        .data(frame.nodes, function(n) { return n.id; })
    var links = svg.selectAll("line.link")
        .data(frame.links, function(l) { return l.id; })

    hideLinks(links);
    hideLabels(nodes);
    
    // Enter
    var group = addGroup(nodes.enter());
    addCircle(group);
    addText(group);
    addLink(frame, links.enter());

    // Event handlers
    nodes.on('click', highlightNode);

    // Update
    var updateTransition = updateGroup(nodes);
    updateCircle(updateTransition);
    updateText(updateTransition);
    updateLink(links, frame);

    // Exit
    var exit = nodes.exit(),
        exitTrans = exit.transition();
    exitTrans.select('circle').attr('r', 0);
    exitTrans.select('text.label').style('font-size', '0px');
    exitTrans.remove();
    links.exit().remove();

    // Keep slider in sync with playing
    if (typeof i != 'undefined') { $('#date-slider').slider('value', i); }

    updateFrameNarrative(frame);

    // Keep node-info in sync with data in node
    userSelected = d3.select('g.node.selected');
    if (!userSelected.empty()) { populateNodeInfo(userSelected.data()[0]); }

    // Show links
    var selectedNode = d3.select('g.node.selected');
    if (!d3.select('#show-edges:checked').empty()) {
        showLinks(d3.selectAll('line.link'));
    } else if (!selectedNode.empty()) {
        showLinks(getNodeLinks(selectedNode));
    }

    // Show labels
    if (!d3.select('#show-labels:checked').empty()) {
        showLabels(nodes);
    } else if (!d3.select('g.node.selected').empty()) {
        showLabels(d3.select('g.node.selected'));
    }

    // If selected nodes are removed, make everything normal again
    if (!exit.filter('.selected').empty()) {
        nodes.classed('not-selected', false).classed('selected', false);
        d3.select('#node-info').html('');
    }
}

function setupGraph() {
    var svg = d3.select("#graph")
        .append("svg")
        .attr("width", GRAPH_WIDTH)
        .attr("height", GRAPH_HEIGHT)
        .attr("pointer-events", "all")
        .append('g')
        .attr('id', 'zoom-wrap')
        .call(d3.behavior.zoom().scaleExtent([1, MAX_ZOOM]).on("zoom", redraw))
        .append('g');

    svg.append('svg:rect')
        .attr('width', GRAPH_WIDTH)
        .attr('height', GRAPH_HEIGHT)
        .attr('fill', 'white'); 

    svg.append('svg:defs')
        .append('svg:marker')
        .attr('id', 'triangle')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 1)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z');

    d3.select('#date-slider').style('width', (GRAPH_WIDTH - 2 * X_MARGIN) + 'px');
    d3.select('#graph-wrapper').style('width', GRAPH_WIDTH + 'px');

    return svg;
}

function setupLegend(siteCategories) {
    siteCategories.forEach(function(category) { 
        var div = d3.select('#legend').append('div');
        div.append('div').style('width', '50px').style('height', '50px')
        .style('background-color', function() { return siteCategory(category); });
        div.append('span').text(category);
    });
}

function setupEventListeners() {
    d3.select('#show-edges').on('click', function() {
        if (!d3.select(this).filter(':checked').empty()) {
            showLinks(d3.selectAll('line.link'));
        } else {
            setLinkEndAttr(d3.selectAll('line.link').classed('hidden', true));
        }
    });
    d3.select('#show-labels').on('click', function() {
        d3.select(this).filter(':checked').empty() ?
            hideLabels(d3.selectAll('g.node:not(.selected)')) :
            showLabels(d3.selectAll('g.node'));
    });
    d3.select('#graph').on('click', unhighlightNode, true);
}

function redraw() {
    xScale = d3.scale.linear().domain([-1 * (d3.event.scale - 1) * svg.node().getBBox().width, 0]).range([-1 * (d3.event.scale - 1) * svg.node().getBBox().width, 0]).clamp(true); 
    yScale = d3.scale.linear().domain([-1 * (d3.event.scale - 1) * svg.node().getBBox().height, 0]).range([-1 * (d3.event.scale - 1) * svg.node().getBBox().height, 0]).clamp(true); 
    d3.event.translate = [xScale(d3.event.translate[0]), yScale(d3.event.translate[1])];
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    d3.selectAll('circle').attr('r', function(n) { return radius(n.size) / d3.event.scale; });
    d3.selectAll('line.link').style('stroke-width', function() { return 1 / d3.event.scale; });
    d3.selectAll('text.label').style('font-size', function(n) {             
        var size = fontSize(radius(n.size)) / d3.event.scale;
        return size > LABEL_SIZE_CUTOFF / d3.event.scale ? size + 'px' : '0';
    }).attr('dy', function() { return LABEL_OFFSET + 'em'; });
}

function addGroup(nodes) { 
    var group = nodes
        .append("g")
        .attr("class", "node")
        .attr("transform", function(n) { return "translate("
            + n.denormPosition.x + "," + n.denormPosition.y + ")"; })
        .classed('not-selected', function() { return !d3.select('.not-selected').empty(); });
    return group;
}

function addLink(frame, links) {
    var newLinks = links 
        .insert("line", 'g.node')
        //    .style('marker-end', 'url(#triangle)')
        .attr("class", "link")
        .classed('hidden', true)
        .datum(function(l) { return updateInteralLinkPosition(l, frame); });

    minimizeLinks(newLinks);
}

function addCircle(group) {
    group
        .append('circle')
        .attr('r', 0)
        //.style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); });
        .style("fill", function(n) { return siteCategory(n.media_type); })
}

function addText(group) {
    group
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', LABEL_OFFSET + 'em')
        .attr('class', 'label')
        .text(function(n) { return n.label; })
        .classed('hidden', function(n) { return d3.select('#show-labels:checked').empty() || fontSize(radius(n.size)) < LABEL_SIZE_CUTOFF; })
        .style('font-size', function(n) {
            return fontSize(radius(n.size));
        });
}

function updateGroup(nodes) {
    var trans = nodes
        .transition()
        .duration(DURATION)
        .attr("transform", function(n) { return "translate("
            + n.denormPosition.x + "," + n.denormPosition.y + ")";
        });
    return trans;
}

function updateCircle(trans) {
    // Circle update
    trans
        .select('circle')
        .attr("r", function(n) { return radius(n.size); })
        //.style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); })
        .style("fill", function(n) { return siteCategory(n.media_type); })
}

function updateText(trans) {
    trans
        .select('text.label')
        .style('font-size', function(n) {
            return fontSize(radius(n.size));
        })
    //.each('end', function() { d3.select(this).attr('dy', '0.3em'); })
}

function updateLink(links, frame) {
    links.datum(function(l) { return updateInteralLinkPosition(l, frame); });
    minimizeLinks(links);
}

function updateFrameNarrative(frame) {
    if (frame.narrative) {
        d3.select('#frame-info').text(frame.narrative);
    } else {
        d3.select('#frame-info').text('');
    }
}

function showLabels(nodes) {
    nodes.selectAll('text.label')
        .classed('hidden', function(n) { return fontSize(radius(n.size)) < LABEL_SIZE_CUTOFF; })
}

function hideLabels(nodes) {
    nodes.selectAll('text.label')
        .classed('hidden', true);
}

function showLinks(links) {

    /*
    links.each(function(link) {
        d3.selectAll('g.node').filter(function(node) {
            return link.source == node.index;
        }).select('circle').transition().style('fill', '#ee2222').style('fill-opacity', 1);
        d3.selectAll('g.node').filter(function(node) {
            return link.target == node.index;
        }).select('circle').transition().style('fill', '#2222ee').style('fill-opacity', 1);
    })
    */

    maximizeLinks(links.classed('hidden', false).transition().duration(DURATION));
}

function hideLinks(links) {
    minimizeLinks(links.classed('hidden', true).transition());
}

function getNodeLinks(node) { 
    if (typeof node.datum == 'function') {
        var node = node.datum();
    }
    var links = d3.selectAll('line.link').filter(function(link) {
        return link.source == node.index || link.target == node.index;
    });
    return links;
}

function highlightNode(node) {
    d3.select(this).classed('selected', true);
    if (node.screenshot) {
        d3.select('#image').html('<img src="' + node.screenshot + '" />');
    } else {
        d3.select('#image').html('');
    }

    if (d3.select('#show-labels:checked').empty()) { 
        d3.selectAll('text.label').classed('hidden', true);
    }
    d3.select(this).select('text.label')
        .classed('hidden', false)
        .style('font-size', function(n) {
            return parseInt(d3.select(this).style('font-size')) < 16 ? 16 : fontSize(radius(node.size));
        });
    d3.selectAll('g.node').classed('not-selected', function(n) { return n != node; });
    populateNodeInfo(node);
    hideLinks(d3.selectAll('line.link'));
    showLinks(getNodeLinks(node));
}

function unhighlightNode() {
    d3.selectAll('g.node').classed('not-selected', false).classed('selected', false);
    hideLinks(d3.selectAll('line.link'));
    if (d3.select('#show-labels:checked').empty()) {
        hideLabels(d3.selectAll('g.node'));
    }
    d3.select('#node-info').html('');
}

function updateInteralLinkPosition(link, frame) {
    link.position = {
        x1: frame.nodes[link.source].denormPosition.x,
        y1: frame.nodes[link.source].denormPosition.y,
        x2: frame.nodes[link.target].denormPosition.x,
        y2: frame.nodes[link.target].denormPosition.y
    };
    return link;
}

function minimizeLinks(links) { 
    setLinkEndAttr(links);
}

function maximizeLinks(links) {
    setLinkEndAttr(links, true);
}

function setLinkEndAttr(links, maximized) {
    links
        .attr('x1', function(l) { return l.position.x1; })
        .attr('y1', function(l) { return l.position.y1; });
    if (maximized) {
        links
            .attr('x2', function(l) { return l.position.x2; })
            .attr('y2', function(l) { return l.position.y2; })
    } else {
        links
            .attr('x2', function(l) { return l.position.x1; })
            .attr('y2', function(l) { return l.position.y1; })
    }
}

function denormalizePosition(position) {
    return {
        x: position.x * (GRAPH_WIDTH - X_MARGIN * 2) + X_MARGIN,
        y: GRAPH_HEIGHT - position.y * (GRAPH_HEIGHT - Y_MARGIN * 2) - Y_MARGIN
    };
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

function play(frames) {
    frames.forEach(function(frame, i) {
        setTimeout(animate, i * TIMEOUT, frame, i);
    })
}
