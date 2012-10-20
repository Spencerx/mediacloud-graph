require 'nokogiri'
require 'json/ext'

class MyDocument < Nokogiri::XML::SAX::Document
    def start_document
        @nodes = []
        @links = []
        @attributes = []
    end

    def end_document
        # Change links from node IDs to node indexes
        @links.map do |link|
            link['source'] = @nodes.index { |node| node['id'] == link['source'] }
            link['target'] = @nodes.index { |node| node['id'] == link['target'] }
            link
        end
        File.open('graph2.json', 'w').write({'nodes' => @nodes, 'links' => @links}.to_json)
    end

    def start_element name, attributes = []
        attributes = Hash[attributes]
        case name
        when 'attribute'
            @attributes << attributes
        when 'edge'
            @links << attributes.merge(attributes) { |key, value| value.to_i }
        when 'node'
            @active_node = {'id' => attributes['id'].to_i, 'label' => attributes['label']}
        when 'attvalue'
            attr = @attributes.select { |attr| attr['id'] == attributes['for'] }.first
            key = attr['title']
            case attr['type']
            when 'integer'
                @active_node[key] = attributes['value'].to_i
            when 'float'
                @active_node[key] = attributes['value'].to_f
            else
                @active_node[key] = attributes['value'] 
            end
        when 'spell'
        when 'viz:color'
            @active_node['color'] = {
                'r' => attributes['r'].to_i, 
                'g' => attributes['g'].to_i, 
                'b' => attributes['b'].to_i
            }
        end
    end

    def end_element name
        case name
        when 'node'
            @nodes << @active_node
        end
    end
end

# Create a new parser
parser = Nokogiri::XML::SAX::Parser.new(MyDocument.new)

# Feed the parser some XML
parser.parse(File.open('sopa_media_link_monthly_2010-10-02_2010-11-02.gexf'))
