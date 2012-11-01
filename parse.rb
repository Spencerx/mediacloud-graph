require 'nokogiri'
require 'json/ext'

@@frames = []
@@folder_name = 'key_frames'
@@output_file = 'frames.json'

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
        @@frames << {'nodes' => @nodes, 'links' => @links}
    end

    def start_element name, attributes = []
        attributes = Hash[attributes]
        case name
        when 'attribute'
            @attributes << attributes
        when 'edge'
            @links << attributes.merge(attributes) { |key, value| value.to_i }
        when 'node'
            @active_node = {
                'id'    => attributes['id'].to_i,
                'label' => attributes['label'],
                'index' => @nodes.length
            }
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
        when 'viz:size'
            @active_node['size'] = attributes['value'].to_f
        when 'viz:position'
            @active_node['position'] = {
                'x' => attributes['x'].to_f,
                'y' => attributes['y'].to_f
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

filenames = Dir.entries(@@folder_name).reject! { |filename| filename[0] == '.' }.sort_by! { |filename| filename.to_i }

# Feed the parser some XML
#parser.parse(File.open('data/sopa_media_link_monthly_2010-10-02_2010-11-02.gexf'))
filenames.each do |filename|
    puts "#{@@folder_name}/#{filename}"
    parser.parse_file("#{@@folder_name}/#{filename}")
end

File.open(@@output_file, 'w') {|f| f.write(@@frames.to_json) }
