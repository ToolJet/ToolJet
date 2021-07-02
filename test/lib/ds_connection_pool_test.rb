require "test_helper"
include DataSourceConnectionPool


class MockQueryService
  attr_accessor :query_thunk, :data_source

  def initialize(data_source = AvailableDataSource::POSTGRES, query_thunk)
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
    connection = lambda do |query|
      query.call
    end
    connection
  end
end

class DsConnectionPoolTest < ActiveSupport::TestCase
  def create_thread_pool(pool_size)
    Concurrent::FixedThreadPool.new(pool_size)
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

    job = lambda do
      MockQueryService.new(sleep_query(processing_time_per_query)).process
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


    job = lambda do
      MockQueryService.new(sleep_query(processing_time_per_query)).process
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
    assert elapsed_time < (1 * processing_time_per_query + delta)
  end

  test "raises an exception if given an unsupported datasource type" do
    reset_connection_pool!()
    query_thunk = lambda { true }
    unsupported_ds = "PortalGun"
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
    lambda { sleep(processing_time_per_query) }
  end
end
