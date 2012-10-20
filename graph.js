var width = 1200,
    height = 900;

var force = d3.layout.force()
    .size([width, height])
    .charge(-500);

var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

d3.json('graph.json', function(graph) {
    force
        .nodes(graph.nodes)
        .links(graph.links)
        .start();


    var link = svg.selectAll("line.link")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("class", "link")
        .style("stroke-width", function(l) { return l.weight * 3; });

    var node = svg.selectAll("circle.node")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", function(n) { return 10; return n.story_count * 4; })
        .style("fill", function(n) { return d3.rgb(n.color.r, n.color.g, n.color.b); });

    force.on("tick", function() {
        var q = d3.geom.quadtree(graph.nodes),
            i = 0,
            n = node.length;

        while (++i < n) {
            q.visit(collide(node[i]));
        }

        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });
});

function collide(node) {
  var r = node.radius + 16,
      nx1 = node.x - r,
      nx2 = node.x + r,
      ny1 = node.y - r,
      ny2 = node.y + r;
  return function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== node)) {
      var x = node.x - quad.point.x,
          y = node.y - quad.point.y,
          l = Math.sqrt(x * x + y * y),
          r = node.radius + quad.point.radius;
      if (l < r) {
        l = (l - r) / l * .5;
        node.x -= x *= l;
        node.y -= y *= l;
        quad.point.x += x;
        quad.point.y += y;
      }
    }
    return x1 > nx2
        || x2 < nx1
        || y1 > ny2
        || y2 < ny1;
  };
}

