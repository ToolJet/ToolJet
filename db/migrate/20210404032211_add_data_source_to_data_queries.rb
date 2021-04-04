class AddDataSourceToDataQueries < ActiveRecord::Migration[6.1]
  def change
    add_reference :data_queries, :data_source, null: false, foreign_key: true, type: :uuid
  end
end
