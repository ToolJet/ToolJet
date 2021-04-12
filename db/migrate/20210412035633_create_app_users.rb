class CreateAppUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :app_users, id: :uuid do |t|
      t.references :app, null: false, foreign_key: true, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :role

      t.timestamps
    end
  end
end
