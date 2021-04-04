class AllowNullForDataSource < ActiveRecord::Migration[6.1]
  def change
    change_column_null :data_queries, :data_source_id, true
  end
end
