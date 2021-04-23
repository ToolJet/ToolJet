class AddInvitationtokenToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :invitation_token, :string
  end
end
