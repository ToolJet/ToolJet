# frozen_string_literal: true

# A thread safe map data structure.
$connection_pools = Concurrent::Map.new
