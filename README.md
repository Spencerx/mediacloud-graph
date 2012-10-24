Mediacloud-Graph
================

Description
-----------
A collection of scripts to graph MediaCloud output.

_parse.rb_ is a simple Ruby script to parse the gexf MediaCloud output.  It goes 
through all the files in a directory, orders them by filename.to\_i, then uses
Nokogiri's SAX parser to spit out an array of "key frames" in JSON.

The JSON is read by _graph.js_, which uses d3 to generate a network graph.
The slider allows one to move between key frames while d3 tweens the graph.

To Do
-----
* Edges option
* Zooming (uhg)
* UI changes
* Week info (show dates and paragraphs)
* Play button tweaks
* Better positioning/sizing normalization
* More intelligent labeling code
* Performance
* Image (screenshot) integration?
* Stick Gephi Toolkit in pipeline to automate
* Integrate into something CMSy?

License
-------
AGPLv3

Copyright
---------
2012 President and Fellows of Harvard College
