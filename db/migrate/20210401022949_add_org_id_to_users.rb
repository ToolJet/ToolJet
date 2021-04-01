class AddOrgIdToUsers < ActiveRecord::Migration[6.1]
  def change
    add_reference :users, :organization, index: true, type: :uuid
  end
end
