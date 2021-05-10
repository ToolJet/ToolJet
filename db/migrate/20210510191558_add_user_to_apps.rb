class AddUserToApps < ActiveRecord::Migration[6.1]
  def change
    add_reference :apps, :user, null: true, foreign_key: true, type: :uuid
  end
end
