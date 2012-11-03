var GRAPH_WIDTH       = 700,
    GRAPH_HEIGHT      = 700,
    MAX_SIZE          = 25,
    MIN_SIZE          = 2,
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
    siteCategories    = 
["Blogger(s) (A web log, written by one or more individuals, that is not associated with a professional or advocacy organization or institution)",
"Gaming Site (Any website, forum, or news site related to gamers and/or gaming)",
"General Online News Media (A site that is a mainstream media outlet, such as The New York Times and The Washington Post; an online-only news outlet, such as Slate, Salon, or the Huffington Post; or a citizen journalism or non-profit news outlet, such as Global Voices or ProPublica)",
"Government (A site associated with and run by a government-affiliated entity, such as the DOJ website, White House blog, or a U.S. Senator's official website)",
"Independent Group (An academic or nonprofit group that is not affiliated with the private sector or government, such as the Electronic Frontier Foundation or the Center for Democracy and Technology)",
"News Aggregator (A site that contains little to no original content and compiles news from other sites, such as Yahoo News or Google News)",
"Private Sector (A non-news media for-profit actor, including, for instance, trade organizations, industry sites, and domain registrars)",
"Social Linking Site (A site that aggregates links based at least partially on user submissions and/or ranking, such as Reddit, Digg, Slashdot, MetaFilter, StumbleUpon, and other social news sites)",
"SOPA/PIPA/COICA-Specific Campaign (A site specifically dedicated to campaigning for or against SOPA, PIPA, or COICA, such as americancensorship.org, keepthewebopen.com, or sopastrike.com)",
"Tech Media (A site that focuses on technological news and information produced by a news organization, such as Arstechnica, Techdirt, or Wired.com)",
"User-Generated Content Platform, Networking Site, or Internet Tool (A general communication and networking platform or tool, like Wikipedia, YouTube, Twitter, and Scribd, or a search engine like Google or speech platform like the Daily Kos)"],
    siteCategory      = d3.scale.ordinal().domain(siteCategories).range(colorbrewer.Set3[11]);


var svg = d3.select("#graph")
    .append("svg")
        .attr("width", GRAPH_WIDTH)
        .attr("height", GRAPH_HEIGHT)
        .attr("pointer-events", "all")
        .append('g')
        .attr('id', 'zoom-wrap')
        .call(d3.behavior.zoom().scaleExtent([1, MAX_ZOOM]).on("zoom", redraw))
        .append('g')

siteCategories.forEach(function(category) { 
    var div = d3.select('#legend').append('div');
    div.append('div').style('width', '50px').style('height', '50px')
    .style('background-color', function() { return siteCategory(category); });
    div.append('span').text(category);
});
        
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
d3.select('#show-edges').on('click', function() {
    if (!d3.select(this).filter(':checked').empty()) {
        d3.selectAll('line.link')
            .classed('shown', true)
            .transition().duration(DURATION)
            .attr('x2', function(l) { return l.position.x2; })
            .attr('y2', function(l) { return l.position.y2; });
    } else {
        setLinkEndAttrs(d3.selectAll('line.link').classed('shown', false));
    }
});
d3.select('#show-labels').on('click', showLabels);


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

function showLabels() {
    if (!d3.select('#show-labels:checked').empty()) {
        d3.selectAll('text.label')
            .classed('hidden', function(n) { return fontSize(radius(n.size)) < LABEL_SIZE_CUTOFF; })
    } else {
        d3.selectAll('text.label').classed('hidden', true);
    }
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

function go(frame, i) {
    // Keep slider in sync with playing
    if (typeof i != 'undefined') { $('#date-slider').slider('value', i); }

    // Calculate the denormalized position so we can use it later
    frame.nodes = frame.nodes.map(function(n) { 
            n.denormPosition = denormalizePosition(n.position);
            return n;
    });

    // Grab the selectors now so we don't have to keep doing it
    var nodes = svg.selectAll("g.node")
        .data(frame.nodes, function(n) { return n.id; })
    var links = svg.selectAll("line.link")
        .data(frame.links, function(l) { return l.id; });

    var linkEnter = links.enter()
        .insert("line", 'g.node')
        .style('display', 'none')
    //    .style('marker-end', 'url(#triangle)')
        .attr("class", "link")
        .datum(function(l) { return updateInteralLinkPosition(l, frame); })
    setLinkEndAttrs(linkEnter);

    var selectedNode = d3.select('g.node.selected');
    if (!selectedNode.empty()) { showLinks(selectedNode.datum()); }

    var group = nodes.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(n) { return "translate("
            + n.denormPosition.x + "," + n.denormPosition.y + ")"; })
        .classed('not-selected', function() { return !d3.select('.not-selected').empty(); });

    group
        .append('circle')
        .attr('r', 0)
        //.style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); });
        .style("fill", function(n) { return siteCategory(n.media_type); })

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

    // Update
    var trans = nodes
        .transition()
        .duration(DURATION)
        .attr("transform", function(n) { return "translate("
            + n.denormPosition.x + "," + n.denormPosition.y + ")";
        });

    trans
        .select('circle')
        .attr("r", function(n) { return radius(n.size); })
        //.style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); })
        .style("fill", function(n) { return siteCategory(n.media_type); })

    trans
        .select('text.label')
        .style('font-size', function(n) {
            return fontSize(radius(n.size));
        })
        //.each('end', function() { d3.select(this).attr('dy', '0.3em'); })

    var hiddenLinks = links.datum(function(l) { return updateInteralLinkPosition(l, frame); }).filter(':not(.shown)'),
        shownLinks = links.filter('.shown').transition().duration(DURATION);
    setLinkEndAttrs(hiddenLinks);
    setLinkEndAttrs(shownLinks, true);

    // Exit
    var exit = nodes.exit(),
        exitTrans = exit.transition();

    exitTrans.select('circle').attr('r', 0);
    exitTrans.select('text.label').style('font-size', '0px');
    exitTrans.remove();

    links.exit().transition().style('stroke-width', 0).remove();

    // Keep node-info in sync with data in node
    userSelected = d3.select('g.node.selected');
    if (!userSelected.empty()) {
        populateNodeInfo(userSelected.data()[0]);
    }

    // If selected nodes are removed, make everything normal again
    if (!exit.filter('.selected').empty()) {
        nodes.classed('not-selected', false).classed('selected', false);
        d3.select('#node-info').html('');
    }

    showLabels();
    
    // Event handlers
    nodes.on('click', function() {
        var node = d3.select(this).data()[0];
        d3.select(this).classed('selected', true);
        if (d3.select('#show-labels:checked').empty()) { 
            d3.selectAll('text.label').classed('hidden', true);
        }
        d3.select(this).select('text.label')
            .classed('hidden', false)
            .style('font-size', function(n) {
                return parseInt(d3.select(this).style('font-size')) < 16 ? 16 : fontSize(radius(n.size));
            });
        nodes.classed('not-selected', function(n) { return n != node; });
        populateNodeInfo(node);
        setLinkEndAttrs(links);
        showLinks(node);
    });

    d3.select('#graph').on('click',
        function() {
            nodes.classed('not-selected', false).classed('selected', false);
            links.classed('shown', false);
            if (d3.select('#show-labels:checked').empty()) {
                d3.selectAll('text.label').classed('hidden', true);
            }
            d3.select('#node-info').html('');
        },
    // Capture
    true);
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

function showLinks(node) {
    var links = d3.selectAll('line.link').filter(function(link) {
        return link.source == node.index || link.target == node.index;
    });

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

    links
        .classed('shown', true)
        .transition().duration(DURATION)
        .attr('x2', function(l) { return l.position.x2; })
        .attr('y2', function(l) { return l.position.y2; });
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

function setLinkEndAttrs(links, maximized) {
    links
        .attr('x1', function(l) { return l.position.x1; })
        .attr('y1', function(l) { return l.position.y1; })
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

function play(frames) {
    frames.forEach(function(frame, i) {
        setTimeout(go, i * TIMEOUT, frame, i);
    })
}
