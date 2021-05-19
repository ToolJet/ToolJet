Rails.application.routes.draw do
  resources :apps, only: %i[index create show update] do
    resources :versions, only: %i[index create update]

    get '/users', to: 'apps#users'
  end

  resources :data_sources, only: %i[create index update] do
    post '/authorize_oauth2', to: 'data_sources#authorize_oauth2'
    collection do
      post '/test_connection', to: 'data_sources#test_connection'
      post '/fetch_oauth2_base_url', to: 'data_sources#fetch_oauth2_base_url'
    end
  end

  resources :data_queries, only: %i[create index update] do
    post '/run', to: 'data_queries#run'
  end

  resources :organizations, only: [] do
    get '/users', to: 'organizations#users'
  end

  resources :organization_users, only: [:create] do
    post '/change_role', to: 'organization_users#change_role'
  end

  resources :app_users, only: [:create]

  resources :folders, only: [:index, :create]

  resources :user do
    collection do
      post '/set_password_from_token', to: 'users#set_password_from_token'
    end
  end

  post 'authenticate', to: 'authentication#authenticate'
  post 'signup', to: 'authentication#signup'
end
