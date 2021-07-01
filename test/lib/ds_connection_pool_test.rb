require "test_helper"
include DsConnectionPool

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
    num_requests = 2
    # Per query processing time in seconds (Integers only)
    processing_time_per_query = 1

    request_thread_pool = create_thread_pool(num_requests)

    job = query_runner_thunk(create_ds_connection_closure, sleep_thunk(processing_time_per_query))

    t1 = Time.now

    num_requests.times do
      post_job(request_thread_pool, job)
    end

    request_thread_pool.shutdown
    request_thread_pool.wait_for_termination
    t2 = Time.now

    elapsed_time = t2 - t1
    assert elapsed_time > (num_requests * processing_time_per_query)
  end

  test "parallel query execution with connection pool of size greater than one" do
    reset_connection_pool!()
    # Please note, increasing these values will make the test suite run longer as it internally uses `sleep(n)`
    # to simulate the processing time.
    # Num of concurrent request hitting the connection pool (Integers only)
    num_requests = 3
    # Per query processing time in seconds (Integers only)
    processing_time_per_query = 1
    request_thread_pool = create_thread_pool(num_requests)

    # Set the connection pool size to the number of concurrent requests.
    ENV["CONNECTION_POOL_SIZE"] = num_requests.to_s

    job = query_runner_thunk(create_ds_connection_closure, sleep_thunk(processing_time_per_query))

    t1 = Time.now

    num_requests.times do
      post_job(request_thread_pool, job)
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
      query_runner_thunk(unsupported_ds, create_ds_connection_closure, query_thunk).call
    end
  end

  def post_job(thread_pool, thunk)
    thread_pool.post do
      thunk.call
    end
  end

  def sleep_thunk(processing_time_per_query)
    lambda { sleep(processing_time_per_query) }
  end

  def create_ds_connection_closure
    lambda do
      executer = lambda do |query|
        query.call()
      end
      executer
    end
  end

  def query_runner_thunk(ds_type = AvailableDataSource::POSTGRES, connection_closure, query_thunk)
    lambda do
      with_connection(ds_type, connection_closure) do |conn|
        conn.call(query_thunk)
      end
    end
  end
end
