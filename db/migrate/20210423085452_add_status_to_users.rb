class AddStatusToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :organization_users, :status, :string, default: 'invited'
  end
end
