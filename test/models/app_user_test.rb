# == Schema Information
#
# Table name: app_users
#
#  id         :uuid             not null, primary key
#  role       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  app_id     :uuid             not null
#  user_id    :uuid             not null
#
# Indexes
#
#  index_app_users_on_app_id   (app_id)
#  index_app_users_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (app_id => apps.id)
#  fk_rails_...  (user_id => users.id)
#
require 'test_helper'

class AppUserTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
