require "test_helper"
include DataSourceConnectionPool

class MockQueryService
  attr_accessor :query_thunk, :data_source

  def initialize(data_source, query_thunk)
    @query_thunk = query_thunk
    @data_source = data_source
  end

  def process
    connection_closure = lambda do
      create_connection
    end

    with_connection(data_source, connection_closure) do |conn|
      conn.call(query_thunk)
    end
  end

  private

  def create_connection
    current_data_source = data_source.dup
    connection = lambda do |query|
      query.call(current_data_source)
    end
    connection
  end
end

class DsConnectionPoolTest < ActiveSupport::TestCase
  def setup
    @org = Organization.create({ name: "ToolJet Test" })
    @org_admin = User.create({ first_name: "Admin", email: "admin@example.com", password: "password",
                               organization: @org })
    @org_user_admin = OrganizationUser.create(organization: @org, user: @org_admin, role: "admin", status: "active")

    @app = App.create({
      name: "Test App",
      organization: @org_admin.organization,
    })
  end

  def create_thread_pool(pool_size)
    Concurrent::FixedThreadPool.new(pool_size)
  end

  def create_data_source(type = "POSTGRES")
    DataSource.create!(
      name: "test",
      kind: type,
      app_id: @app.id,
    )
  end

  test "returns an updated connection pool when the current datasource is updated" do
    reset_connection_pool!()
    pg_data_source = create_data_source

    res = MockQueryService.new(pg_data_source, sleep_query(0.1)).process
    assert_equal(res.name, pg_data_source.name)

    # Update the datasource
    pg_data_source.update!(name: "Updated name")

    res = MockQueryService.new(pg_data_source, sleep_query(0.1)).process
    # Assert that the connection pool uses the fresh datasource
    assert_equal(res.name, "Updated name")
  end

  test "successfully resets connection_pool" do
    reset_connection_pool!()
    pg_data_source = create_data_source

    MockQueryService.new(pg_data_source, sleep_query(0.1)).process

    assert($connection_pools.keys.size > 0)

    reset_connection_pool!(pg_data_source.id)

    assert($connection_pools.keys.size == 0)
  end

  test "can successfully checkout CONNECTION_POOL_SIZE number of connections from a connection pool" do
    reset_connection_pool!()

    ENV["CONNECTION_POOL_SIZE"] = "5"
    ENV["CONNECTION_TIMEOUT"] = "1"

    thread_pool = create_thread_pool(ENV["CONNECTION_POOL_SIZE"].to_i)
    pg_data_source = create_data_source
    connection_closure = lambda { "i can run queries" }
    pool = get_connection_pool(pg_data_source, connection_closure)

    connections = Concurrent::Array.new
    # Let each thread from the thread pool checkout one connection from the connection pool and
    # store it in the variable `connections`.
    ENV["CONNECTION_POOL_SIZE"].to_i.times do
      submit_job_to_thread_pool(thread_pool, lambda { connections << pool.checkout })
    end

    thread_pool.shutdown
    thread_pool.wait_for_termination

    assert_equal(connections.size, ENV["CONNECTION_POOL_SIZE"].to_i)

    # Since we've checked out all the connections, the below block should raise a timeout error
    assert_raises(ConnectionPool::TimeoutError) do
      pool.checkout
    end
  end

  test "serial execution with a connection pool of size 1" do
    reset_connection_pool!()
    ENV["CONNECTION_POOL_SIZE"] = "1"

    # Please note, increasing these values will make the test suite run longer as it internally uses `sleep(n)`
    # to simulate the processing time.

    # Num of concurrent request hitting the connection pool (Integers only)
    num_concurrent_requests = 2

    # Per query processing time in seconds (Integers only)
    processing_time_per_query = 1

    # A thread pool to simulate concurrent query executions as part of concurrent requests
    request_thread_pool = create_thread_pool(num_concurrent_requests)

    pg_data_source = create_data_source
    job = lambda do
      MockQueryService.new(pg_data_source, sleep_query(processing_time_per_query)).process
    end

    t1 = Time.now

    # Simulate concurrent query executions using a threadpool
    num_concurrent_requests.times do
      submit_job_to_thread_pool(request_thread_pool, job)
    end

    request_thread_pool.shutdown
    request_thread_pool.wait_for_termination

    t2 = Time.now

    elapsed_time = t2 - t1
    assert elapsed_time > (num_concurrent_requests * processing_time_per_query)
  end

  test "concurrent query execution with connection pool of size greater than one" do
    reset_connection_pool!()
    # Please note, increasing these values will make the test suite run longer as it internally uses `sleep(n)`
    # to simulate the processing time.

    # Num of concurrent request hitting the connection pool (Integers only)
    num_concurrent_requests = 10

    # Per query processing time in seconds (Integers only)
    processing_time_per_query = 1

    # A thread pool to simulate concurrent query executions as part of concurrent requests
    request_thread_pool = create_thread_pool(num_concurrent_requests)

    # Set the connection pool size to the number of concurrent requests.
    ENV["CONNECTION_POOL_SIZE"] = num_concurrent_requests.to_s

    pg_data_source = create_data_source

    job = lambda do
      MockQueryService.new(create_data_source, sleep_query(processing_time_per_query)).process
    end

    t1 = Time.now

    # Simulate concurrent query executions using a threadpool
    num_concurrent_requests.times do
      submit_job_to_thread_pool(request_thread_pool, job)
    end

    request_thread_pool.shutdown
    request_thread_pool.wait_for_termination

    t2 = Time.now
    elapsed_time = t2 - t1
    delta = 1 # in secs
    assert elapsed_time < (processing_time_per_query + delta)
  end

  test "raises an exception if given an unsupported datasource type" do
    reset_connection_pool!()
    query_thunk = lambda { true }
    unsupported_ds = create_data_source("PortalGun")
    assert_raises(AvailableDataSource::UnSupportedSource) do
      MockQueryService.new(unsupported_ds, query_thunk).process
    end
  end

  def submit_job_to_thread_pool(thread_pool, thunk)
    thread_pool.post do
      thunk.call
    end
  end

  def sleep_query(processing_time_per_query)
    lambda do |arg = nil|
      sleep(processing_time_per_query)
      arg
    end
  end
end
