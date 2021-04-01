class CreateApps < ActiveRecord::Migration[6.1]
  def change
    create_table :apps, id: :uuid do |t|
      t.string :name

      t.timestamps
    end
  end
end
