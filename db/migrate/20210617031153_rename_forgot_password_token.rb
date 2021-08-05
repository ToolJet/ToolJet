class RenameForgotPasswordToken < ActiveRecord::Migration[6.1]
  def change
    rename_column :users, :forgot_password_sent_at, :forgot_password_token_sent_at
  end
end
