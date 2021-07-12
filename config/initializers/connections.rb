# frozen_string_literal: true

# For backward compatibilty with existing query services.
# Will be removed once all the query services start using the new
# connection pooling library.
$connections = {}
# A thread safe map data structure.
$connection_pools = Concurrent::Map.new
